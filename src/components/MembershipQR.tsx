"use client";

import { QRCodeSVG } from "qrcode.react";

/** Dynamic per-member QR. Encodes an external URL that carries the CSN
 *  membership key so cashiers can scan it at checkout. Rendered on a light
 *  surface for reliable scanning. */
export default function MembershipQR({
  value,
  size = 200,
}: {
  value: string;
  size?: number;
}) {
  return (
    <div
      className="rounded-xl bg-white p-3"
      style={{ width: size + 24, height: size + 24 }}
    >
      <QRCodeSVG
        value={value}
        size={size}
        bgColor="#ffffff"
        fgColor="#1a0f06"
        level="M"
        marginSize={0}
      />
    </div>
  );
}
