"use client";

import { useState, useTransition } from "react";
import { UserPlus, Check } from "lucide-react";
import { invitarStaff } from "./invite-actions";
import type { user_role } from "@prisma/client";

const ROLES: { value: user_role; label: string }[] = [
  { value: "empleado", label: "Empleado" },
  { value: "gerente", label: "Gerente" },
  { value: "admin", label: "Administrador" },
];

export default function InviteStaff() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [rol, setRol] = useState<user_role>("empleado");
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const submit = () =>
    start(async () => {
      const res = await invitarStaff(email, rol);
      if (res.ok) {
        setMsg({ ok: true, text: `Invitación enviada a ${email}` });
        setEmail("");
      } else {
        setMsg({ ok: false, text: res.error ?? "Error" });
      }
    });

  if (!open) {
    return (
      <button className="btn-primary" onClick={() => setOpen(true)} type="button">
        <UserPlus size={16} /> Invitar trabajador
      </button>
    );
  }

  return (
    <div className="card flex flex-col gap-3 p-4">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-bold">
          <UserPlus size={16} className="text-primary" /> Invitar trabajador
        </h2>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-sm text-on-bg-muted hover:text-on-bg"
        >
          Cerrar
        </button>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="correo@trabajador.com"
          className="input"
        />
        <select
          value={rol}
          onChange={(e) => setRol(e.target.value as user_role)}
          className="input sm:max-w-[180px]"
        >
          {ROLES.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          disabled={pending || !email}
          onClick={submit}
          className="btn-primary shrink-0"
        >
          {pending ? "Enviando…" : "Enviar"}
        </button>
      </div>
      {msg && (
        <p
          className={`flex items-center gap-1.5 text-sm ${
            msg.ok ? "text-emerald-400" : "text-rose-400"
          }`}
        >
          {msg.ok && <Check size={14} />}
          {msg.text}
        </p>
      )}
      <p className="text-xs text-on-bg-muted">
        El trabajador recibe un correo con el enlace de registro y entra ya con
        el rol asignado.
      </p>
    </div>
  );
}
