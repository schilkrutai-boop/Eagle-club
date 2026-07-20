export function clp(n: number): string {
  return "$" + n.toLocaleString("es-CL");
}

export function hourLabel(h: number): string {
  return `${String(h).padStart(2, "0")}:00`;
}

export function todayISO(): string {
  const d = new Date();
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 10);
}

export function dateLabel(iso: string): { dow: string; day: string; month: string } {
  const d = new Date(iso + "T12:00:00");
  return {
    dow: d.toLocaleDateString("es-CL", { weekday: "short" }).replace(".", ""),
    day: String(d.getDate()),
    month: d.toLocaleDateString("es-CL", { month: "short" }).replace(".", ""),
  };
}

export function minutesSince(ts: number): number {
  return Math.max(0, Math.floor((Date.now() - ts) / 60000));
}

/** "1 pedido" / "3 pedidos" — concuerda número con el sustantivo. */
export function plural(n: number, singular: string, pluralForm?: string): string {
  const word = n === 1 ? singular : (pluralForm ?? `${singular}s`);
  return `${n} ${word}`;
}

/** true si el string es una fecha calendario real (no "2026-99-99"). */
export function isRealDate(iso: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false;
  const d = new Date(iso + "T00:00:00");
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === iso;
}

const CLUB_TZ = "America/Santiago";

function santiagoParts(at = new Date()) {
  const p = new Intl.DateTimeFormat("en-US", {
    timeZone: CLUB_TZ,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
    .formatToParts(at)
    .reduce<Record<string, string>>((a, x) => {
      a[x.type] = x.value;
      return a;
    }, {});
  return p;
}

/** Fecha (YYYY-MM-DD) y hora actual en la zona horaria del club (Chile). */
export function santiagoNow(): { date: string; hour: number } {
  const p = santiagoParts();
  return { date: `${p.year}-${p.month}-${p.day}`, hour: Number(p.hour) % 24 };
}

/** Instante UTC (ISO) de la medianoche de hoy en Chile — corte de "hoy". */
export function santiagoDayStartISO(): string {
  const now = new Date();
  const p = santiagoParts(now);
  const asIfUTC = Date.UTC(
    Number(p.year),
    Number(p.month) - 1,
    Number(p.day),
    Number(p.hour),
    Number(p.minute),
    Number(p.second)
  );
  const offsetMs = asIfUTC - now.getTime();
  const midnightAsIfUTC = Date.UTC(Number(p.year), Number(p.month) - 1, Number(p.day), 0, 0, 0);
  return new Date(midnightAsIfUTC - offsetMs).toISOString();
}

/**
 * Ventana UTC [start, end) que cubre un día calendario (YYYY-MM-DD) en la zona
 * del club. Sirve para consultar los pedidos de una fecha cualquiera, no solo
 * hoy. El offset se toma al mediodía de ese día para evitar el borde de DST.
 */
export function santiagoDayRangeISO(dateISO: string): { start: string; end: string } {
  const [y, mo, d] = dateISO.split("-").map(Number);
  const noonUTC = new Date(Date.UTC(y, mo - 1, d, 12, 0, 0));
  const p = santiagoParts(noonUTC);
  const asIfUTC = Date.UTC(
    Number(p.year),
    Number(p.month) - 1,
    Number(p.day),
    Number(p.hour),
    Number(p.minute),
    Number(p.second)
  );
  const offsetMs = asIfUTC - noonUTC.getTime();
  const start = new Date(Date.UTC(y, mo - 1, d, 0, 0, 0) - offsetMs).toISOString();
  const end = new Date(Date.UTC(y, mo - 1, d + 1, 0, 0, 0) - offsetMs).toISOString();
  return { start, end };
}
