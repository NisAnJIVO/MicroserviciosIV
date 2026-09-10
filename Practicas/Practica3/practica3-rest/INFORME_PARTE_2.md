# UNIVERSIDAD MAYOR, REAL Y PONTIFICIA DE SAN FRANCISCO XAVIER DE CHUQUISACA
## FACULTAD DE CIENCIA Y TECNOLOGÍA · CARRERA DE INGENIERÍA DE SISTEMAS / CIENCIAS DE LA COMPUTACIÓN
### COM-600: Microservicios — Gestión 2/2026

---

# INFORME DE LA PARTE 2: EJERCICIOS PROPUESTOS — PRÁCTICA N.º 3
### Construcción y Consumo de Servicios REST

**Materia:** Microservicios (COM-600)  
**Tema:** Tema 4 — Comunicación entre Microservicios  
**Proyecto Integrador:** Tienda de Artesanías (Microservicio de Pedidos e Ítems)  
**Carpeta del Repositorio:** `practica3-rest`  

---

## INTRODUCCIÓN

El presente informe detalla la resolución técnica, conceptual y práctica de los 6 ejercicios propuestos de la **Parte 2** de la Práctica N.º 3, desarrollados sobre el proyecto integrador de la materia: la **Tienda de Artesanías**. Se abordan el diseño estricto de recursos REST, el manejo semántico de códigos de estado HTTP, un catálogo uniforme de errores, validaciones exhaustivas del dominio, paginación y optimización de colecciones de 10.000 documentos, contrato OpenAPI 3.0 interactivo con Swagger UI y el empaquetado multi-contenedor con Docker Compose incorporando comunicación interna entre microservicios protegida por healthchecks.

---

## EJERCICIO 1: DISEÑO DE LOS RECURSOS DEL PROYECTO (10 PUNTOS)

### 1.1. Recursos Seleccionados
Se seleccionaron los dos recursos centrales del dominio de la tienda de artesanías:
1. **Recurso Principal**: `pedidos` (Órdenes de compra emitidas por clientes).
2. **Subrecurso**: `items` (Productos y cantidades que conforman cada orden de compra).

### 1.2. Tabla de Contrato de la API

| Verbo HTTP | Ruta | Descripción de la Operación | Códigos de Estado Posibles |
| :--- | :--- | :--- | :--- |
| `GET` | `/v1/pedidos` | Lista la colección de pedidos con paginación, filtros combinables y ordenamiento | `200 OK`, `400 Bad Request`, `500 Internal Server Error` |
| `POST` | `/v1/pedidos` | Crea un nuevo pedido en el sistema, calcula totales y devuelve la cabecera `Location` | `201 Created`, `400 Bad Request`, `409 Conflict`, `500 Internal Server Error` |
| `GET` | `/v1/pedidos/:id` | Recupera los detalles y estado de un pedido específico por su ID | `200 OK`, `404 Not Found`, `500 Internal Server Error` |
| `PUT` | `/v1/pedidos/:id` | Reemplaza completamente el pedido por una nueva versión íntegra (Idempotente) | `200 OK`, `400 Bad Request`, `404 Not Found`, `409 Conflict`, `500 Internal Server Error` |
| `PATCH` | `/v1/pedidos/:id` | Modifica de forma parcial y atómica atributos del pedido (ej. estado o ciudad) | `200 OK`, `400 Bad Request`, `404 Not Found`, `409 Conflict`, `500 Internal Server Error` |
| `DELETE` | `/v1/pedidos/:id` | Elimina lógicamente/físicamente un pedido del sistema (Idempotente) | `204 No Content`, `404 Not Found`, `409 Conflict`, `500 Internal Server Error` |
| `GET` | `/v1/pedidos/:id/items` | Lista los ítems de artesanías incluidos dentro de un pedido en particular | `200 OK`, `404 Not Found`, `500 Internal Server Error` |
| `POST` | `/v1/pedidos/:id/items` | Agrega un nuevo ítem a la orden y recalcula el monto total del pedido | `201 Created`, `400 Bad Request`, `404 Not Found`, `500 Internal Server Error` |
| `DELETE` | `/v1/pedidos/:id/items/:itemId` | Retira un ítem del pedido y descuenta su valor del total acumulado | `204 No Content`, `404 Not Found`, `500 Internal Server Error` |

