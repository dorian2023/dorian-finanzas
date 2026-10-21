# Reglas Monetarias del Dominio Bimonetario (Venezuela)

## 1. Almacenamiento en céntimos (Minor Units)
- **Regla de oro**: NUNCA usar `float` ni `double` para montos.
- Todo monto monetario se almacena como un número entero (`INTEGER` o `BIGINT`) representando céntimos:
  - `$ 10.50` USD -> `1050`
  - `Bs. 1.250,75` VES -> `125075`
- La tasa de cambio `ves_per_usd` se almacena con 4 decimales escalados o como número exacto: ej. tasa de `45.80` se almacena como `45.8000` (o entero con factor multiplicador 10000).

## 2. Inmutabilidad de la tasa histórica
- Cada transacción congela el campo `rate_used` en el instante de su creación.
- Cambiar la tasa del día de hoy NUNCA debe alterar los totales históricos calculados para días pasados.

## 3. Conversión de divisas
- Conversión a USD: `amount_usd = amount_ves / rate_used`
- Conversión a VES: `amount_ves = amount_usd * rate_used`
- Redondeo: Utilizar redondeo estándar bancario (half-to-even) o `Math.round()` sobre los céntimos resultantes.

## 4. Formato Visual (es-VE)
- Bolívares: Prefijo `Bs. `, separador de miles con punto `.`, separador decimal con coma `,`. Ejemplo: `Bs. 1.500,00`.
- Dólares: Prefijo `$ `, separador de miles con coma `,`, separador decimal con punto `.`. Ejemplo: `$ 120.00`.
