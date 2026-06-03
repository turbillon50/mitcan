import { getContent } from "@/lib/data";
import { saveHero, type Banner } from "./actions";
import BannersEditor from "./BannersEditor";

export const dynamic = "force-dynamic";

type Hero = { titulo?: string; subtitulo?: string; cta_text?: string; cta_href?: string };

export default async function AdminContenido() {
  const [hero, banners] = await Promise.all([
    getContent<Hero>("hero"),
    getContent<Banner[]>("banners"),
  ]);

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="section-title text-2xl">Contenido del sitio</h1>
        <p className="text-sm text-on-bg-muted">
          Edita el hero y el carrusel de banners de la página pública.
        </p>
      </div>

      <form action={saveHero} className="card flex flex-col gap-4 p-5">
        <h2 className="font-bold">Hero (portada)</h2>
        <div>
          <label className="label">Título</label>
          <input name="titulo" defaultValue={hero?.titulo ?? ""} className="input" placeholder="La carne más selecta de Nayarit" />
        </div>
        <div>
          <label className="label">Subtítulo</label>
          <input name="subtitulo" defaultValue={hero?.subtitulo ?? ""} className="input" placeholder="Cortes premium y club de recompensas" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Texto del botón</label>
            <input name="cta_text" defaultValue={hero?.cta_text ?? ""} className="input" placeholder="Únete gratis" />
          </div>
          <div>
            <label className="label">Link del botón</label>
            <input name="cta_href" defaultValue={hero?.cta_href ?? ""} className="input" placeholder="/sign-up" />
          </div>
        </div>
        <button type="submit" className="btn-primary self-start">Guardar hero</button>
      </form>

      <BannersEditor initial={Array.isArray(banners) ? banners : []} />
    </div>
  );
}
