// Envío de correos vía Resend (https://resend.com).
//
// Usamos la API REST directamente con fetch para no sumar dependencias: funciona
// en el runtime de servidor de Next (route handlers). Requiere en el entorno:
//
//   RESEND_API_KEY   — API key de Resend (Dashboard → API Keys). SECRETA.
//   RESEND_FROM       — remitente, ej. 'EAGLE CLUB <hola@eagleclub.cl>'.
//                       El dominio debe estar verificado en Resend. Si no se
//                       define, se usa el sandbox onboarding@resend.dev (solo
//                       sirve para pruebas al email de tu propia cuenta).
//   RESEND_REPLY_TO   — opcional, dirección de respuesta.
//
// El envío es "best effort": si falla o falta la key, se registra en consola
// pero NUNCA rompe el alta en la lista de espera.

const RESEND_ENDPOINT = "https://api.resend.com/emails";

const FROM = process.env.RESEND_FROM || "EAGLE CLUB <onboarding@resend.dev>";
const REPLY_TO = process.env.RESEND_REPLY_TO || undefined;

// El logo del correo se referencia por URL absoluta hospedada (lo estándar en
// email: los data-URI base64 los bloquea Gmail). Resolvemos el dominio igual
// que la landing y caemos al dominio de producción conocido.
const LOGO_PATH = "/media/eagleclub-logo-stacked.png";
const HERO_PATH = "/media/email-hero-wide.jpg";
const IGICON_PATH = "/media/ig-icon.png";
const INSTAGRAM_URL = "https://www.instagram.com/eagleclub.cl/";
const WEB_URL = "https://eagleclub.cl";
const CONTACT_EMAIL = "contacto@eagleclub.cl";
const ADDRESS = "Isidora Goyenechea 3000";

function siteBaseUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/+$/, "");
  const vercelProd = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercelProd) return `https://${vercelProd}`;
  const vercel = process.env.VERCEL_URL;
  if (vercel) return `https://${vercel}`;
  return "https://eagleclub.cl";
}

type SendResult = { ok: true; id: string } | { ok: false; error: string };

/** Envía un correo por Resend. No lanza: devuelve el resultado. */
async function sendEmail(input: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("Resend: falta RESEND_API_KEY, se omite el envío.");
    return { ok: false, error: "missing_api_key" };
  }

  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: FROM,
        to: [input.to],
        subject: input.subject,
        html: input.html,
        text: input.text,
        ...(REPLY_TO ? { reply_to: REPLY_TO } : {}),
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error("Resend: respuesta no OK", res.status, detail);
      return { ok: false, error: `http_${res.status}` };
    }

    const data = (await res.json().catch(() => ({}))) as { id?: string };
    return { ok: true, id: data.id ?? "" };
  } catch (err) {
    console.error("Resend: error de red", err);
    return { ok: false, error: "network" };
  }
}

// ---------- correo de bienvenida a la lista de espera ----------

const WELCOME_SUBJECT = "Bienvenido a EAGLE CLUB";

// Copia oficial de bienvenida (versión texto plano, para clientes sin HTML).
function welcomeText(): string {
  return [
    "Bienvenido a EAGLE CLUB.",
    "",
    "Gracias por tu interés en formar parte de EAGLE CLUB.",
    "",
    "EAGLE CLUB nace para ofrecer una nueva forma de vivir el golf: un espacio exclusivo donde la tecnología, el diseño y la hospitalidad crean una experiencia pensada para quienes valoran la excelencia en cada detalle.",
    "",
    "Porque el golf es mucho más que un deporte. Es un estilo de vida.",
    "",
    "Muy pronto compartiremos contigo nuestras primeras novedades y el acceso a beneficios exclusivos.",
    "",
    "Gracias por ser parte del comienzo.",
    "",
    "Nos vemos muy pronto.",
    "",
    "EAGLE CLUB",
    "",
    "contacto@eagleclub.cl · eagleclub.cl",
    "Isidora Goyenechea 3000",
  ].join("\n");
}

