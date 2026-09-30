# Práctica 6 — Mensajería Asíncrona con RabbitMQ
**COM-600 Microservicios · Gestión 2/2026**  
Facultad de Ciencia y Tecnología · Universidad Mayor Real y Pontificia de San Francisco Xavier de Chuquisaca

---

## 1. Descripción del Proyecto
Esta práctica implementa una arquitectura desacoplada orientada a eventos utilizando **RabbitMQ** como message broker entre microservicios, reemplazando la comunicación síncrona (REST, GraphQL, gRPC) por un modelo asíncrono y resiliente.

El sistema se compone de:
1. **RabbitMQ Broker**: Broker de mensajería con plugin de gestión (`rabbitmq:3.13-management`) ejecutado sobre Docker Compose.
2. **Microservicio Productor (`inscripciones`)**: API REST en Express (puerto 3000) que confirma inscripciones académicas y publica eventos de dominio (`InscripcionConfirmada`) con identificador único (`messageId`) y persistencia en disco (`persistent: true`).
3. **Microservicio Consumidor (`notificaciones`)**: Servicio worker en Node.js que procesa eventos de forma asíncrona, simula el envío de notificaciones por correo, gestiona confirmaciones manuales (`ack`), reintentos limitados vía Dead Letter Queue (DLQ) y garantiza idempotencia ante mensajes duplicados.
4. **Scripts de Topología**:
   - `topologia.js`: Declaración por código del exchange temático `eventos.academicos` y sus bindings (`correo.bienvenida`, `finanzas.cobros`, `auditoria.todo`).
   - `dlq.js`: Circuito completo de Dead Letter Queue con exchange de reintentos (`reintentos`), cola de reintentos con TTL de 5000 ms (`notificaciones.reintento`) y cola de mensajes muertos (`notificaciones.muertos`).

---

## 2. Requisitos Previos
- **Docker Engine o Docker Desktop** 24+ con complemento compose (`docker compose version`).
- **Node.js** v20 o superior (`node --version`).
- **npm** v10 o superior (`npm --version`).
- **curl** o Git Bash para peticiones HTTP.
- Puertos `5672` (AMQP) y `15672` (Consola Web) libres.

---

## 3. Instrucciones para Levantar Todo desde Cero

### Paso 1: Clonar el repositorio y ubicarse en la carpeta
```bash
git clone https://github.com/NisAnJIVO/MicroserviciosIV.git
cd MicroserviciosIV/Practicas/Practica6/practica6-rabbitmq
```

### Paso 2: Iniciar el Broker RabbitMQ
Levantar el contenedor del broker con Docker Compose:
```bash
docker compose up -d
```
Verificar que el contenedor esté corriendo y que el broker haya terminado su inicialización:
```bash
docker compose ps
docker compose logs rabbitmq | tail -5
```
*Espere a observar la línea `Server startup complete`.*

### Paso 3: Acceder a la Consola de Administración
Abra en su navegador web:
- **URL:** [http://localhost:15672](http://localhost:15672)
- **Usuario:** `admin`
- **Contraseña:** `admin123`

---

## 4. Ejecución de los Microservicios

### 4.1 Iniciar el Productor (`inscripciones`)
En una terminal:
```bash
cd inscripciones
npm install
node index.js
```
El servicio iniciará en el puerto `3000` y confirmará la conexión al broker.

### 4.2 Iniciar el Consumidor (`notificaciones`)
En otra terminal:
```bash
cd notificaciones
npm install
node index.js
```
El consumidor se suscribirá a la cola configurada (`notificaciones.correo`) con prefetch 1 y confirmación manual.

---

## 5. Pruebas y Comprobación de Comportamiento

### Publicar una inscripción válida:
```bash
curl -i -X POST http://localhost:3000/inscripciones \
  -H "Content-Type: application/json" \
  -d '{"estudiante":"Ana Gutierrez","correo":"ana@usfx.bo","curso":"COM-600"}'
```

### Configurar Topología de Exchanges Temáticos (Laboratorio 4):
```bash
node topologia.js
```

### Configurar Circuito de Reintentos y Cola Muerta DLQ (Laboratorio 6):
```bash
node dlq.js
```

### Provocar Mensaje Envenenado para Prueba de Reintentos (Laboratorio 6):
```bash
curl -i -X POST http://localhost:3000/inscripciones \
  -H "Content-Type: application/json" \
  -d '{"estudiante":"Ana Error","correo":"ana.punto.usfx.bo","curso":"COM-600"}'
```
El consumidor fallará 3 veces con intervalos de 5 segundos y transferirá el mensaje automáticamente a la cola `notificaciones.muertos`.
