"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Camera, Loader2, X, Star, ArrowLeft, ArrowRight } from "lucide-react";

/** Multi-image gallery field with phone camera/gallery upload (Vercel Blob).
 *  Submits a JSON array of URLs in a hidden input `imagenes`.
 *  The first image is the cover (portada) and is also saved as `imagen_url`. */
export default function GalleryUpload({ defaultUrls }: { defaultUrls?: string[] }) {
  const [urls, setUrls] = useState<string[]>(defaultUrls?.filter(Boolean) ?? []);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [manual, setManual] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setBusy(true);
    setErr(null);
    try {
      const added: string[] = [];
      for (const file of files) {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Error al subir");
        added.push(data.url);
      }
      setUrls((u) => [...u, ...added]);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function remove(i: number) {
    setUrls((u) => u.filter((_, idx) => idx !== i));
  }
  function move(i: number, dir: -1 | 1) {
    setUrls((u) => {
      const j = i + dir;
      if (j < 0 || j >= u.length) return u;
      const copy = [...u];
      [copy[i], copy[j]] = [copy[j], copy[i]];
      return copy;
    });
  }
  function makeCover(i: number) {
    setUrls((u) => (i === 0 ? u : [u[i], ...u.filter((_, idx) => idx !== i)]));
  }
  function addManual() {
    const v = manual.trim();
    if (!v) return;
    setUrls((u) => [...u, v]);
    setManual("");
  }

  return (
    <div>
      <label className="label">Fotos del producto (carrusel)</label>
      {/* portada = primera; se guarda también como imagen_url */}
      <input type="hidden" name="imagenes" value={JSON.stringify(urls)} />
      <input type="hidden" name="imagen_url" value={urls[0] ?? ""} />

      {urls.length > 0 && (
        <div className="mb-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
          {urls.map((u, i) => (
            <div
              key={`${u}-${i}`}
              className="relative aspect-square overflow-hidden rounded-lg border border-hairline bg-surface-2"
            >
              <Image src={u} alt="" fill sizes="120px" className="object-cover" />
              {i === 0 && (
                <span className="absolute left-1 top-1 inline-flex items-center gap-0.5 rounded-full bg-primary px-1.5 py-0.5 text-[9px] font-bold text-white">
                  <Star size={9} /> Portada
                </span>
              )}
              <button
                type="button"
                onClick={() => remove(i)}
                className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white"
                aria-label="Quitar"
              >
                <X size={11} />
              </button>
              <div className="absolute inset-x-0 bottom-0 flex justify-between bg-black/40 px-1 py-0.5">
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="text-white/90 disabled:opacity-30" aria-label="Mover izquierda">
                  <ArrowLeft size={12} />
                </button>
                {i !== 0 && (
                  <button type="button" onClick={() => makeCover(i)} className="text-white/90" aria-label="Hacer portada">
                    <Star size={12} />
                  </button>
                )}
                <button type="button" onClick={() => move(i, 1)} disabled={i === urls.length - 1} className="text-white/90 disabled:opacity-30" aria-label="Mover derecha">
                  <ArrowRight size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={busy}
        className="btn-ghost w-full justify-center py-2 text-sm"
      >
        {busy ? <Loader2 size={15} className="animate-spin" /> : <Camera size={15} />}
        {busy ? "Subiendo…" : "Agregar fotos (cámara o galería)"}
      </button>

      <div className="mt-2 flex gap-2">
        <input
          value={manual}
          onChange={(e) => setManual(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addManual(); } }}
          placeholder="o pega una URL de imagen"
          className="input py-1.5 text-xs"
        />
        <button type="button" onClick={addManual} className="btn-ghost px-3 py-1.5 text-xs">
          Añadir
        </button>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        onChange={onPick}
        className="hidden"
      />
      {err && <p className="mt-1 text-xs text-rose-500">{err}</p>}
      <p className="mt-1 text-[11px] text-on-bg-muted">
        La primera foto es la portada. Arrastra con las flechas o marca otra como portada con ★.
      </p>
    </div>
  );
}
