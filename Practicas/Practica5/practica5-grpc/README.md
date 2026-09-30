# Práctica 5 — Comunicación de Alto Rendimiento con gRPC
**COM-600 Microservicios · Universidad Mayor Real y Pontificia de San Francisco Xavier de Chuquisaca**

Este repositorio contiene la implementación completa de la **Práctica 5** sobre comunicación de alto rendimiento con gRPC, serialización binaria con Protocol Buffers (proto3), streaming del servidor, evolución de contratos sin romper clientes y despliegue en contenedores Docker con integración REST.

---

## 📁 Estructura del Proyecto

```
practica5-grpc/
├── proto/                     # Contrato actual del servicio gRPC
│   ├── estudiantes.proto      # Contrato de estudiantes (Parte 1)
│   └── pedidos.proto          # Contrato de pedidos (Parte 2)
├── proto-v1/                  # Versión 1 congelada del contrato (representa clientes existentes)
│   ├── estudiantes.proto      # Contrato congelado V1 de estudiantes
│   └── pedidos.proto          # Contrato congelado V1 de pedidos
├── src/                       # Código fuente de servidores y clientes
│   ├── carga.js               # Módulo de carga dinámica de contratos proto
│   ├── inspeccionar.js        # Inspección de tipos y rutas gRPC
│   ├── bytes.js               # Comparación de serialización Protobuf vs JSON
│   ├── servidor.js            # Servidor gRPC (Parte 1)
│   ├── cliente.js             # Cliente gRPC básico
│   ├── buscar.js              # Cliente de búsqueda con manejo de errores
│   ├── listar.js              # Cliente de consumo de Stream gRPC
│   ├── sembrar.js             # Sembrado de 500 registros para pruebas
│   ├── medir.js               # Benchmark estadístico y tamaños de payload
│   └── parte2/                # Implementación completa de la Parte 2 (Proyecto Integrador)
│       ├── carga_pedidos.js
│       ├── inspeccionar_pedidos.js
│       ├── pedidos_servidor.js
│       ├── pedidos_cliente.js
│       ├── pedidos_sembrar.js
│       ├── pedidos_listar_stream.js
│       └── pedidos_medir.js
├── informe/                   # Informes y tablas comparativas
│   ├── comparacion.md         # Tabla comparativa REST vs GraphQL vs gRPC
│   └── INFORME_PARTE2.md      # Informe técnico completo de la Parte 2
├── Dockerfile                 # Empaquetado del servicio gRPC
├── docker-compose.yml         # Orquestación de servicios en red privada
├── package.json               # Dependencias (@grpc/grpc-js, @grpc/proto-loader)
├── .gitignore                 # Exclusión de node_modules
└── README.md                  # Documentación del proyecto
```

---

## ❓ ¿Por qué existe la carpeta `proto-v1`?

La carpeta `proto-v1/` almacena una **copia congelada del contrato original**. En un entorno de producción con microservicios distribuidos, los clientes no se actualizan simultáneamente al desplegar un nuevo servidor. Mantener `proto-v1` permite:
1. Simular clientes legacy en producción mediante la variable de entorno `PROTO_DIR=./proto-v1`.
2. Validar que los nuevos campos agregados al servidor con nuevos tags no rompen los clientes existentes (*compatibilidad hacia adelante*).
3. Demostrar empíricamente cómo Protocol Buffers descarta campos desconocidos sin producir errores en tiempo de ejecución.

---

## 📜 Reglas de Evolución de Contratos (.proto)

Para evitar la **corrupción silenciosa de datos** y garantizar la estabilidad del sistema:

1. **Inmutabilidad de Números de Campo (Tags):** Nunca se debe cambiar ni reasignar el número de un campo existente en un archivo `.proto`. Lo que viaja por la red es el número binario y no el nombre del campo.
2. **Reserva Obligatoria de Campos Deprecados:** Cuando un campo deja de utilizarse, debe marcarse inmediatamente con `reserved <número>;` y `reserved "<nombre>";` para que el compilador impida cualquier intento futuro de reusar ese tag.
3. **Encapsulamiento en Mensajes de Petición:** Toda operación RPC debe recibir y devolver un mensaje estructurado (`message`), nunca tipos escalares primitivos sueltos, permitiendo agregar nuevos parámetros en el futuro sin modificar la firma del método.

*Estas reglas deben ser revisadas por el Tech Lead / Revisor de Código durante los Pull Requests y validadas automáticamente mediante linters de contratos como `buf`.*

---

## 🚀 Instrucciones para Levantar el Proyecto

### 1. Instalación de Dependencias
```bash
npm install
```

### 2. Ejecutar la Parte 1 (Laboratorios Guiados)
- **Inspección del contrato:** `node src/inspeccionar.js`
- **Comparación de bytes:** `node src/bytes.js`
- **Servidor gRPC:** `node src/servidor.js`
- **Clientes:**
  - `node src/cliente.js`
  - `node src/buscar.js 9876543`
  - `node src/buscar.js 0000000`
- **Streaming y Sembrado:**
  - `node src/sembrar.js`
  - `node src/listar.js Sistemas`
- **Mediciones:** `node src/medir.js`

### 3. Ejecutar la Parte 2 (Proyecto Integrador - Pedidos)
- **Inspeccionar contrato:** `node src/parte2/inspeccionar_pedidos.js`
- **Servidor de Pedidos:** `node src/parte2/pedidos_servidor.js`
- **Pruebas de errores y cliente:** `node src/parte2/pedidos_cliente.js`
- **Sembrado de 600 pedidos:** `node src/parte2/pedidos_sembrar.js`
- **Consumo de flujo de pedidos:** `node src/parte2/pedidos_listar_stream.js`
- **Benchmark y mediciones:** `node src/parte2/pedidos_medir.js`

### 4. Despliegue con Docker y Docker Compose
Para levantar el microservicio gRPC junto con el servicio REST consumidor en la misma red privada de Docker:

```bash
docker compose up --build
```

El servicio REST estará disponible en `http://localhost:3000/usuarios/1/expediente`, consumiendo internamente al servicio gRPC en `estudiantes:50051`.
