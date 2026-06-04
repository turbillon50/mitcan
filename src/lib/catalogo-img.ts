// Per-category photo fallback for the product catalog.
// A product uses its own `imagen_url` when set; otherwise we fall back to a
// representative category photo (CATEGORY_PHOTO, keyed by category name), and
// finally to a branded gradient tile with the category emoji.

const CF = "https://d8j0ntlcm91z4.cloudfront.net/user_3DDb66hXpSaWG4DmoX3Ae5V2dqt/";

/** Category name -> representative photo (commercial food photography). */
export const CATEGORY_PHOTO: Record<string, string> = {
  "CARNICO DE RES": CF + "hf_20260604_004004_76d04486-4426-42d0-85a7-e7a3bafb8e6d_min.webp",
  "CARNICO DE CERDO": CF + "hf_20260604_004148_c81af9e1-5b4f-454b-bded-cdf664904905_min.webp",
  "CARNICO DE POLLO": CF + "hf_20260604_004149_e9fbdc4e-6336-4a09-aac9-6953d8b0f4e2_min.webp",
  "CARNES EXOTICAS": CF + "hf_20260604_004150_497982f7-acde-4f4e-855f-2a59c2035c95_min.webp",
  "PESCADOS Y MARISCOS": CF + "hf_20260604_004151_a39004ac-d665-478d-99e3-661d617e40ae_min.webp",
  PROCESADOS: CF + "hf_20260604_004303_caa2269a-88a1-4c37-88f6-a8bf0fb81964_min.webp",
  EMBUTIDOS: CF + "hf_20260604_004304_9c533ab9-13af-4542-81fa-c25c9de31126_min.webp",
  LACTEOS: CF + "hf_20260604_004306_1882d9d3-62b4-4eeb-916e-115687f36c21_min.webp",
  CONGELADOS: CF + "hf_20260604_004307_b806a6f9-9eb6-41b9-84d3-56d5df38724e_min.webp",
  ABARROTES: CF + "hf_20260604_004413_ab205f39-9cb9-4029-acd9-38db3d19f2e0_min.webp",
  BEBIDAS: CF + "hf_20260604_004414_86096828-6b7e-4727-b08b-808036681b07_min.webp",
  VINO: CF + "hf_20260604_004415_7f0e54cd-9f8b-4946-8ae2-3a3377a98f53_min.webp",
  ESPECIES: CF + "hf_20260604_004416_d15cc36f-bac9-4031-83ba-23092b728add_min.webp",
  "TOSTADAS Y TOTOPOS": CF + "hf_20260604_004520_351148f7-2cb1-4c2b-b975-57343cd599c0_min.webp",
  DESECHABLE: CF + "hf_20260604_004521_24c6c4a3-e002-4432-b708-ba145f5ed80d_min.webp",
  INSUMOS: CF + "hf_20260604_004522_dfd3ded7-ed41-4070-a38b-6bd6ee23a1f5_min.webp",
  MASCOTAS: CF + "hf_20260604_004524_cbcd97ce-c3a9-4ee9-a4d7-2ae76d9353e0_min.webp",
  SOUVENIRS: CF + "hf_20260604_004629_c5d882b7-2d4d-4e86-a100-eacd816812bc_min.webp",
};

/** Resolve the best image for a product given its own URL and category name. */
export function productImage(
  imagenUrl: string | null | undefined,
  categoriaNombre: string | null | undefined
): string | null {
  if (imagenUrl) return imagenUrl;
  if (categoriaNombre && CATEGORY_PHOTO[categoriaNombre]) return CATEGORY_PHOTO[categoriaNombre];
  return null;
}

/** Warm, brand-aligned gradient per category (deterministic). */
const TINTS: [string, string][] = [
  ["#C41E3A", "#7a1224"],
  ["#E87020", "#b8480c"],
  ["#8a5a2b", "#5c3a18"],
  ["#A8323F", "#6e1f29"],
  ["#D4A853", "#a07d2e"],
  ["#9c4221", "#6b2c14"],
];

export function categoryTint(key: string | null | undefined): { from: string; to: string } {
  const s = key ?? "";
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  const [from, to] = TINTS[h % TINTS.length];
  return { from, to };
}
