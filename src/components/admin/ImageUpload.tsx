"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Camera, Loader2, X } from "lucide-react";

/** Image field with phone camera/gallery upload (Vercel Blob) + manual URL.
 *  Stores the final URL in a hidden input named `imagen_url`. */
export default function ImageUpload({ defaultUrl }: { defaultUrl?: string | null }) {
  const [url, setUrl] = useState(defaultUrl ?? "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setErr(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al subir");
      setUrl(data.url);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <label className="label">Imagen del producto</label>
      <input type="hidden" name="imagen_url" value={url} />

      <div className="flex items-center gap-3">
        <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-hairline bg-surface-2">
          {url ? (
            <>
              <Image src={url} alt="" fill sizes="80px" className="object-cover" />
              <button
                type="button"
                onClick={() => setUrl("")}
                className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white"
                aria-label="Quitar"
              >
                <X size={12} />
              </button>
            </>
          ) : (
            <Camera size={22} className="text-on-bg-muted" />
          )}
        </div>

        <div className="flex flex-1 flex-col gap-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={busy}
            className="btn-ghost justify-center py-2 text-sm"
          >
            {busy ? <Loader2 size={15} className="animate-spin" /> : <Camera size={15} />}
            {busy ? "Subiendo…" : "Tomar foto / elegir"}
          </button>
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="o pega una URL"
            className="input py-1.5 text-xs"
          />
        </div>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={onPick}
        className="hidden"
      />
      {err && <p className="mt-1 text-xs text-rose-500">{err}</p>}
    </div>
  );
}
