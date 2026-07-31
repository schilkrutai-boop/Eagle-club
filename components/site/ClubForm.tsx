"use client";

import { useState } from "react";

type Status = "idle" | "sending" | "done";

/**
 * Formulario de la sección EL CLUB. Nota de la maqueta: los datos van a la
 * base de posibles clientes — reutilizamos /api/waitlist (misma tabla que la
 * lista de espera del landing, con correo de bienvenida automático).
 */
export default function ClubForm() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "sending") return;
    setStatus("sending");
    setError("");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone }),
      });
      // un 502/504 del gateway trae HTML, no JSON: no lo tratamos como
      // "problema de conexión" — el branch !res.ok da el mensaje correcto
      const data: { error?: string } = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "No pudimos enviar tus datos.");
        setStatus("idle");
        return;
      }
      setStatus("done");
    } catch {
      setError("Revisa tu conexión e intenta de nuevo.");
      setStatus("idle");
    }
  }

  if (status === "done") {
    const firstName = name.trim().split(/\s+/)[0];
    return (
      <div className="site-form-done" role="status">
        <p className="site-eyebrow">Recibido</p>
        <p className="site-body" style={{ marginTop: 16 }}>
          Gracias{firstName ? `, ${firstName}` : ""}. Muy pronto nos
          comunicaremos contigo con la información de la membresía.
        </p>
      </div>
    );
  }

  const sending = status === "sending";

  return (
    <form className="site-form" onSubmit={onSubmit}>
      <div className="site-form-grid">
        <div className="site-field">
          <label htmlFor="club-name">Nombre</label>
          <input
            id="club-name"
            name="name"
            type="text"
            autoComplete="name"
            required
            maxLength={80}
            placeholder="Tu nombre"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={sending}
          />
        </div>

        <div className="site-field">
          <label htmlFor="club-phone">Teléfono</label>
          <input
            id="club-phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            required
            maxLength={30}
            placeholder="+56 9 1234 5678"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            disabled={sending}
          />
        </div>

        <div className="site-field site-field--wide">
          <label htmlFor="club-email">Email</label>
          <input
            id="club-email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            maxLength={120}
            placeholder="tu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={sending}
          />
        </div>
      </div>

      {error && (
        <p className="site-form-error" role="alert" style={{ marginTop: 28 }}>
          {error}
        </p>
      )}

      <div style={{ textAlign: "center", marginTop: 48 }}>
        <button type="submit" className="site-btn" disabled={sending}>
          {sending ? "Enviando…" : "Más información"}
        </button>
      </div>
    </form>
  );
}
