import type { ReactNode, SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & {
  size?: number;
};

function IconBase({ size = 20, children, ...props }: IconProps & { children: ReactNode }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {children}
    </svg>
  );
}

export function IconArrowRight(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </IconBase>
  );
}

export function IconDashboard(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M4 5h7v6H4z" />
      <path d="M13 5h7v4h-7z" />
      <path d="M13 11h7v8h-7z" />
      <path d="M4 13h7v6H4z" />
    </IconBase>
  );
}

export function IconGrid(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M4 4h6v6H4z" />
      <path d="M14 4h6v6h-6z" />
      <path d="M4 14h6v6H4z" />
      <path d="M14 14h6v6h-6z" />
    </IconBase>
  );
}

export function IconHome(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="m3 11 9-8 9 8" />
      <path d="M5 10v10h14V10" />
      <path d="M9 20v-6h6v6" />
    </IconBase>
  );
}

export function IconBeef(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M7.5 19.5c-3.1-1.7-4.5-4.7-3.1-7.4 1.2-2.4 3.8-3.3 6.2-5.2 2-1.6 4.7-2.4 7.2-.9 2.7 1.6 3.4 4.8 1.9 7.6-2.2 4.1-7.5 8.1-12.2 5.9Z" />
      <path d="M10.2 11.8a2.4 2.4 0 1 0 3.4-3.4 2.4 2.4 0 0 0-3.4 3.4Z" />
    </IconBase>
  );
}

export function IconFlame(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 22c4 0 7-2.7 7-6.7 0-2.6-1.3-4.9-3.5-6.9-.2 2-1.1 3.2-2.4 3.8.4-3.2-1.1-6.1-4.4-8.2.3 3.8-1.4 5.8-2.8 7.6A6 6 0 0 0 5 15.3C5 19.3 8 22 12 22Z" />
    </IconBase>
  );
}

export function IconGift(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M20 12v8H4v-8" />
      <path d="M2.5 7.5h19v4.5h-19z" />
      <path d="M12 7.5V20" />
      <path d="M12 7.5H8.8a2.3 2.3 0 1 1 2.3-2.3c0 1.3.9 2.3.9 2.3Z" />
      <path d="M12 7.5h3.2a2.3 2.3 0 1 0-2.3-2.3c0 1.3-.9 2.3-.9 2.3Z" />
    </IconBase>
  );
}

export function IconMapPin(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 22s7-5.3 7-12a7 7 0 1 0-14 0c0 6.7 7 12 7 12Z" />
      <circle cx="12" cy="10" r="2.3" />
    </IconBase>
  );
}

export function IconMoon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M20.5 14.2A8.3 8.3 0 0 1 9.8 3.5 8.6 8.6 0 1 0 20.5 14.2Z" />
    </IconBase>
  );
}

export function IconPlus(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </IconBase>
  );
}

export function IconShoppingCart(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M4 5h2l2 10h10l2-7H7" />
      <circle cx="10" cy="20" r="1.5" />
      <circle cx="17" cy="20" r="1.5" />
    </IconBase>
  );
}

export function IconSun(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="m4.9 4.9 1.4 1.4" />
      <path d="m17.7 17.7 1.4 1.4" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="m4.9 19.1 1.4-1.4" />
      <path d="m17.7 6.3 1.4-1.4" />
    </IconBase>
  );
}

export function IconQrCode(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M4 4h6v6H4z" />
      <path d="M14 4h6v6h-6z" />
      <path d="M4 14h6v6H4z" />
      <path d="M14 14h2v2h-2z" />
      <path d="M18 14h2v6h-2z" />
      <path d="M14 18h2v2h-2z" />
    </IconBase>
  );
}

export function IconSearch(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="11" cy="11" r="6" />
      <path d="m16 16 4 4" />
    </IconBase>
  );
}

export function IconSparkles(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="m12 3 1.8 4.2L18 9l-4.2 1.8L12 15l-1.8-4.2L6 9l4.2-1.8L12 3Z" />
      <path d="m5 14 .9 2.1L8 17l-2.1.9L5 20l-.9-2.1L2 17l2.1-.9L5 14Z" />
      <path d="m19 14 .7 1.6 1.6.7-1.6.7L19 18.5l-.7-1.5-1.6-.7 1.6-.7L19 14Z" />
    </IconBase>
  );
}

export function IconX(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </IconBase>
  );
}

export function IconBell(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </IconBase>
  );
}

export function IconRotateCcw(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M3 12a9 9 0 1 0 3-6.7" />
      <path d="M3 4v5h5" />
    </IconBase>
  );
}

export function IconGlobe(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10Z" />
    </IconBase>
  );
}
