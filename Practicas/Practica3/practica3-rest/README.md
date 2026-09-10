# Práctica 3 — Construcción y Consumo de Servicios REST
**COM-600 Microservicios · Gestión 2/2026**  
**Facultad de Ciencia y Tecnología · Universidad Mayor, Real y Pontificia de San Francisco Xavier de Chuquisaca**

---

## 1. Descripción del Proyecto

Este proyecto implementa una arquitectura de servicios REST profesional, robusta y completamente desacoplada para la gestión de recursos de una **Tienda de Artesanías** (`pedidos` y sus subrecursos `items`) junto con el recurso de laboratorio (`usuarios`), siguiendo las mejores prácticas de la industria:

- **Diseño estricto REST**: Recursos identificados mediante sustantivos en plural, semántica de verbos HTTP estándar, sin verbos en las URLs.
- **Códigos de estado semánticos**: `200 OK`, `201 Created` (con cabecera `Location`), `204 No Content` (sin cuerpo), `400 Bad Request`, `404 Not Found`, `409 Conflict`, y `500 Internal Server Error`.
- **Validación de dominio exhaustiva**: Más de 6 reglas de negocio validadas en memoria antes de tocar la base de datos.
- **Manejo uniforme de errores**: Todas las respuestas 4xx y 5xx devuelven un único formato JSON consistente (nunca HTML ni trazas de excepciones).
- **Paginación, filtrado y ordenamiento en el servidor**: Paginación con metadatos (`pagina`, `limite`, `total`, `paginas`), filtros combinables, ordenación por múltiples atributos y tope defensivo (`TOPE = 100`).
- **Versionado y Contrato OpenAPI**: API expuesta bajo `/v1/`, interfaz interactiva Swagger UI en `/docs`, y endpoint de salud `/salud` fuera del versionado para infraestructura.
- **Microservicios y Docker Compose**: Empaquetado en contenedores Docker con persistencia mediante volúmenes, healthcheck de servicio y un microservicio consumidor (`consumidor-reportes`) que realiza comunicación entre servicios a través de la red interna de Docker.

---

## 2. Diseño de Recursos y Contrato de Rutas

### Recurso Usuarios (`/v1/usuarios` - Parte 1 Guiada)

| Verbo HTTP | Ruta | Descripción | Códigos de Estado |
| :--- | :--- | :--- | :--- |
| `GET` | `/v1/usuarios` | Lista usuarios con paginación, filtros y orden | `200` |
| `POST` | `/v1/usuarios` | Crea un nuevo usuario | `201` (con cabecera `Location`), `400`, `409` |
| `GET` | `/v1/usuarios/:id` | Obtiene un usuario por ID | `200`, `404` |
| `PUT` | `/v1/usuarios/:id` | Reemplaza un usuario por completo (idempotente) | `200`, `400`, `404`, `409` |
| `DELETE` | `/v1/usuarios/:id` | Elimina un usuario (idempotente) | `204` (sin cuerpo), `404` |

---

### Recurso Pedidos y Subrecurso Items (`/v1/pedidos` - Parte 2 Proyecto Integrador)

| Verbo HTTP | Ruta | Descripción | Códigos de Estado |
| :--- | :--- | :--- | :--- |
| `GET` | `/v1/pedidos` | Lista pedidos con paginación, filtro por estado/ciudad/total y orden | `200`, `400` |
| `POST` | `/v1/pedidos` | Crea un nuevo pedido | `201` (con cabecera `Location`), `400`, `409` |
| `GET` | `/v1/pedidos/:id` | Obtiene el detalle de un pedido | `200`, `404` |
| `PUT` | `/v1/pedidos/:id` | Reemplaza la totalidad del pedido (idempotente) | `200`, `400`, `404`, `409` |
| `PATCH` | `/v1/pedidos/:id` | Modifica parcialmente un pedido (ej. estado o ciudad) | `200`, `400`, `404`, `409` |
| `DELETE` | `/v1/pedidos/:id` | Elimina un pedido (idempotente) | `204` (sin cuerpo), `404`, `409` |
| `GET` | `/v1/pedidos/:id/items` | Lista los items de un pedido (subrecurso) | `200`, `404` |
| `POST` | `/v1/pedidos/:id/items` | Agrega un nuevo item al pedido y recalcula el total | `201` (con `Location`), `400`, `404` |
| `DELETE` | `/v1/pedidos/:id/items/:itemId` | Elimina un item del pedido y ajusta el monto | `204` (sin cuerpo), `404` |

#### Justificación del Subrecurso `/v1/pedidos/:id/items`
Los items de una orden de compra no poseen existencia independiente fuera del contexto del pedido que los agrupa. Modelar `/pedidos/:id/items` como un subrecurso expresa con claridad la relación de composición e integridad referencial requerida en un sistema de microservicios de comercio electrónico.

#### Criterio de Selección entre PUT y PATCH
- **PUT**: Se utiliza para el **reemplazo completo e idempotente** del recurso. Exige enviar el documento íntegro. Si el cliente omite un campo requerido, la petición es rechazada con `400 Bad Request`. Ejecutar la misma llamada PUT múltiples veces produce exactamente el mismo estado final en el servidor.
- **PATCH**: Se utiliza para la **modificación parcial no destructiva**. Permite enviar únicamente los atributos que se desean modificar (por ejemplo `{"ciudad": "cochabamba"}` o `{"estado": "enviado"}`) sin obligar al cliente a reenviar todo el cuerpo ni los items asociados.

#### Reescritura de URLs no REST
1. `GET /obtenerPedidosCliente?cliente=Ana` ➔ `GET /v1/pedidos?cliente=Ana`  
   *Mejora*: Elimina el verbo `obtener` de la URL y utiliza el verbo HTTP `GET` estándar junto con query parameters para el filtrado.
