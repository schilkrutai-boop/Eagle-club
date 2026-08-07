"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import isotipo from "@/public/media/site/isotipo.png";

// El orden del menú es el orden de la página.
const LINKS = [
  { href: "#club", label: "Club" },
  { href: "#membresias", label: "Membresías" },
  { href: "#reservar", label: "Reservar" },
  { href: "#ubicacion", label: "Ubicación" },
];

/**
 * Header fijo de la maqueta: MENÚ · logo · RESERVAR.
 * Parte con isotipo + wordmark; al hacer scroll queda solo el isotipo
 * (nota del diseñador, como la referencia de Rolls-Royce).
 */
export default function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [compact, setCompact] = useState(false);
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuBtnRef = useRef<HTMLButtonElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(false);

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const y = window.scrollY;
        setScrolled(y > 24);
        setCompact(y > window.innerHeight * 0.55);
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  // bloquear el scroll del fondo mientras el menú está abierto
  useEffect(() => {
    document.documentElement.style.overflow = open ? "hidden" : "";
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [open]);

  // foco: al abrir va al botón de cierre; al cerrar vuelve al botón Menú
  useEffect(() => {
    if (open) {
      wasOpen.current = true;
      closeBtnRef.current?.focus();
    } else if (wasOpen.current) {
      wasOpen.current = false;
      menuBtnRef.current?.focus();
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        return;
      }
      // trap de Tab: aria-modal promete que el resto del documento es inerte
      if (e.key === "Tab") {
        const nodes = menuRef.current?.querySelectorAll<HTMLElement>("a, button");
        if (!nodes || nodes.length === 0) return;
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        const active = document.activeElement as HTMLElement | null;
        if (!active || !menuRef.current?.contains(active)) {
          e.preventDefault();
          first.focus();
        } else if (!e.shiftKey && active === last) {
          e.preventDefault();
          first.focus();
        } else if (e.shiftKey && active === first) {
          e.preventDefault();
          last.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const close = useCallback(() => setOpen(false), []);

  return (
    <>
      <header
        className={`site-header ${scrolled ? "is-scrolled" : ""} ${
          compact ? "is-compact" : ""
        }`}
      >
        <div className="site-header-inner">
          <button
            ref={menuBtnRef}
            type="button"
            className="site-menu-btn"
            onClick={() => setOpen(true)}
            aria-haspopup="dialog"
            aria-expanded={open}
          >
            <span className="site-menu-icon" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
            Menú
          </button>

          <a href="#inicio" className="site-header-logo" aria-label="Eagle Club — inicio">
            <Image src={isotipo} alt="" loading="eager" />
            <span className="site-header-wordmark">Eagle Club</span>
          </a>

          <a className="site-header-cta" href="/demo">
            Reservar
          </a>
        </div>
      </header>

      <div
        ref={menuRef}
        className={`site-menu ${open ? "is-open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Menú"
      >
        <button
          ref={closeBtnRef}
          type="button"
          className="site-menu-close"
          onClick={close}
          aria-label="Cerrar menú"
        >
          ✕
        </button>
        {LINKS.map((l) => (
          <a key={l.href} href={l.href} onClick={close}>
            {l.label}
          </a>
        ))}
      </div>
    </>
  );
}
