# Eagle Club — Indoor Golf

Plataforma de reservas, comida y operación para Eagle Club. Next.js 16 (App
Router) + Supabase (Postgres + Realtime), lista para desplegar en Vercel.

## Pantallas

| Pantalla | Ruta | Qué hace |
| --- | --- | --- |
| Home | `/` | Portada del club, acceso a reservas y bahías |
| Tee sheet | `/reservar` | Reserva de bahías con disponibilidad en tiempo real y pago demo |
| Consola de bahía | `/b/1` … `/b/6` | Menú con fotos, alérgenos y stock; pedido a cocina (pantalla del iPad / destino del QR) |
| Cocina (KDS) | `/cocina` | Tablero en vivo: Nuevos → En preparación → Listos |
| Administración | `/admin` | Ventas, inventario, precios, reservas, correos de aviso y QR |

## Arquitectura

- **Persistencia:** Supabase (Postgres). El servidor accede con la
  `service_role` key; el navegador nunca toca las tablas.
- **Tiempo real:** Supabase Realtime (broadcast). Tras cada escritura el
  servidor avisa por un canal y todas las pantallas se resincronizan.
- **Pedidos atómicos:** la función `place_order` (en `supabase/schema.sql`)
  valida y descuenta stock en una transacción — dos bahías no pueden vender
  el mismo inventario a la vez.
- **Pago:** simulado (Visa •••• 4321). En producción se conecta a Webpay/Stripe.
- **Avisos por correo:** cada reserva y pedido se registra para el equipo
  (`martin@schilkrut.app`, `sofia@`, `matias@`, `nicolas@eagleclub.cl`);
  editables en Admin → Configuración.

## Puesta en marcha

### 1. Base de datos
En tu proyecto Supabase → **SQL Editor**, corre [`supabase/schema.sql`](supabase/schema.sql).
Crea las tablas, siembra menú/bahías/config y define `place_order`.

### 2. Variables de entorno
Copia `.env.example` a `.env.local` y completa (Supabase → Project Settings → API):

```
NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon / publishable key>
SUPABASE_SERVICE_ROLE_KEY=<service_role key — SECRETA>
```

### 3. Local
```bash
npm install
npm run dev        # http://localhost:3000
```

## Deploy en Vercel

1. **vercel.com → Add New → Project** e importa el repo de GitHub.
2. Framework: Next.js (autodetectado). No cambies build/output.
3. En **Environment Variables**, agrega las tres de arriba
   (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
   `SUPABASE_SERVICE_ROLE_KEY`) para Production, Preview y Development.
4. **Deploy.** Cada push a `main` redepliega solo.

## Notas

- La zona horaria del club es **America/Santiago**; el corte de "hoy" en el
  admin y la cocina usa esa zona.
- Para reiniciar la demo a cero, vacía las tablas `orders`, `reservations`,
  `email_log` y restaura `menu_items.stock` (o re-corre el seed).
