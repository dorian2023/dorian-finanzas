# Reglas de Ingeniería y Estándares de Proyecto: Dorian Finanzas

## 1. Arquitectura y Estructura
- Arquitectura basada en **Features**:
  - `src/features/auth`: Autenticación, sesión y protección de rutas.
  - `src/features/transactions`: Registro, listado, filtros y edición de movimientos.
  - `src/features/receipts`: Captura de cámara, compresión WebP, escaneo por IA.
  - `src/features/tasks`: Gestor de tareas, recordatorios, avisos y conversión a gastos.
  - `src/features/accounts`: Bolsillos y saldos en USD y VES.
  - `src/features/exchange-rate`: Gestión de tasa diaria manual.
  - `src/features/dashboard`: Tarjetas de saldos consolidados, gráficos y métricas.
  - `src/shared`: Componentes UI atómicos, utilitarios de dinero (`lib/money.ts`), base de datos (`lib/supabase.ts`).

## 2. Manejo de Dinero y Finanzas
- Cumplimiento irrestricto de la skill `finanzas-bimonetarias`.
- Todos los montos se manipulan como enteros en céntimos (`amount_minor`).
- Prohibido el uso de flotantes (`0.1 + 0.2`).
- Las transacciones deben almacenar siempre `rate_used` como una foto fija e inmutable.

## 3. Seguridad y Backend
- Todas las tablas en Supabase deben tener habilitado Row Level Security (RLS) con políticas restrictivas (`auth.uid() = user_id`).
- Ninguna clave sensible (como Gemini API Key) debe colocarse en el código cliente.
- Las llamadas a modelos de IA se ejecutan a través de Supabase Edge Functions.

## 4. Calidad de Código
- TypeScript 100% estricto sin excepciones (prohibido `any`).
- Validación en el edge con Zod para formularios y respuestas de API.
- Commits convencionales (`feat:`, `fix:`, `refactor:`, `docs:`).
- Diseño móvil primero optimizado para uso con una sola mano bajo luz solar directa.
