import type { NextConfig } from "next";

// El sistema del club vive en su propia aplicación. Estas redirecciones
// existen porque el demo antiguo vivió en estas rutas: cualquier marcador
// o QR viejo aterriza en el lugar correcto. Cuando app.eagleclub.cl tenga
// DNS, basta cambiar APP aquí.
const APP = "https://eagleclub-erp.vercel.app";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/reservar", destination: `${APP}/reservar`, permanent: false },
      { source: "/demo", destination: `${APP}/reservar`, permanent: false },
      { source: "/admin", destination: `${APP}/admin`, permanent: false },
      { source: "/admin/:path*", destination: `${APP}/admin/:path*`, permanent: false },
      { source: "/cocina", destination: `${APP}/cocina`, permanent: false },
      { source: "/b/:id", destination: `${APP}/bahia`, permanent: false },
      { source: "/lista", destination: `${APP}/admin/lista`, permanent: false },
      { source: "/socios", destination: `${APP}/socios`, permanent: false },
    ];
  },
};

export default nextConfig;
