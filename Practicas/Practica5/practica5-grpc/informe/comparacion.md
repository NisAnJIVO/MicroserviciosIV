# Comparación de Estilos de Comunicación: REST vs GraphQL vs gRPC

| Medida | REST (P3) | GraphQL (P4) | gRPC (P5) |
|---|---|---|---|
| **Bytes de la respuesta** | 82 bytes | 68 bytes | 34 bytes |
| **Tiempo promedio observado (ms)** | 4.85 ms | 6.20 ms | 1.15 ms |
| **Viajes de red del cliente** | 1 | 1 | 1 |
| **Formato que viaja** | texto | texto | binario |
| **¿Se puede leer sin el contrato?** | sí | sí | no |
| **¿El navegador lo consume directo?** | sí | sí | no |
| **Público al que sirve mejor** | Público | Frontend | Interno |

### Análisis de Resultados

1. **Eficiencia en tamaño de payload (Bytes):**
   - **gRPC (34 bytes)** reduce en más de un **58%** el tamaño del payload respecto a REST (82 bytes) y un **50%** respecto a GraphQL (68 bytes). Esto se debe a que Protocol Buffers no transmite nombres de claves en texto plano ni comillas, solo identificadores numéricos de campo y valores codificados en binario.

2. **Latencia y tiempo de respuesta (ms):**
   - **gRPC (1.15 ms)** es aproximadamente **4.2x más rápido que REST** y **5.4x más rápido que GraphQL**. gRPC se beneficia de conexiones HTTP/2 persistentes con multiplexación y evita el costo de parsing y serialización de cadenas JSON.

3. **Segmentación arquitectónica recomendada:**
   - **REST (`Público`):** Ideal para APIs públicas, terceros, webhooks e integraciones estándar donde la auto-descripción e interoperabilidad universal son prioritarias.
   - **GraphQL (`Frontend`):** Ideal para clientes frontend web y móviles (BFF - Backend For Frontend) que requieren consultar múltiples recursos en una sola petición y evitar sobre-fetching.
   - **gRPC (`Interno`):** Ideal para comunicación este-oeste (East-West) entre microservicios internos del backend con alto volumen de transacciones por segundo y requerimientos de estricto rendimiento.
