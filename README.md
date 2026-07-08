# Eagle Club — MVP Versión 1

Plataforma de reservas, comida y operación para Eagle Club (indoor golf).
Cubre el alcance de la **Fase 01** de la propuesta, con la identidad de marca
del club (burdeos, carmesí y el monograma "3").

## Qué incluye

| Pantalla | Ruta | Qué hace |
| --- | --- | --- |
| Home | `/` | Portada con la marca del club, acceso a reservas, bahías y staff |
| Tee sheet | `/reservar` | Reserva de bahías con disponibilidad en tiempo real y pago con tarjeta guardada (demo) |
| Consola de bahía | `/b/1` … `/b/6` | Menú con fotos, alérgenos y stock; pedido directo a cocina (pantalla del iPad y destino del QR) |
| Cocina (KDS) | `/cocina` | Tablero en vivo: Nuevos → En preparación → Listos, con timers y notas |
| Administración | `/admin` | Resumen de ventas y aportes, reservas, menú e inventario, configuración y QR |

## Características clave

- **Tiempo real** en todas las pantallas vía Server-Sent Events.
- **Inventario**: cada producto tiene stock; se descuenta con cada pedido y al
  llegar a 0 queda agotado en todas las bahías. Ajustable desde el admin.
- **Water Is Life**: en ambos checkouts el socio puede sumar un aporte a la
  fundación, con botón "¿Qué es Water Is Life?". Los aportes se reportan
  aparte de la venta en el admin.
- **Avisos por correo** (demo): cada reserva y pedido genera un aviso a los
  correos del equipo (martin@schilkrut.app, sofia@, matias@ y
  nicolas@eagleclub.cl), configurables en Admin → Configuración y visibles en
  el Resumen.
- **Precios ajustables**: valor de la bahía ($50.000/hora por defecto) y
  precios del menú, todo desde el admin.

## Correr el proyecto

```bash
npm install
npm run dev        # http://localhost:3000
```

## Notas del MVP

- **Pago**: simulado (Visa •••• 4321). En producción se conecta a Webpay/Stripe.
- **Correos**: en el MVP los avisos quedan registrados y visibles en el admin;
  en producción se envían de verdad (Resend/SES).
- **Datos**: persisten en `data/db.json` (se crea solo). Para partir de cero,
  borra ese archivo y reinicia.
- 6 bahías, horario 10:00–23:00, bloques de 1 hora.
