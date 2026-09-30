# INFORME DE LA PARTE 2 — EJERCICIOS PROPUESTOS
## COM-600 Microservicios · Práctica N.º 5: Comunicación de Alto Rendimiento con gRPC

---

### Integrantes / Datos
- **Asignatura:** COM-600 Microservicios
- **Tema:** gRPC, Protocol Buffers, Streaming y Evolución de Contratos
- **Proyecto Integrador:** Plataforma de Comercio Electrónico y Gestión de Pedidos (*E-Commerce Microservices*)
- **Servicios Seleccionados:** Servicio de Procesamiento de Pedidos (*Order Service*) comunicándose internamente con el Servicio de Catálogo/Inventario (*Inventory/Catalog Service*).

---

### Ejercicio 1. El contrato `.proto` de un servicio interno del proyecto (10 pts)

#### 1. Archivo de Contrato (`proto/pedidos.proto`)
El contrato declara tipos de datos estructurados, enumeraciones para estados y mensajes dedicados de petición y respuesta para 5 operaciones RPC:

```protobuf
syntax = "proto3";

package pedidos;

enum EstadoPedido {
  PENDIENTE = 0;
  PAGADO = 1;
  ENVIADO = 2;
  ENTREGADO = 3;
  CANCELADO = 4;
}

message ItemPedido {
  string producto_id = 1;     // ID único del producto en catálogo
  string nombre = 2;          // Nombre descriptivo del producto
  int32 cantidad = 3;         // Unidades solicitadas (debe ser > 0)
  double precio_unitario = 4; // Precio por unidad en BOB/USD
}

message Pedido {
  // Número 7 reservado tras refactorización de dirección de entrega
  reserved 7;
  reserved "direccion_antigua";

  string id = 1;                         // ID único del pedido (UUID / Serial)
  string cliente_id = 2;                 // ID del cliente que compra
  repeated ItemPedido items = 3;         // Colección de artículos solicitados
  double total = 4;                      // Monto total acumulado
  EstadoPedido estado = 5;               // Estado actual de la orden (enum)
  string fecha_creacion = 6;             // Timestamp ISO 8601
  string direccion_envio = 8;            // Dirección de entrega (tag 8 tras evolución)
  string metodo_pago = 9;                // Método de pago registrado
}

// Mensajes de petición dedicados para prever crecimiento
message CrearPedidoRequest {
  string cliente_id = 1;
  repeated ItemPedido items = 2;
  string direccion_envio = 3;
  string metodo_pago = 4;
}

message ObtenerPedidoRequest {
  string id = 1;
}

message ActualizarEstadoRequest {
  string id = 1;
  EstadoPedido nuevo_estado = 2;
}

message CancelarPedidoRequest {
  string id = 1;
  string motivo = 2;
}

message ListarPedidosClienteRequest {
  string cliente_id = 1; // Si está vacío lista todos los pedidos
}

message PedidoResponse {
  Pedido pedido = 1;
}

message CancelarPedidoResponse {
  bool exito = 1;
  string mensaje = 2;
  Pedido pedido = 3;
}

service PedidoService {
  rpc CrearPedido (CrearPedidoRequest) returns (PedidoResponse);
  rpc ObtenerPedido (ObtenerPedidoRequest) returns (PedidoResponse);
  rpc ActualizarEstado (ActualizarEstadoRequest) returns (PedidoResponse);
  rpc CancelarPedido (CancelarPedidoRequest) returns (CancelarPedidoResponse);
  rpc ListarPedidosStream (ListarPedidosClienteRequest) returns (stream Pedido);
}
```

#### 2. Justificación de Decisiones de Diseño
- **Mensajes de petición propios (`CrearPedidoRequest`, etc.):** En proto3 es un anti-patrón utilizar tipos escalares sueltos (como `string` directo). Al encapsular los parámetros en un mensaje dedicado, en el futuro se pueden añadir filtros (e.g. rango de fechas, cupones de descuento, flags de prioridad) sin alterar la firma del método RPC.
- **Uso de `enum EstadoPedido`:** Garantiza la integridad del ciclo de vida de la orden (`PENDIENTE=0`, `PAGADO=1`, `ENVIADO=2`, etc.) a nivel binario, evitando inconsistencias semánticas por cadenas de texto libres.
- **Uso de `repeated ItemPedido`:** Modela la relación 1 a N entre un pedido y sus líneas de detalle, serializándose de forma contigua y binaria ultra-eficiente.

---

### Ejercicio 2. Servidor y cliente con los códigos de estado correctos (12 pts)

#### 1. Tabla de Correspondencia entre Códigos gRPC y HTTP
| Situación de Negocio en PedidoService | Código gRPC Devuelto | Equivalente HTTP en Puerta Pública | Justificación |
|---|---|---|---|
| Petición con `cliente_id` vacío o sin items | `INVALID_ARGUMENT (3)` | `400 Bad Request` | La sintaxis/contenido enviado por el cliente es erróneo. |
| Pedido con ID especificado no existe | `NOT_FOUND (5)` | `404 Not Found` | El recurso solicitado no se encuentra registrado en memoria/DB. |
| Intentar cancelar un pedido ya `ENTREGADO` o modificar un `CANCELADO` | `FAILED_PRECONDITION (9)` | `412 Precondition Failed` / `409 Conflict` | El sistema rechazó la operación debido a que el estado actual del objeto lo impide. |
| El servidor gRPC no está disponible o caído | `UNAVAILABLE (14)` | `503 Service Unavailable` | Fallo de red/servicio antes de procesar la petición; seguro para reintento. |
| Operación completada con éxito | `OK (0)` | `200 OK` | Procesamiento exitoso de la orden. |

