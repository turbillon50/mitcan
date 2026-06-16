"use client";

import { useCallback, useEffect, useId, useRef, useState, useTransition } from "react";
import {
  DEFAULT_BRAND,
  type BrandColors,
  type BrandContent,
  type CarouselItem,
  type HeroContent,
  type SectionsContent,
  type VideoContent,
} from "@/lib/brand-content";
import {
  resetCanvasDefaults,
  saveBrandCanvas,
  saveCarouselsCanvas,
  saveHeroCanvas,
  saveSectionsCanvas,
  saveVideoCanvas,
} from "@/app/admin/contenido/actions";
import { IconRotateCcw, IconX } from "@/components/icons";
import type { CanvasInitialData } from "./page";

type Tab = "brand" | "hero" | "carousel" | "video" | "sections";

const TABS: { id: Tab; label: string }[] = [
  { id: "brand", label: "Marca" },
  { id: "hero", label: "Hero" },
  { id: "carousel", label: "Carrusel" },
  { id: "video", label: "Video" },
  { id: "sections", label: "Secciones" },
];

const COLOR_FIELDS: { key: keyof BrandColors; label: string }[] = [
  { key: "primary", label: "Primario" },
  { key: "primaryDark", label: "Primario oscuro" },
  { key: "bg", label: "Fondo" },
  { key: "surface", label: "Superficie" },
  { key: "text", label: "Texto" },
  { key: "muted", label: "Texto suave" },
  { key: "accent", label: "Acento" },
];

const SECTION_FIELDS: { key: keyof SectionsContent; label: string }[] = [
  { key: "showHero", label: "Hero publico" },
  { key: "showCarousel", label: "Carrusel" },
  { key: "showVideo", label: "Video" },
  { key: "showCategorias", label: "Categorias" },
  { key: "showPromos", label: "Promociones" },
  { key: "showSucursales", label: "Sucursales" },
];

