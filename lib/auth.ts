/**
 * Gate de administración. La app no tiene login de usuarios (es demo), pero
 * los datos sensibles (PII de socios, correos del equipo) y las mutaciones de
 * negocio (precios, stock, config) se protegen con un token compartido que
 * vive solo en el servidor (ADMIN_TOKEN) y que el panel admin envía por header.
 */
export function isAdmin(req: Request): boolean {
  const token = process.env.ADMIN_TOKEN;
  if (!token) return false; // sin token configurado, nadie es admin
  return req.headers.get("x-admin-token") === token;
}

export const ADMIN_HEADER = "x-admin-token";