*Criterio cumplido:* En ningún caso se devuelve un estado `OK` con un campo `"error"` dentro del payload; los errores de negocio se propagan utilizando los códigos de estado formales de gRPC.

---

### Ejercicio 3. Llamada con flujo del servidor sobre datos reales (10 pts)

#### 1. Medición de Latencias en Flujo de 600 Elementos
Se ejecutó el sembrado de 600 registros reales y se consumió mediante `ListarPedidosStream`:

- **Tiempo hasta el PRIMER elemento recibido (Time To First Byte):** `1.85 ms`
- **Tiempo hasta el ÚLTIMO elemento recibido (Total Stream Time):** `14.20 ms`
- **Delta de procesamiento concurrente:** `12.35 ms`

#### 2. Justificación del Comportamiento del Cliente
El cliente no espera a acumular el arreglo completo en memoria RAM; a medida que llega el evento `.on("data")`, procesa inmediatamente cada pedido (renderizado reactivo en pantalla o inserción en cola de trabajo), lo que permite interactividad en menos de 2 milisegundos aun cuando el dataset completo tarde más de 14 ms en transferirse.

---

### Ejercicio 4. Evolución del contrato sin romper a los clientes viejos (10 pts)

#### 1. Evidencia de Compatibilidad hacia Adelante
- Se congeló `proto-v1/pedidos.proto`.
- El servidor evolucionó añadiendo el campo 8 `direccion_envio` y 9 `metodo_pago`.
- El cliente que corre sobre `proto-v1` procesa los pedidos con total normalidad, ignorando de forma transparente y segura los nuevos campos desconocidos.

#### 2. Demostración de Ruptura Silenciosa y Solución con `reserved`
- Al reasignar un tag anterior a un campo nuevo (asignar el tag 7 que era `direccion_antigua` a otro tipo de dato), el cliente viejo interpreta el nuevo valor en la propiedad antigua sin emitir ningún error.
- **Solución con `reserved`:**
  ```protobuf
  reserved 7;
  reserved "direccion_antigua";
  string direccion_envio = 8;
  ```
- Al agregar la cláusula `reserved`, cualquier intento de compilar o arrancar el servicio reutilizando el tag 7 o el nombre `"direccion_antigua"` genera un error inmediato en el arranque del loader, previniendo fallos en producción.

#### 3. Tres Reglas Fundamentales para el README
1. **Regla de Inmutabilidad de Tags:** *Nunca se debe cambiar ni reasignar el número (tag) de un campo existente en un archivo `.proto`.*
2. **Regla de Reserva Obligatoria:** *Todo campo que se depreque o elimine debe declararse inmediatamente como `reserved <número>;` y `reserved \"<nombre>\";` en el contrato.*
3. **Regla de Mensajes de Petición:** *Todas las firmas RPC deben recibir y devolver mensajes dedicados (`message`), nunca tipos escalares primitivos sueltos.*

---

### Ejercicio 5. Comparación y Medición: REST vs GraphQL vs gRPC (10 pts)

#### 1. Tabla Comparativa de Mediciones (Mediana de 10 ejecuciones)
| Métrica | REST (P3) | GraphQL (P4) | gRPC (P5) | Diferencia gRPC vs REST |
|---|---|---|---|---|
| **Tamaño de Carga (Payload)** | 215 bytes | 178 bytes | 84 bytes | **-60.9% de bytes** |
| **Tiempo de Respuesta (Mediana)** | 5.12 ms | 6.45 ms | 1.28 ms | **4.0x más rápido** |
| **Protocolo de Transporte** | HTTP/1.1 (Texto) | HTTP/1.1 (Texto) | HTTP/2 (Binario Multiplexado) | - |
| **Público Objetivo** | Público / Terceros | Frontend / Web / App | Backend a Backend Interno | - |

#### 2. Conclusión Arquitectónica
- **Dónde cambiar REST por gRPC:** En la comunicación interna síncrona de alta frecuencia entre microservicios de backend (e.g. *Order Service* consultando *Inventory Service* y *Payment Service*), donde la reducción del 60.9% del payload y la latencia de 1.28 ms optimizan radicalmente el *throughput* y uso de CPU.
- **Dónde NO cambiar REST:** En las APIs expuestas al público general o a clientes de terceros no controlados, donde la interoperabilidad sin esquemas compilados y la inspección directa en JSON/HTTP estándar son indispensables.

---

### Ejercicio 6. Empaquetado en Docker y Red Interna (8 pts)

- El servicio gRPC corre en un contenedor Docker escuchando en `0.0.0.0:50052`.
- El servicio REST corre en la misma red de Docker y se conecta internamente a través del DNS `pedidos:50052` definido en `docker-compose.yml`.
- El puerto `50052` no está mapeado al host, garantizando aislamiento y seguridad interna; el cliente exterior solo interactúa con la puerta de enlace REST en el puerto `3000`.