// Versión HTML, con la estética de la marca (negro + dorado). Estilos inline
// porque los clientes de correo no aplican <style> ni variables CSS.
function welcomeHtml(logoUrl: string, heroUrl: string, igIconUrl: string): string {
  const gold = "#c9a35c";
  const bg = "#0c0605";
  const panel = "#141010";
  const text = "#e9e2d6";

  const paragraphs = [
    "Gracias por tu interés en formar parte de EAGLE CLUB.",
    "EAGLE CLUB nace para ofrecer una nueva forma de vivir el golf: un espacio exclusivo donde la tecnología, el diseño y la hospitalidad crean una experiencia pensada para quienes valoran la excelencia en cada detalle.",
    "Porque el golf es mucho más que un deporte. Es un estilo de vida.",
    "Muy pronto compartiremos contigo nuestras primeras novedades y el acceso a beneficios exclusivos.",
    "Gracias por ser parte del comienzo.",
  ];

  const body = paragraphs
    .map(
      (p) =>
        `<p style="margin:0 0 18px;font-size:16px;line-height:1.7;color:${text};">${p}</p>`
    )
    .join("");

  return `<!doctype html>
<html lang="es">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${WELCOME_SUBJECT}</title></head>
<body style="margin:0;padding:0;background:${bg};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">Ya estás en la lista de EAGLE CLUB.</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${bg};padding:40px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:${panel};border:1px solid rgba(201,163,92,0.25);border-radius:14px;overflow:hidden;">
        <tr><td style="padding:44px 40px 6px;text-align:center;">
          <img src="${logoUrl}" alt="EAGLE CLUB — Indoor Golf" width="196" style="width:196px;max-width:72%;height:auto;display:inline-block;border:0;outline:none;text-decoration:none;" />
        </td></tr>
        <tr><td style="padding:22px 26px 4px;text-align:center;">
          <img src="${heroUrl}" alt="EAGLE CLUB — Indoor Golf" width="380" style="width:100%;max-width:380px;height:auto;border-radius:12px;display:inline-block;border:0;outline:none;text-decoration:none;" />
        </td></tr>
        <tr><td style="padding:26px 40px 8px;font-family:Arial,Helvetica,sans-serif;">
          <h1 style="margin:0 0 22px;font-size:22px;line-height:1.3;color:${gold};font-weight:600;">Bienvenido a EAGLE CLUB</h1>
          ${body}
        </td></tr>
        <tr><td style="padding:12px 40px 44px;font-family:Arial,Helvetica,sans-serif;">
          <p style="margin:0 0 22px;font-size:16px;line-height:1.7;color:${text};">Nos vemos muy pronto.</p>
          <img src="${logoUrl}" alt="EAGLE CLUB — Indoor Golf" width="120" style="width:120px;max-width:48%;height:auto;display:block;border:0;outline:none;text-decoration:none;" />
        </td></tr>
        <tr><td style="padding:22px 40px 40px;text-align:center;border-top:1px solid rgba(201,163,92,0.16);">
          <a href="${INSTAGRAM_URL}" style="text-decoration:none;display:inline-block;"><img src="${igIconUrl}" alt="Instagram" width="26" height="26" style="width:26px;height:26px;display:inline-block;border:0;outline:none;text-decoration:none;" /></a>
          <div style="margin-top:14px;line-height:1.9;">
            <a href="${WEB_URL}" style="color:${gold};font-family:Arial,Helvetica,sans-serif;font-size:13px;letter-spacing:0.06em;text-decoration:none;">eagleclub.cl</a><br />
            <a href="mailto:${CONTACT_EMAIL}" style="color:#8a8175;font-family:Arial,Helvetica,sans-serif;font-size:12px;letter-spacing:0.05em;text-decoration:none;">${CONTACT_EMAIL}</a>
          </div>
          <div style="margin-top:10px;color:#8a8175;font-family:Arial,Helvetica,sans-serif;font-size:12px;letter-spacing:0.05em;">${ADDRESS}</div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

/**
 * Manda el correo de bienvenida a quien se acaba de inscribir en la lista de
 * espera. No lanza: si algo falla, el alta ya quedó guardada igual.
 */
export async function sendWaitlistWelcomeEmail(to: string): Promise<SendResult> {
  const base = siteBaseUrl();
  return sendEmail({
    to,
    subject: WELCOME_SUBJECT,
    html: welcomeHtml(`${base}${LOGO_PATH}`, `${base}${HERO_PATH}`, `${base}${IGICON_PATH}`),
    text: welcomeText(),
  });
}