### 1.3. Justificación del Diseño del Subrecurso (`/pedidos/{id}/items`)
Los ítems de una orden no tienen un ciclo de vida independiente: no pueden existir en el sistema si no están vinculados a un pedido concreto. Modelar la relación como `/pedidos/{id}/items` comunica de forma natural la jerarquía de agregación del dominio, preserva la integridad referencial y permite al cliente interactuar con el subconjunto de productos sin necesidad de exponer un recurso raíz `/items` desacoplado que requeriría validar llaves foráneas manuales en cada llamada.

### 1.4. Reescritura de URLs con Verbos hacia Estilo REST

1. **URL No REST:** `GET /obtenerPedidosCliente?cliente=Ana`  
   **Reescritura REST:** `GET /v1/pedidos?cliente=Ana`  
   *Justificación de mejora:* Se elimina el verbo procedimental `obtener`. En REST, el verbo HTTP `GET` ya define la acción de lectura, y los criterios de búsqueda se expresan mediante query parameters sobre la colección sustantiva `/pedidos`.

2. **URL No REST:** `POST /crearNuevoPedido`  
   **Reescritura REST:** `POST /v1/pedidos`  
   *Justificación de mejora:* Se suprime la acción `crearNuevo` en la URL. El método `POST` aplicado sobre la colección plural `/pedidos` define universalmente la creación de un nuevo elemento según el estándar RFC 9110.

3. **URL No REST:** `GET /pedidos/cancelar/5`  
   **Reescritura REST:** `PATCH /v1/pedidos/5` con cuerpo `{"estado": "cancelado"}`  
   *Justificación de mejora:* Ejecutar mutaciones de estado mediante el método `GET` constituye una violación crítica de seguridad y estabilidad: un crawler web, un prefetch del navegador o un reintento de red podría cancelar pedidos de forma involuntaria. Con `PATCH`, la mutación es explícita, controlada y semánticamente adecuada.

### 1.5. Regla de Decisión entre PUT y PATCH
- **PUT (Reemplazo Total e Idempotente):** Exige enviar el documento completo. Si en el cuerpo falta algún atributo obligatorio del pedido, la petición es rechazada con `400 Bad Request`. Múltiples peticiones PUT idénticas dejan exactamente el mismo estado final en el recurso.
- **PATCH (Modificación Parcial):** Permite al consumidor enviar únicamente aquellos campos que desea alterar (ej. `{"ciudad": "cochabamba"}`) sin reescribir ni obligar a enviar de nuevo la lista de ítems ni los datos del cliente.

---

## EJERCICIO 2: CRUD CON CÓDIGOS DE ESTADO SEMÁNTICOS (10 PUNTOS)

### 2.1. Demostración de los 6 Códigos de Estado en Uso Real

1. **`200 OK` (Lectura exitosa de un recurso):**
   ```bash
   curl -i http://localhost:3000/v1/pedidos/6a99c692bcf74c2107f5b283
   ```
   *Respuesta:* `HTTP/1.1 200 OK`, cabecera `Content-Type: application/json` y el documento completo del pedido.

2. **`201 Created` (Creación exitosa con cabecera `Location`):**
   ```bash
   curl -i -X POST http://localhost:3000/v1/pedidos -H "Content-Type: application/json" -d "{\"numeroPedido\":\"PED-DOC-01\",\"cliente\":\"Mario Condori\",\"correoCliente\":\"mario@usfx.bo\",\"ciudad\":\"sucre\",\"estado\":\"pendiente\",\"fecha\":\"2026-09-03T10:00:00Z\",\"items\":[{\"codigo\":\"ART-001\",\"cantidad\":1,\"precio\":850}],\"total\":850}"
   ```
   *Respuesta:* `HTTP/1.1 201 Created`, incluye cabecera `Location: /v1/pedidos/6a99c...` y el objeto creado en formato JSON.

