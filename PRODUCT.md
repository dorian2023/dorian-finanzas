# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

delegated: React + Vite + TypeScript como PWA instalable (móvil primero). Backend Supabase (Auth, Postgres con RLS, Storage privado, Edge Functions). Lectura de facturas con IA (Gemini) invocada solo desde una Edge Function; la clave nunca llega al cliente.

## Users

Un único usuario: Dorian, en Venezuela, con dos empleos. Policía (pago en Bolívares) y Muebles Bellagio (pago en Dólares en efectivo). Gasta a diario en efectivo y en Bs: comida, repuestos de la moto, ocio, etc. Hoy no sabe cuánto gana ni cuánto gasta. Registra desde el teléfono, normalmente de pie, justo después de pagar.

## Product Purpose

Dar control total sobre las finanzas personales en dos monedas: cuánto entra (por empleo), cuánto sale (por categoría, día y lugar) y cuánto queda, en USD y en Bs. El éxito es que registrar un gasto tome menos de 10 segundos (foto → confirmar) y que en cualquier momento pueda responder "¿cuánto gané y gasté este mes y en qué?".

## Positioning

Pensada para la realidad bimonetaria venezolana: cada movimiento conserva su moneda original y la tasa Bs/USD con la que se registró, en lugar de forzar una sola moneda. La factura fotografiada se convierte en un movimiento estructurado por IA y queda como comprobante.

## Operating Context

- Registro en el teléfono con la cámara (foto de factura o ticket).
- Ingresos de dos fuentes: Policía (Bs) y Muebles Bellagio (USD efectivo). Fechas variables/no fijas (se registran bajo demanda al cobrar).
- Tasas de cambio duales: BCV Oficial y Binance P2P / Paralelo. Se pueden sincronizar automáticamente en vivo (vía API) o editar manualmente a voluntad, y el usuario selecciona cuál de las dos gobierna los cálculos.
- Señal móvil irregular: la app debe permitir registrar sin conexión y sincronizar después.

## Capabilities and Constraints

- Movimientos: ingresos, gastos y cambios de divisa (USD ↔ Bs).
- Gestión de Tasas Duales (BCV y Binance P2P) con switch rápido en cabecera, actualización en vivo y anulación manual.
- Cuentas/bolsillos confirmados: Efectivo USD, Efectivo Bs, Banco de Venezuela (Bs), Binance (USD), Zinli (USD).
- Categorías iniciales: Comida, Moto (repuestos, gasolina, mantenimiento), Ocio, Transporte, Hogar, Salud, Servicios, Otros.
- Captura de factura: la IA extrae monto, moneda, comercio, fecha y categoría sugerida; el usuario confirma o corrige.
- Gestor de tareas y recordatorios: lista ágil de pendientes personales, laborales y financieros (ej. "pagar repuesto moto", "anotar gastos del día", "guardar efectivo Bellagio"), con alarmas/notificaciones para evitar olvidos.
- Módulo de Deudas y Compromisos: registro de deudas personales (monto original, fecha, acreedor), amortización con abonos parciales fechados, saldo pendiente que se reduce con cada pago y barra de progreso.
- Dashboard de Análisis y Estadísticas: desglose visual de gastos por categoría, análisis de ingresos Policía vs Bellagio, histórico mensual y detección del mayor rubro de gasto.
- Datos en la nube con login; las fotos en almacenamiento privado.
- Montos guardados como enteros (céntimos) con su moneda; nunca flotantes.
- Abierto: presupuestos/metas, exportación a Excel/PDF.

## Evidence on Hand

Ninguna todavía: no hay facturas de muestra, logo ni datos históricos. No se deben inventar cifras ni movimientos de ejemplo presentados como reales.

## Product Principles

1. Registrar es más importante que analizar: si capturar cuesta, no se usa.
2. La moneda original es la verdad; la conversión es una vista.
3. Cada gasto tiene respaldo (foto) y contexto (día, lugar, categoría).
4. Respuestas claras antes que gráficos bonitos: "ganaste X, gastaste Y, te queda Z".
5. Privacidad por defecto: datos y fotos solo visibles para su dueño.

## Accessibility & Inclusion

Uso con una mano, en exteriores con sol: objetivos táctiles grandes, alto contraste, números legibles. Interfaz en español (es-VE), formato de montos local.
