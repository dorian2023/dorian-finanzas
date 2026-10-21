---
name: finanzas-bimonetarias
description: Reglas de ingeniería y cálculo para el dominio financiero bimonetario venezolano (USD/VES), manejo de montos enteros en céntimos, tasas históricas y sincronización de tareas financieras.
---

# Finanzas Bimonetarias (v1.0.0)

## 1. Nombre y versión de la skill
- **Nombre Oficial**: Finanzas Bimonetarias
- **Identificador Técnico**: `finanzas-bimonetarias`
- **Versión**: 1.0.0
- **Estado**: Producción / Workspace
- **Fecha de Creación**: 2026-10-20

---

## 2. Descripción clara y concisa
La skill **Finanzas Bimonetarias** gobierna el tratamiento estricto de dinero, tasas de cambio e integración de tareas para economías bimonetarias (Bolívares y Dólares en efectivo/banca). Su propósito es garantizar que ningún componente o servicio del sistema utilice números flotantes para cálculos de saldo, que cada movimiento conserve su tasa de cambio histórica inmutable (`rate_used`), y que las conversiones y tareas vinculadas mantengan coherencia matemática y legal.

---

## 3. Casos de uso específicos
1. **Modelado y cálculo de transacciones**: Garantizar que ingresos y gastos se persistan siempre en enteros (céntimos) con su moneda original y la tasa del día.
2. **Conversión y visualización bimonetaria**: Convertir montos entre USD y VES utilizando la tasa histórica del movimiento o la tasa vigente del día para saldos actuales.
3. **Conversión de tareas a gastos**: Vincular recordatorios de compras (ej. repuestos de moto) con el registro instantáneo de la transacción financiera correspondiente.

---

## 4. Requisitos previos
- Entorno de ejecución TypeScript o PostgreSQL.
- Librería de formateo numérico internacional (`Intl.NumberFormat`) configurada para Venezuela (`es-VE`).
- Base de datos con soporte para tipos `BIGINT` y restricciones de clave foránea.

---

## 5. Instrucciones de uso (alto nivel)
1. **Regla de céntimos obligatoria**: Multiplicar siempre los montos decimales por 100 y redondear al entero más cercano antes de persistir (`12.50` -> `1250`).
2. **Asignación de tasa**: Al crear una transacción, buscar la última tasa registrada para la fecha en `exchange_rates` y almacenarla en `rate_used`.
3. **Cálculo de saldos**: Nunca sumar directamente Bolívares con Dólares; calcular los saldos de forma separada por cuenta y presentar totales equivalentes según la tasa del día.
4. **Validación con Zod**: Aplicar esquemas de validación tanto en cliente como en backend para asegurar enteros no negativos en los montos.

---

## 6. Ejemplos de prompts
- *"Implementa una función de utilidad en TypeScript para formatear montos en céntimos a string es-VE tanto en Bs como en USD."*
- *"Crea una migración de PostgreSQL para la tabla transactions asegurando que amount_minor sea BIGINT y rate_used sea NUMERIC(12,4)."*
- *"Diseña el hook useBalance para calcular el saldo total en USD y VES a partir de las cuentas del usuario."*
- *"Valida un formulario de registro de gasto en React con Zod siguiendo las reglas de finanzas-bimonetarias."*
- *"Convierte una tarea completada de compra de repuesto en una transacción de gasto con un solo toque."*

---

## 7. Variables configurables

| Variable | Tipo | Default | Descripción |
| :--- | :--- | :--- | :--- |
| `default_currency` | `string` | `"USD"` | Moneda de referencia principal para resúmenes globales. |
| `ves_currency_code` | `string` | `"VES"` | Código ISO de la moneda local (Bolívar). |
| `rate_decimal_places`| `number` | `4` | Cantidad de decimales de precisión para la tasa de cambio. |
| `minor_units_factor` | `number` | `100` | Factor multiplicador para convertir unidades mayores a céntimos. |
| `locale` | `string` | `"es-VE"` | Configuración regional para formateo de montos y fechas. |

---

## 8. Mejores prácticas
- **Inmutabilidad de tasa**: Nunca recalcular transacciones pasadas si la tasa del día cambia.
- **Transacciones atómicas para cambios de divisa**: Un intercambio USD ↔ Bs debe debitar y acreditar en la misma transacción de base de datos.
- **Tipado estricto**: Usar tipos de marca (*branded types*) o interfaces dedicadas `MoneyValue` para evitar mezclar enteros simples con montos de dinero.

---

## 9. Limitaciones conocidas
- La tasa de cambio manual depende de que el usuario la actualice con la frecuencia que considere pertinente.
- La precisión en enteros menores a 1 céntimo (micropagos) requeriría escalado a 4 o 6 decimales; para finanzas personales 2 decimales (100) es el estándar óptimo.

---

## 10. Historial de cambios (changelog)

### [1.0.0] - 2026-10-20
- Creación de la skill formal para el proyecto `dorian-finanzas`.
- Integración de especificación técnica de céntimos, modelo de datos y formato regional.
- Soporte para tareas y recordatorios asociados a transacciones.