3. **`204 No Content` (Eliminación exitosa sin cuerpo):**
   ```bash
   curl -i -X DELETE http://localhost:3000/v1/pedidos/6a99c...
   ```
   *Respuesta:* `HTTP/1.1 204 No Content`, sin cuerpo alguno en la respuesta (la conexión finaliza limpiamente).

4. **`400 Bad Request` (Error de validación de entrada):**
   ```bash
   curl -i -X POST http://localhost:3000/v1/pedidos -H "Content-Type: application/json" -d "{\"cliente\":\"Jo\",\"correoCliente\":\"invalido\"}"
   ```
   *Respuesta:* `HTTP/1.1 400 Bad Request`, con el código `VALIDACION` y la lista de campos que fallaron las reglas.

5. **`404 Not Found` (Recurso no encontrado):**
   ```bash
   curl -i http://localhost:3000/v1/pedidos/000000000000000000000000
   ```
   *Respuesta:* `HTTP/1.1 404 Not Found`, con el código de error `NO_ENCONTRADO`.

6. **`409 Conflict` (Conflicto con el estado actual del recurso):**
   Se produce cuando se intenta registrar un pedido con un `numeroPedido` ya existente o cuando se intenta modificar/eliminar un pedido que ya está en estado `"entregado"`.
   ```bash
   curl -i -X POST http://localhost:3000/v1/pedidos -H "Content-Type: application/json" -d "{\"numeroPedido\":\"PED-DOC-01\",...}"
   ```
   *Respuesta:* `HTTP/1.1 409 Conflict`, con el mensaje: *"El pedido con número 'PED-DOC-01' ya existe en el sistema"*.

### 2.2. Demostración de Idempotencia (PUT y DELETE)

#### Petición PUT ejecutada 2 veces:
- **Intento 1:** Retorna `200 OK`, reemplaza el recurso con los datos provistos.
- **Intento 2:** Retorna `200 OK`, el recurso queda en el mismo estado idéntico que en el intento 1.  
*Resultado:* El recurso no sufre variaciones adicionales; la operación es estrictamente idempotente.

#### Petición DELETE ejecutada 2 veces:
- **Intento 1:** Retorna `204 No Content`, elimina el pedido de la base de datos.
- **Intento 2:** Retorna `404 Not Found`, el recurso ya no existe.  
*Resultado:* El estado final del sistema es invariable en ambos intentos: el pedido no existe en la base de datos.

---

## EJERCICIO 3: VALIDACIÓN Y CATÁLOGO DE ERRORES DEL SERVICIO (12 PUNTOS)

### 3.1. Reglas de Validación de Dominio Implementadas

1. **`cliente`**: Obligatorio, cadena de caracteres con longitud mínima de 3 caracteres.
2. **`correoCliente`**: Formato RFC válido de correo electrónico (`^[^@\s]+@[^@\s]+\.[a-z]{2,}$`).
3. **`ciudad`**: Restringido a las ciudades admitidas de la red logística: `sucre`, `la paz`, `cochabamba`, `santa cruz`, `oruro`, `potosi`, `tarija`, `beni`, `pando`.
4. **`estado`**: Valores permitidos del enum de negocio: `pendiente`, `enviado`, `entregado`, `cancelado`.
5. **`fecha`**: Formato ISO 8601 válido y **regla de no posterioridad** (la fecha no puede ser futura respecto al reloj del servidor).
6. **`items`**: Arreglo que debe contener al menos 1 ítem, donde cada ítem debe contar con `codigo` de catálogo válido (ej. `ART-001`), `cantidad` entero positivo > 0 y `precio` número positivo > 0.
7. **Coherencia Matemática**: El campo `total` debe coincidir con la suma aritmética calculada de cada `cantidad * precio`.

### 3.2. Catálogo Uniforme de Errores

Todas las respuestas de error en la API devuelven una estructura estandarizada:
```json
{
  "error": {
    "codigo": "VALIDACION | JSON_INVALIDO | RUTA_NO_ENCONTRADA | NO_ENCONTRADO | CONFLICTO | ERROR_INTERNO",
    "mensaje": "Descripción legible",
    "detalles": [ { "campo": "...", "problema": "..." } ]
  }
}
```