2. `POST /crearNuevoPedido` ➔ `POST /v1/pedidos`  
   *Mejora*: Elimina la acción `crearNuevo` de la URL. En REST, el método `POST` sobre la colección sustantiva en plural `/pedidos` define la acción de creación.
3. `GET /pedidos/cancelar/5` ➔ `PATCH /v1/pedidos/5` con `{"estado": "cancelado"}`  
   *Mejora*: Evita el peligro crítico de realizar mutaciones de estado mediante el método `GET` (que debe ser seguro e idempotente según RFC 9110), reemplazándolo por una modificación parcial semántica con `PATCH`.

---

## 3. Catálogo de Errores y Formato Uniforme

Todas las respuestas de error (códigos 4xx y 5xx) respetan sin excepción el siguiente contrato JSON:

```json
{
  "error": {
    "codigo": "CODIGO_ERROR",
    "mensaje": "Descripción legible para humanos",
    "detalles": [
      { "campo": "nombre_campo", "problema": "descripción del problema" }
    ]
  }
}
```

| Código de Error | Código HTTP | Cuándo se produce |
| :--- | :--- | :--- |
| `VALIDACION` | `400 Bad Request` | Cuando uno o más campos no cumplen con las reglas de validación de negocio (longitud, rangos, formato de correo, fechas futuras o totales incoherentes). |
| `JSON_INVALIDO` | `400 Bad Request` | Cuando el cuerpo de la petición HTTP no contiene un JSON sintácticamente válido. |
| `RUTA_NO_ENCONTRADA` | `404 Not Found` | Cuando el cliente solicita una URI inexistente en el servidor. |
| `NO_ENCONTRADO` | `404 Not Found` | Cuando el recurso identificado por su ID no existe en la base de datos. |
| `CONFLICTO` | `409 Conflict` | Cuando la operación no puede realizarse debido a un conflicto con el estado actual del recurso (ej. correo duplicado, número de pedido ya registrado, o intento de borrar/reemplazar un pedido que ya fue entregado). |
| `ERROR_INTERNO` | `500 Internal Server Error` | Cuando ocurre una excepción no controlada en el servidor o falla la conexión a la base de datos. |

---

## 4. Reglas de Validación de Dominio (Parte 2 - Ejercicio 3)

1. **`cliente`**: Obligatorio, mínimo 3 caracteres alfanuméricos.
2. **`correoCliente`**: Formato estricto de correo electrónico institucional o comercial (`^[^@\s]+@[^@\s]+\.[a-z]{2,}$`).
3. **`ciudad`**: Restringido a las capitales de departamento de Bolivia (`sucre`, `la paz`, `cochabamba`, `santa cruz`, `oruro`, `potosi`, `tarija`, `beni`, `pando`).
4. **`estado`**: Enum controlado de estados del ciclo de vida (`pendiente`, `enviado`, `entregado`, `cancelado`).
5. **`fecha`**: Formato ISO 8601 válido y **no puede ser una fecha futura** (control de integridad temporal).
6. **`items`**: Arreglo no vacío con al menos un ítem. Cada ítem debe incluir:
   - `codigo`: Formato de catálogo de artesanías (ej. `ART-001`).
   - `cantidad`: Entero estrictamente mayor a 0.
   - `precio`: Número decimal positivo mayor a 0.
7. **Coherencia Matemática**: El campo `total` debe coincidir exactamente con la suma calculada de `cantidad * precio` de todos los ítems.

### Justificación de Validación en Base de Datos vs. Código
- **En Base de Datos (MongoDB)**: Se implementó un índice único sobre `{ numeroPedido: 1 }` y sobre `{ correo: 1 }`. Esto es indispensable a nivel de base de datos para prevenir condiciones de carrera (*race conditions*) en entornos concurrentes, garantizando que dos peticiones simultáneas nunca puedan generar duplicados.
- **En Código (Node.js/Express)**: Las reglas de formato de correos, ciudades admitidas, rangos, fechas no futuras y validación matemática de totales se validan en memoria antes de tocar la base de datos. Esto ahorra procesamiento, evita abrir transacciones o conexiones innecesarias y ofrece retroalimentación inmediata al cliente.

---

## 5. Instrucciones de Ejecución

### Requisitos Previos
- Node.js 20+ y npm 10+
- Docker y Docker Compose
- curl (o PowerShell en Windows)

---

### Modo 1: Ejecución con Docker Compose (Recomendado - 1 Solo Comando)

Para levantar la base de datos MongoDB, la API principal y el microservicio consumidor en una red aislada:

```bash
docker compose up -d --build
```

Verificar el estado de los servicios:
```bash
docker compose ps
```

- **API Principal**: `http://localhost:3000`
- **Documentación Swagger UI**: `http://localhost:3000/docs`
- **Microservicio Consumidor**: `http://localhost:3001/reporte-compuesto`

Para detener el entorno:
```bash
docker compose down
```

---

### Modo 2: Ejecución Local en Modo Desarrollo

1. Levantar el contenedor de base de datos MongoDB:
```bash
docker volume create datos-practica3
docker run -d --name mongo-practica3 -p 27017:27017 -v datos-practica3:/data/db mongo:7
```

2. Instalar dependencias:
```bash
npm install
```

3. Sembrar datos de prueba (10,000 registros para usuarios y pedidos):
```bash
node scripts/sembrar.js
node scripts/sembrar-pedidos.js
```

4. Iniciar el servidor en modo desarrollo con recarga automática:
```bash
npm run dev
```

5. Probar con curl:
```bash
curl -i http://localhost:3000/salud
curl -i http://localhost:3000/v1/usuarios?limite=5
curl -i http://localhost:3000/v1/pedidos?limite=5
```
