"use client";

import { useState } from "react";

type Status = "idle" | "sending" | "done";

export default function WaitlistForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
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
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No pudimos registrarte.");
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
      <div className="lp-done fade-in" role="status">
        <p className="lp-kicker">Estás en la lista</p>
        <p className="lp-done-text mt-4">
          Gracias{firstName ? `, ${firstName}` : ""}. Te escribiremos apenas
          tengamos fecha de apertura.
        </p>
      </div>
    );
  }

  const sending = status === "sending";

  return (
    <form className="lp-form" onSubmit={onSubmit}>
      <p className="lp-kicker">Lista de espera</p>

      <div className="lp-fields mt-6">
        <div className="lp-field">
          <label htmlFor="wl-name">Nombre</label>
          <input
            id="wl-name"
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

        <div className="lp-field">
          <label htmlFor="wl-phone">Teléfono</label>
          <input
            id="wl-phone"
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

        <div className="lp-field lp-field--wide">
          <label htmlFor="wl-email">Email</label>
          <input
            id="wl-email"
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
        <p className="lp-error mt-6" role="alert">
          {error}
        </p>
      )}

      <button
        type="submit"
        className="btn btn--gold btn--lg mt-7 w-full sm:w-auto"
        disabled={sending}
      >
        {sending ? "Enviando…" : "Unirme a la lista"}
      </button>

      <p className="lp-fine mt-4">
        Te escribiremos solo por la apertura del club. Nada más.
      </p>
    </form>
  );
}