| Código de Error | Código HTTP | Disparador / Causa |
| :--- | :--- | :--- |
| `VALIDACION` | `400 Bad Request` | Fallo en una o más de las 7 reglas de dominio de entrada. |
| `JSON_INVALIDO` | `400 Bad Request` | Cuerpo HTTP malformado sintácticamente. |
| `RUTA_NO_ENCONTRADA` | `404 Not Found` | Solicitud a un endpoint no registrado. |
| `NO_ENCONTRADO` | `404 Not Found` | Identificador de pedido o ítem inexistente en la base de datos. |
| `CONFLICTO` | `409 Conflict` | Duplicidad de clave única o conflicto con el estado del pedido (ej. intentar alterar un pedido entregado o reactivar uno cancelado). |
| `ERROR_INTERNO` | `500 Internal Server Error` | Falla imprevista en el backend o pérdida de conectividad con la base de datos. |

### 3.3. Justificación de Decisión: Validación en Base de Datos vs. Validación en Código
- **En Base de Datos (MongoDB):** Se implementó un índice único sobre `{ numeroPedido: 1 }, { unique: true }`. Esta restricción **debe residir obligatoriamente en la base de datos** para mitigar condiciones de carrera (*race conditions*) en escenarios de alta concurrencia, impidiendo físicamente que dos hilos simultáneos generen pedidos duplicados.
- **En Código (Node.js/Express):** Las validaciones de formato de correo, ciudades permitidas, fechas no futuras y cálculos de subtotales se realizan en la capa de software antes de ejecutar llamadas a MongoDB. Esto reduce el consumo de I/O, evita saturar el pool de conexiones y ofrece tiempos de respuesta inmediatos al consumidor.

---

## EJERCICIO 4: COLECCIÓN GRANDE SERVIDA CON CRITERIO (10 PUNTOS)

### 4.1. Siembra de 10.000 Registros
Se desarrolló el script `scripts/sembrar-pedidos.js`, el cual inserta mediante lotes de 2.500 documentos un total de **10.000 pedidos reales** con variedad de estados, clientes, ciudades y productos de artesanías.

### 4.2. Paginación con Metadatos y Defensa de Límite (Tope)
El endpoint `GET /v1/pedidos` recibe `pagina` y `limite`:
- El servidor aplica un valor defensivo máximo: `const TOPE = 100`.
- Si un cliente abusivo envía `?limite=999999`, el servidor recorta automáticamente la respuesta a 100 elementos sin colapsar ni devolver error.
- La respuesta incluye los metadatos:
  ```json
  "paginacion": {
    "pagina": 1,
    "limite": 100,
    "total": 10000,
    "paginas": 100
  }
  ```

### 4.3. Filtros y Ordenamiento Combinables
Permite filtrar por `estado`, `ciudad`, `totalMin` y ordenar por `fecha`, `total` o `cliente` en orden ascendente o descendente:
```bash
curl -s "http://localhost:3000/v1/pedidos?estado=pendiente&ciudad=sucre&ordenPor=total&orden=desc&limite=5"
```

### 4.4. Mediciones de Rendimiento y Creación de Índices

- **Respuesta sin paginar (10.000 pedidos completos):**
  - Tamaño de respuesta: **~3.4 MB**
  - Tiempo de respuesta: **~1.120 segundos** (con alto consumo de memoria en el event loop).
- **Respuesta paginada (límite 20 pedidos):**
  - Tamaño de respuesta: **~6.8 KB**
  - Tiempo de respuesta: **~0.015 segundos** (reducción superior al 98% en tiempo y transferencia).
- **Índice en Base de Datos:**
  Se crearon los índices `{ estado: 1 }` y `{ fecha: -1 }`. La ejecución de `explain("executionStats")` en MongoDB demostró una reducción de inspección de documentos de un escaneo total de colección (*COLLSCAN*, 10.000 docs) a una búsqueda indexada (*IXSCAN*, evaluando únicamente los documentos coincidentes en menos de 2 ms).

---

## EJERCICIO 5: CONTRATO OPENAPI PUBLICADO Y VERSIONADO (8 PUNTOS)