function makeId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `slide-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function colorInputValue(value: string, fallback: string) {
  return /^#[0-9a-fA-F]{6}$/.test(value) ? value : fallback;
}

function uploadLabel(kind: "logo" | "icon" | "media" | "poster" | "slide") {
  if (kind === "logo") return "Subir logo";
  if (kind === "icon") return "Subir icono";
  if (kind === "poster") return "Subir poster";
  if (kind === "slide") return "Subir imagen";
  return "Subir media";
}

async function uploadFile(file: File) {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch("/api/upload", { method: "POST", body: form });
  const data = (await res.json()) as { url?: string; error?: string };
  if (!res.ok || !data.url) throw new Error(data.error || "Error al subir archivo");
  return data.url;
}

function UploadButton({
  kind,
  accept = "image/*",
  onUploaded,
}: {
  kind: "logo" | "icon" | "media" | "poster" | "slide";
  accept?: string;
  onUploaded: (url: string) => void;
}) {
  const id = useId();
  const [busy, setBusy] = useState(false);

  async function onChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      onUploaded(await uploadFile(file));
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setBusy(false);
      event.target.value = "";
    }
  }

  return (
    <label
      htmlFor={id}
      className={`btn-ghost cursor-pointer px-4 py-3 text-sm ${busy ? "pointer-events-none opacity-60" : ""}`}
    >
      {busy ? "Subiendo..." : uploadLabel(kind)}
      <input id={id} type="file" accept={accept} onChange={onChange} className="hidden" />
    </label>
  );
}

function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-xs text-on-bg-muted">{hint}</span> : null}
    </label>
  );
}

function ColorField({
  label,
  value,
  fallback,
  onChange,
}: {
  label: string;
  value: string;
  fallback: string;
  onChange: (value: string) => void;
}) {
  return (
    <Field label={label}>
      <div className="flex items-center gap-3 rounded-xl border border-hairline bg-surface-2 p-2">
        <input
          type="color"
          value={colorInputValue(value, fallback)}
          onChange={(event) => onChange(event.target.value.toUpperCase())}
          className="h-12 w-14 cursor-pointer rounded-lg border-0 bg-transparent p-0"
          aria-label={label}
        />
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="input border-0 bg-transparent font-mono uppercase focus:ring-0"
          placeholder={fallback}
        />
      </div>
    </Field>
  );
}

function SaveButton({
  pending,
  saved,
  onClick,
}: {
  pending: boolean;
  saved: boolean;
  onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} disabled={pending} className="btn-primary px-6 py-3 text-base">
      {saved ? "Guardado" : pending ? "Guardando..." : "Guardar"}
    </button>
  );
}

function Toggle({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex items-center justify-between gap-4 rounded-xl border border-hairline bg-surface-2 px-4 py-3 text-left"
    >
      <span className="font-semibold">{label}</span>
      <span
        className={`flex h-7 w-12 items-center rounded-full p-1 transition ${
          checked ? "justify-end bg-primary" : "justify-start bg-surface-3"
        }`}
      >
        <span className="h-5 w-5 rounded-full bg-white shadow" />
      </span>
    </button>
  );
}

type CanvasDraftState = {
  brand: BrandContent;
  hero: HeroContent;
  carousels: CarouselItem[];
  video: VideoContent;
  sections: SectionsContent;
};

export default function CanvasEditor({ initial }: { initial: CanvasInitialData }) {
  const [active, setActive] = useState<Tab>("brand");
  const [brand, setBrand] = useState(initial.brand);
  const [hero, setHero] = useState(initial.hero);
  const [carousels, setCarousels] = useState(initial.carousels);
  const [video, setVideo] = useState(initial.video);
  const [sections, setSections] = useState(initial.sections);
  const [saved, setSaved] = useState<Tab | null>(null);
  const [pending, startTransition] = useTransition();
  const [resetOpen, setResetOpen] = useState(false);
  const [resetPending, startReset] = useTransition();
  const [previewConnected, setPreviewConnected] = useState(false);

  const [device, setDevice] = useState<"mobile" | "desktop">("mobile");
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const draftRef = useRef<CanvasDraftState>(initial);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const deviceWidth = device === "mobile" ? 390 : 1280;
  const targetOrigin = typeof window !== "undefined" ? window.location.origin : "";

  const postDraftNow = useCallback(() => {
    const win = iframeRef.current?.contentWindow;
    if (!win || !targetOrigin) return;
    try {
      win.postMessage({ type: "canvas-draft", draft: draftRef.current }, targetOrigin);
    } catch {}
  }, [targetOrigin]);

  const postDraftDebounced = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => postDraftNow(), 150);
  }, [postDraftNow]);

  function syncDraftRef(patch: Partial<CanvasDraftState>) {
    draftRef.current = { ...draftRef.current, ...patch };
  }

  function markPreviewReconnecting() {
    setPreviewConnected(false);
    if (reconnectRef.current) clearTimeout(reconnectRef.current);
    reconnectRef.current = setTimeout(() => setPreviewConnected(false), 4000);
  }

  function markSaved(tab: Tab) {
    setSaved(tab);
    window.setTimeout(() => setSaved(null), 1800);
  }

  function save(tab: Tab) {
    startTransition(async () => {
      try {
        if (tab === "brand") await saveBrandCanvas(brand);
        if (tab === "hero") await saveHeroCanvas(hero);
        if (tab === "carousel") await saveCarouselsCanvas(carousels);
        if (tab === "video") await saveVideoCanvas(video);
        if (tab === "sections") await saveSectionsCanvas(sections);
        markSaved(tab);
      } catch (err) {
        alert((err as Error).message);
      }
    });
  }

  function confirmReset() {
    startReset(async () => {
      try {
        const defaults = await resetCanvasDefaults();
        setBrand(defaults.brand);
        setHero(defaults.hero);
        setCarousels(defaults.carousels);
        setVideo(defaults.video);
        setSections(defaults.sections);
        draftRef.current = defaults;
        setResetOpen(false);
        postDraftNow();
      } catch (err) {
        alert((err as Error).message);
      }
    });
  }

  useEffect(() => {
    draftRef.current = { brand, hero, carousels, video, sections };
    postDraftDebounced();
  }, [brand, hero, carousels, video, sections, postDraftDebounced]);

  useEffect(() => {
    function onMsg(e: MessageEvent) {
      if (e.origin !== targetOrigin) return;
      if (e.data?.type === "canvas-ready") {
        if (reconnectRef.current) clearTimeout(reconnectRef.current);
        setPreviewConnected(true);
        postDraftNow();
      }
    }
    window.addEventListener("message", onMsg);
    return () => {
      window.removeEventListener("message", onMsg);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
    };
  }, [postDraftNow, targetOrigin]);

  function updateBrand<K extends keyof BrandContent>(key: K, value: BrandContent[K]) {
    setBrand((current) => {
      const next = { ...current, [key]: value };
      syncDraftRef({ brand: next });
      return next;
    });
  }

  function updateColor(key: keyof BrandColors, value: string) {
    setBrand((current) => {
      const next = {
        ...current,
        colors: { ...current.colors, [key]: value },
      };
      syncDraftRef({ brand: next });
      queueMicrotask(() => postDraftNow());
      return next;
    });
  }

  function updateSlide(index: number, patch: Partial<CarouselItem>) {
    setCarousels((current) =>
      current.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item))
    );
  }

  function moveSlide(index: number, direction: -1 | 1) {
    setCarousels((current) => {
      const target = index + direction;
      if (target < 0 || target >= current.length) return current;
      const next = [...current];
      const [item] = next.splice(index, 1);
      next.splice(target, 0, item);
      return next;
    });
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="section-title text-2xl">Canvas de marca</h1>
          <p className="mt-2 max-w-2xl text-sm text-on-bg-muted">
            Controla la portada publica, medios, colores y secciones visibles. Los cambios se ven en el preview en vivo antes de guardar.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setResetOpen(true)}
          className="btn-ghost shrink-0 gap-2 px-4 py-3 text-sm"
        >
          <IconRotateCcw size={16} /> Restablecer diseno predeterminado
        </button>
      </div>

      {resetOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="presentation">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="reset-canvas-title"
            className="w-full max-w-md rounded-2xl border border-hairline bg-surface p-6 shadow-card"
          >
            <div className="flex items-start justify-between gap-4">
              <h2 id="reset-canvas-title" className="text-lg font-bold">
                Restablecer diseno predeterminado
              </h2>
              <button
                type="button"
                onClick={() => setResetOpen(false)}
                className="btn-ghost h-9 w-9 shrink-0 px-0"
                aria-label="Cerrar"
              >
                <IconX size={18} />
              </button>
            </div>
            <p className="mt-3 text-sm text-on-bg-muted">
              Esto restaura colores, hero, carrusel, video y secciones al diseno original. No afecta productos, categorias, precios, sucursales ni usuarios.
            </p>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setResetOpen(false)} className="btn-ghost px-4 py-3">
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmReset}
                disabled={resetPending}
                className="btn-danger px-4 py-3"
              >
                {resetPending ? "Restableciendo..." : "Si, restablecer"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="mb-2 flex gap-2 overflow-x-auto rounded-2xl border border-hairline bg-surface p-2">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActive(tab.id)}
            className={`shrink-0 rounded-xl px-4 py-2.5 text-sm font-bold transition ${
              active === tab.id ? "bg-primary text-white shadow-glow" : "text-on-bg-muted hover:bg-surface-2"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <section className="min-w-0">
        {active === "brand" ? (
          <div className="card flex flex-col gap-5 p-5">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Nombre de la app">
                <input
                  value={brand.appName}
                  onChange={(event) => updateBrand("appName", event.target.value)}
                  className="input min-h-12 text-base"
                  placeholder="CSN"
                />
              </Field>
              <Field label="Tagline">
                <input
                  value={brand.tagline}
                  onChange={(event) => updateBrand("tagline", event.target.value)}
                  className="input min-h-12 text-base"
                  placeholder="Carnes Selectas"
                />
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Logo URL">
                <div className="flex gap-2">
                  <input
                    value={brand.logoUrl}
                    onChange={(event) => updateBrand("logoUrl", event.target.value)}
                    className="input min-h-12 text-base"
                    placeholder="/assets/logo-badge.png"
                  />
                  <UploadButton kind="logo" onUploaded={(url) => updateBrand("logoUrl", url)} />
                </div>
              </Field>
              <Field label="Icono URL">
                <div className="flex gap-2">
                  <input
                    value={brand.iconUrl}
                    onChange={(event) => updateBrand("iconUrl", event.target.value)}
                    className="input min-h-12 text-base"
                    placeholder="/icons/favicon.svg"
                  />
                  <UploadButton kind="icon" onUploaded={(url) => updateBrand("iconUrl", url)} />
                </div>
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {COLOR_FIELDS.map((field) => (
                <ColorField
                  key={field.key}
                  label={field.label}
                  value={brand.colors[field.key]}
                  fallback={DEFAULT_BRAND.colors[field.key]}
                  onChange={(value) => updateColor(field.key, value)}
                />
              ))}
            </div>

            <SaveButton pending={pending} saved={saved === "brand"} onClick={() => save("brand")} />
          </div>
        ) : null}

        {active === "hero" ? (
          <div className="card flex flex-col gap-5 p-5">
            <Field label="Titulo">
              <textarea
                value={hero.titulo}
                onChange={(event) => setHero((current) => ({ ...current, titulo: event.target.value }))}
                className="input min-h-28 text-lg font-semibold leading-tight"
              />
            </Field>
            <Field label="Subtitulo">
              <textarea
                value={hero.subtitulo}
                onChange={(event) => setHero((current) => ({ ...current, subtitulo: event.target.value }))}
                className="input min-h-24 text-base"
              />
            </Field>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Texto CTA">
                <input
                  value={hero.cta_text}
                  onChange={(event) => setHero((current) => ({ ...current, cta_text: event.target.value }))}
                  className="input min-h-12 text-base"
                />
              </Field>
              <Field label="Link CTA">
                <input
                  value={hero.cta_href}
                  onChange={(event) => setHero((current) => ({ ...current, cta_href: event.target.value }))}
                  className="input min-h-12 text-base"
                  placeholder="/sign-up"
                />
              </Field>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Tipo de media">
                <select
                  value={hero.mediaType}
                  onChange={(event) =>
                    setHero((current) => ({
                      ...current,
                      mediaType: event.target.value === "video" ? "video" : "image",
                    }))
                  }
                  className="input min-h-12 text-base"
                >
                  <option value="image">Imagen</option>
                  <option value="video">Video</option>
                </select>
              </Field>
              <Field label="Media URL">
                <div className="flex gap-2">
                  <input
                    value={hero.mediaUrl}
                    onChange={(event) => setHero((current) => ({ ...current, mediaUrl: event.target.value }))}
                    className="input min-h-12 text-base"
                    placeholder="/assets/logo-hero.png"
                  />
                  {hero.mediaType === "image" ? (
                    <UploadButton kind="media" onUploaded={(url) => setHero((current) => ({ ...current, mediaUrl: url }))} />
                  ) : null}
                </div>
              </Field>
            </div>
            <Field label="Poster URL">
              <div className="flex gap-2">
                <input
                  value={hero.posterUrl}
                  onChange={(event) => setHero((current) => ({ ...current, posterUrl: event.target.value }))}
                  className="input min-h-12 text-base"
                  placeholder="Opcional para video"
                />
                <UploadButton kind="poster" onUploaded={(url) => setHero((current) => ({ ...current, posterUrl: url }))} />
              </div>
            </Field>
            <SaveButton pending={pending} saved={saved === "hero"} onClick={() => save("hero")} />
          </div>
        ) : null}

        {active === "carousel" ? (
          <div className="card flex flex-col gap-4 p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-bold">Slides</h2>
                <p className="text-sm text-on-bg-muted">Ordena, edita captions y asigna links opcionales.</p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setCarousels((current) => [
                    ...current,
                    { id: makeId(), image: "", caption: "", link: "" },
                  ])
                }
                className="btn-ghost px-4 py-3"
              >
                Agregar slide
              </button>
            </div>
            {carousels.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-hairline bg-surface-2 p-8 text-center text-sm text-on-bg-muted">
                Sin slides. Agrega uno para activar el carrusel.
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {carousels.map((item, index) => (
                  <div key={item.id} className="grid gap-3 rounded-2xl border border-hairline bg-surface-2 p-3 md:grid-cols-[128px_1fr_auto]">
                    <div className="min-h-24 overflow-hidden rounded-xl bg-surface-3">
                      {item.image ? (
                        <img src={item.image} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs text-on-bg-muted">Sin imagen</div>
                      )}
                    </div>
                    <div className="grid gap-3">
                      <Field label="Imagen">
                        <div className="flex gap-2">
                          <input
                            value={item.image}
                            onChange={(event) => updateSlide(index, { image: event.target.value })}
                            className="input min-h-12"
                            placeholder="https://..."
                          />
                          <UploadButton kind="slide" onUploaded={(url) => updateSlide(index, { image: url })} />
                        </div>
                      </Field>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <Field label="Caption">
                          <input
                            value={item.caption}
                            onChange={(event) => updateSlide(index, { caption: event.target.value })}
                            className="input min-h-12"
                          />
                        </Field>
                        <Field label="Link">
                          <input
                            value={item.link}
                            onChange={(event) => updateSlide(index, { link: event.target.value })}
                            className="input min-h-12"
                            placeholder="/sign-up"
                          />
                        </Field>
                      </div>
                    </div>
                    <div className="flex gap-2 md:flex-col">
                      <button type="button" onClick={() => moveSlide(index, -1)} className="btn-ghost h-10 w-10 px-0" aria-label="Subir slide">
                        ↑
                      </button>
                      <button type="button" onClick={() => moveSlide(index, 1)} className="btn-ghost h-10 w-10 px-0" aria-label="Bajar slide">
                        ↓
                      </button>
                      <button
                        type="button"
                        onClick={() => setCarousels((current) => current.filter((slide) => slide.id !== item.id))}
                        className="btn-danger h-10 w-10 px-0"
                        aria-label="Eliminar slide"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <SaveButton pending={pending} saved={saved === "carousel"} onClick={() => save("carousel")} />
          </div>
        ) : null}

        {active === "video" ? (
          <div className="card flex flex-col gap-5 p-5">
            <Field label="Titulo">
              <input
                value={video.titulo}
                onChange={(event) => setVideo((current) => ({ ...current, titulo: event.target.value }))}
                className="input min-h-12 text-base"
              />
            </Field>
            <Field label="Video URL" hint="Acepta video directo, YouTube o Vimeo.">
              <input
                value={video.url}
                onChange={(event) => setVideo((current) => ({ ...current, url: event.target.value }))}
                className="input min-h-12 text-base"
                placeholder="https://..."
              />
            </Field>
            <Field label="Poster">
              <div className="flex gap-2">
                <input
                  value={video.poster}
                  onChange={(event) => setVideo((current) => ({ ...current, poster: event.target.value }))}
                  className="input min-h-12 text-base"
                  placeholder="https://..."
                />
                <UploadButton kind="poster" onUploaded={(url) => setVideo((current) => ({ ...current, poster: url }))} />
              </div>
            </Field>
            <SaveButton pending={pending} saved={saved === "video"} onClick={() => save("video")} />
          </div>
        ) : null}

        {active === "sections" ? (
          <div className="card flex flex-col gap-5 p-5">
            <div className="grid gap-3 md:grid-cols-2">
              {SECTION_FIELDS.map((field) => (
                <Toggle
                  key={field.key}
                  label={field.label}
                  checked={sections[field.key]}
                  onChange={(checked) => setSections((current) => ({ ...current, [field.key]: checked }))}
                />
              ))}
            </div>
            <SaveButton pending={pending} saved={saved === "sections"} onClick={() => save("sections")} />
          </div>
        ) : null}
      </section>

      {/* LIVE PREVIEW PANEL — iframe de la app real con updates via postMessage */}
      <section>
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold">Vista previa en vivo (antes de guardar)</span>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                  previewConnected
                    ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                    : "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    previewConnected ? "bg-emerald-500" : "animate-pulse bg-amber-500"
                  }`}
                />
                {previewConnected ? "Preview conectado" : "Reconectando..."}
              </span>
            </div>
            <div className="text-xs text-on-bg-muted">Iframe renderiza la landing pública real. Cambios de colores, hero, carrusel y secciones aparecen al instante.</div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setDevice("mobile")}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${device === "mobile" ? "bg-primary text-white" : "border border-hairline bg-surface-2 text-on-bg-muted hover:text-on-bg"}`}
            >
              Móvil 390px
            </button>
            <button
              type="button"
              onClick={() => setDevice("desktop")}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${device === "desktop" ? "bg-primary text-white" : "border border-hairline bg-surface-2 text-on-bg-muted hover:text-on-bg"}`}
            >
              Escritorio 1280px
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-hairline bg-[#0a0a0a] p-3">
          <div className="overflow-auto" style={{ maxHeight: 680 }}>
            <iframe
              ref={iframeRef}
              src="/?canvasPreview=1"
              style={{
                width: `${deviceWidth}px`,
                height: "660px",
                background: "#fff",
                border: "1px solid #222",
                display: "block",
                margin: "0 auto",
              }}
              title="Preview en vivo de la app pública"
              onLoad={() => {
                markPreviewReconnecting();
                postDraftNow();
              }}
            />
          </div>
        </div>
        <p className="mt-2 text-[11px] text-on-bg-muted">
          Navega dentro del preview (links, botones) para ver otras páginas públicas (/catalogo, /pedido, /sucursales) con la marca y colores aplicados en tiempo real. Toggle móvil/escritorio para validar responsive.
        </p>
      </section>
    </div>
  );
}