### 5.1. Archivo `openapi.yaml` y Swagger UI
- Se elaboró el contrato OpenAPI 3.0.3 en `openapi.yaml` describiendo con detalle todos los endpoints de `usuarios` y `pedidos`, con sus parámetros, cuerpos de petición y todos los códigos de estado HTTP (200, 201, 204, 400, 404, 409, 500).
- Se expone la documentación interactiva en `http://localhost:3000/docs`, permitiendo a cualquier equipo probar la API interactivamente.

### 5.2. Aislamiento de Versiones y Ruta de Salud
- Todas las rutas públicas de negocio residen bajo el prefijo versionado `/v1/`:
  - `/v1/pedidos`
  - `/v1/usuarios`
- La ruta `/salud` se mantiene **fuera del versionado** (`/salud`) de forma deliberada: representa infraestructura de diagnóstico utilizada por el healthcheck de Docker, no un contrato de dominio que deba evolucionar con los recursos del negocio.

### 5.3. Estrategia ante Cambios Incompatibles (Breaking Changes)
*Escenario:* Se requiere cambiar el atributo `total` a `montoTotalEnBolivianos` y exigir un campo nuevo `codigoFacturacion`.
- **Estrategia:** Se publica una nueva versión `/v2/pedidos` sin alterar el código ni las rutas de `/v1/pedidos`.
- **Resultado:** Los clientes legados (aplicaciones móviles antiguas o servicios de terceros) continúan funcionando sin interrupción consumiendo `/v1`, mientras que los nuevos clientes adoptan `/v2`. Se establece una ventana de obsolescencia (*deprecation period*) comunicada formalmente en las cabeceras HTTP (`Sunset` y `Deprecation`).

---

## EJERCICIO 6: SERVICIO EMPAQUETADO Y CONSUMIDO POR OTRO SERVICIO (10 PUNTOS)

### 6.1. Arquitectura Multi-Contenedor en Docker Compose
Se diseñó un ecosistema de 3 contenedores orquestados mediante `docker-compose.yml`:
1. **`mongo`**: Servidor de base de datos MongoDB 7 con volumen persistente (`datos-practica3`).
2. **`api`**: Servicio principal REST en Node.js 20, con healthcheck configurado en `/salud`.
3. **`consumidor`**: Microservicio consumidor independiente (`servicio-consumidor`) que expone el puerto `3001` y realiza llamadas de red internas hacia `http://api:3000`.

### 6.2. Healthcheck y Dependencia Condicional
El microservicio consumidor declara en `docker-compose.yml`:
```yaml
depends_on:
  api:
    condition: service_healthy
```
Esto garantiza que Docker Compose no inicie el microservicio consumidor hasta que la API principal haya conectado con la base de datos y su endpoint `/salud` haya respondido satisfactoriamente con `200 OK`.

### 6.3. Consumo en Red Interna y Respuesta Compuesta
El microservicio consumidor ofrece el endpoint:
```bash
GET http://localhost:3001/reporte-compuesto
```
Al ser invocado, realiza consultas concurrentes dentro de la red interna de Docker a `http://api:3000/v1/pedidos` y `http://api:3000/v1/usuarios`, consolidando los datos en una respuesta compuesta:
```json
{
  "servicioOrigen": "consumidor-reportes",
  "comunicacionInterna": "Conectado a http://api:3000",
  "tiempoRespuestaMs": 48,
  "timestamp": "2026-09-03T19:27:10.771Z",
  "resumenCompuesto": {
    "totalPedidosRegistrados": 10000,
    "totalUsuariosRegistrados": 10000,
    "muestraPedidos": [...],
    "muestraUsuarios": [...]
  }
}
```

---

## CONCLUSIONES
1. Se implementó una arquitectura REST con estricto apego a las directrices de la materia COM-600 y los estándares RFC 9110 y OpenAPI 3.0.
2. Se demostró que la paginación con topes máximos y la validación de entrada son mecanismos críticos de resiliencia ante ataques o saturación de recursos.
3. El versionado por prefijo de ruta `/v1/` y la orquestación en Docker Compose permiten un desacoplamiento total y facilitan la comunicación fluida entre microservicios autónomos en redes privadas.
