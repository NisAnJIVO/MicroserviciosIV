# 📸 GUÍA PASO A PASO PARA SACAR LAS 20 CAPTURAS DE PANTALLA
### COM-600 Microservicios · Práctica 6: Mensajería Asíncrona con RabbitMQ

> **⚠️ Requisito previo indispensable:**  
> Asegúrate de tener **Docker Desktop iniciado** en tu computadora (debe verse el icono de la ballena verde en la barra de tareas de Windows).  
> Abre tus terminales de **PowerShell** o **Git Bash** en la carpeta de trabajo:  
> `c:\Users\Usuario\Desktop\MICROSERVICIOSIV\Practicas\Practica6\practica6-rabbitmq`  
> *Recuerda que en las capturas de terminal debe apreciarse tu nombre de usuario o nombre de equipo para validar la autoría.*

---

## 🟢 Laboratorio 0 — El broker en marcha y su consola de administración

### 📷 CAPTURA N.º 1: Salida de los cinco comandos de verificación
1. En tu terminal principal de PowerShell en `practica6-rabbitmq`, ejecuta:
   ```powershell
   docker --version
   docker compose version
   node --version
   curl.exe --version
   docker ps
   ```
2. **Qué capturar:** La consola mostrando la salida limpia de las versiones de Docker, Compose, Node, Curl y la tabla de `docker ps`.

---

### 📷 CAPTURA N.º 2: Contenedor corriendo y registro de inicio del broker
1. Levanta el contenedor de RabbitMQ:
   ```powershell
   docker compose up -d
   docker compose ps
   docker compose logs rabbitmq | Select-String "Server startup complete" -Context 2,2
   ```
   *(o `docker compose logs rabbitmq | tail -5`)*
2. **Qué capturar:** La salida de `docker compose ps` con `com600-rabbit` en estado `running` (puertos 5672 y 15672 mapeados) y la línea `Server startup complete`.

---

### 📷 CAPTURA N.º 3: Consola de administración de RabbitMQ (Overview)
1. Abre tu navegador web en: [http://localhost:15672](http://localhost:15672)
2. Ingresa con las credenciales:
   - **Username:** `admin`
   - **Password:** `admin123`
3. Quédate en la pestaña principal **Overview**.
4. **Qué capturar:** La pantalla de la consola mostrando la pestaña **Overview** donde se aprecie claramente el nombre del nodo **`rabbit-uno`** y los gráficos de actividad del broker.

---

## 🟢 Laboratorio 1 — Anatomía del enrutamiento: exchange, cola y binding

### 📷 CAPTURA N.º 4: Creación del exchange `inscripciones`
1. En la consola web ([http://localhost:15672](http://localhost:15672)), ve a la pestaña **Exchanges**.
2. Despliega la sección **Add a new exchange**:
   - **Name:** `inscripciones`
   - **Type:** `direct`
   - **Durability:** `Durable`
   - Clic en el botón **Add exchange**.
3. **Qué capturar:** La tabla de lista de exchanges mostrando el exchange `inscripciones`, con Type = `direct` y los Features mostrando la marca **`D`** (durable).

---

### 📷 CAPTURA N.º 5: Binding hacia la cola `notificaciones.correo`
1. Ve a la pestaña **Queues and Streams** -> **Add a new queue**:
   - **Type:** `Classic`
   - **Name:** `notificaciones.correo`
   - **Durability:** `Durable`
   - Clic en **Add queue**.
2. Regresa a la pestaña **Exchanges** y haz clic sobre el exchange **`inscripciones`**.
3. Despliega la sección **Bindings** -> **Add binding from this exchange**:
   - **To queue:** `notificaciones.correo`
   - **Routing key:** `inscripcion.confirmada`
   - Clic en **Bind**.
4. **Qué capturar:** La sección de Bindings del exchange `inscripciones` donde se observe el enlace hacia la cola `notificaciones.correo` con la clave de enrutamiento `inscripcion.confirmada`.

---

### 📷 CAPTURA N.º 6: Publicar y recuperar mensaje a mano
1. En la misma página del exchange `inscripciones`, despliega la sección **Publish message**:
   - **Routing key:** `inscripcion.confirmada`
   - **Payload:** `{"prueba":1}`
   - Clic en **Publish message**.
2. Ve a la pestaña **Queues** y haz clic sobre la cola **`notificaciones.correo`**.
3. Despliega la sección **Get messages**:
   - **Ack Mode:** `Nack message requeue true`
   - Clic en el botón **Get Message(s)**.
4. **Qué capturar:** El panel desplegado de `Get messages` mostrando el payload `{"prueba":1}`, la routing key `inscripcion.confirmada` y las propiedades del mensaje.

---

## 🟢 Laboratorio 2 — El productor: publicar un evento

### 📷 CAPTURA N.º 7: Terminales del productor conectado y respuesta 201 de curl
1. Abre una **Terminal A** en `practica6-rabbitmq/inscripciones`:
   ```powershell
   cd c:\Users\Usuario\Desktop\MICROSERVICIOSIV\Practicas\Practica6\practica6-rabbitmq\inscripciones
   node index.js
   ```
   *(Verás: `[inscripciones] conectado al broker` y `[inscripciones] API en el puerto 3000`)*
2. Abre una **Terminal B** y envía la solicitud HTTP:
   ```powershell
   curl.exe -i -X POST http://localhost:3000/inscripciones -H "Content-Type: application/json" -d '{\"estudiante\":\"Ana Gutierrez\",\"correo\":\"ana@usfx.bo\",\"curso\":\"COM-600\"}'
   ```
3. **Qué capturar:** Una captura donde se vean ambas terminales (o pantalla dividida): la Terminal A con el productor corriendo y la Terminal B mostrando la respuesta con código `HTTP/1.1 201 Created` y el JSON con el `id: INS-...`.

---

### 📷 CAPTURA N.º 8: Mensaje esperando en cola sin consumidores
1. Ve a la consola web de RabbitMQ ([http://localhost:15672/#/queues](http://localhost:15672/#/queues)) -> sección **Queues**.
2. Ubica la cola **`notificaciones.correo`**.
3. **Qué capturar:** La fila de la cola `notificaciones.correo` mostrando **1** mensaje en la columna **Ready**, **0** en **Unacked**, y **0** en la columna **Consumers**.

---

## 🟢 Laboratorio 3 — El consumidor y la demostración del desacoplamiento

### 📷 CAPTURA N.º 9: Consumidor procesando eventos
1. Deja la Terminal A (productor) corriendo.
2. Abre una **Terminal C** en `practica6-rabbitmq/notificaciones`:
   ```powershell
   cd c:\Users\Usuario\Desktop\MICROSERVICIOSIV\Practicas\Practica6\practica6-rabbitmq\notificaciones
   node index.js
   ```
3. En la Terminal B (cliente), envía dos inscripciones más:
   ```powershell
   curl.exe -X POST http://localhost:3000/inscripciones -H "Content-Type: application/json" -d '{\"estudiante\":\"Carlos Perez\",\"correo\":\"carlos@usfx.bo\",\"curso\":\"COM-600\"}'
   curl.exe -X POST http://localhost:3000/inscripciones -H "Content-Type: application/json" -d '{\"estudiante\":\"Maria Lopez\",\"correo\":\"maria@usfx.bo\",\"curso\":\"COM-600\"}'
   ```
4. **Qué capturar:** La Terminal C del consumidor mostrando el procesamiento secuencial:
   `[correo] enviando a ... por INS-...` y `[correo] enviado a ...`.

---

### 📷 CAPTURA N.º 10: Consumidor apagado y acumulación de 5 mensajes en cola
1. En la Terminal C (consumidor), presiona **`Ctrl + C`** para detenerlo. (Mantén el productor encendido).
2. En la Terminal B (cliente), envía 5 inscripciones seguidas:
   ```powershell
   1..5 | ForEach-Object { curl.exe -s -X POST http://localhost:3000/inscripciones -H "Content-Type: application/json" -d "{\`"estudiante\`":\`"Alumno $_\`",\`"correo\`":\`"alumno$_@usfx.bo\`",\`"curso\`":\`"COM-600\`"}"; Write-Host "enviada $_" }
   ```
3. Ve a la consola web en **Queues**.
4. **Qué capturar:** La consola de RabbitMQ mostrando en `notificaciones.correo` exactamente **5 mensajes en Ready**, **0 consumidores**, y la curva del gráfico de cola subiendo.

---

### 📷 CAPTURA N.º 11: Encendido del consumidor y drenado de la cola a cero
1. En la Terminal C (consumidor), vuelve a iniciar el servicio:
   ```powershell
   node index.js
   ```
2. Observa cómo procesa de inmediato los 5 mensajes acumulados uno a uno.
3. Ve a la consola web de RabbitMQ y refresca la vista de la cola.
4. **Qué capturar:** La Terminal C mostrando los 5 envíos completados y la consola web mostrando la cola bajando a **0 Ready** en el gráfico.

---

## 🟢 Laboratorio 4 — Exchange directo frente a exchange temático

### 📷 CAPTURA N.º 12: Declaración del exchange `eventos.academicos` con sus 3 bindings
1. En una terminal en la raíz de `practica6-rabbitmq`, ejecuta el script de topología:
   ```powershell
   cd c:\Users\Usuario\Desktop\MICROSERVICIOSIV\Practicas\Practica6\practica6-rabbitmq
   node topologia.js
   ```
2. Ve a la consola web -> **Exchanges** -> clic en **`eventos.academicos`**.
3. Despliega la sección **Bindings**.
4. **Qué capturar:** La página del exchange `eventos.academicos` mostrando claramente sus tres bindings hacia las colas:
   - `correo.bienvenida` con patrón `inscripcion.*`
   - `finanzas.cobros` con patrón `pago.*`
   - `auditoria.todo` con patrón `#`

---

### 📷 CAPTURA N.º 13: Reparto de mensajes entre colas tras publicar 4 claves
1. En la misma página de `eventos.academicos`, ve a **Publish message** y publica 4 mensajes (con payload `{"n":1}`) cambiando únicamente la Routing key:
   - 1) `inscripcion.confirmada`
   - 2) `inscripcion.anulada`
   - 3) `pago.registrado`
   - 4) `certificado.emitido`
2. Ve a la pestaña **Queues and Streams**.
3. **Qué capturar:** La tabla de colas mostrando los contadores en la columna **Ready**:
   - `correo.bienvenida`: **2** mensajes
   - `finanzas.cobros`: **1** mensaje
   - `auditoria.todo`: **4** mensajes

---

## 🟢 Laboratorio 5 — Confirmaciones y durabilidad: qué se pierde y qué se salva

### 📷 CAPTURA N.º 14: Caída del consumidor y recuperación de Unacked a Ready
1. Inicia el consumidor en la Terminal C (`node index.js`).
2. Envía una inscripción desde la Terminal B:
   ```powershell
   curl.exe -s -X POST http://localhost:3000/inscripciones -H "Content-Type: application/json" -d '{\"estudiante\":\"Prueba Caida\",\"correo\":\"caida@usfx.bo\",\"curso\":\"COM-600\"}'
   ```
3. En la Terminal C, en cuanto veas que imprime `[correo] enviando a...` (antes de que pasen los 1.5s e imprima `enviado`), presiona **`Ctrl + C`**.
4. Ve inmediatamente a la consola web en **Queues** -> `notificaciones.correo`.
5. **Qué capturar:** La consola web mostrando que el mensaje no se perdió: estuvo momentáneamente en `Unacked` y volvió automáticamente a **`Ready: 1`**.

---

### 📷 CAPTURA N.º 15: Mensaje perdido con `noAck: true`
1. En la Terminal C, inicia el consumidor con la variable de entorno para simular modo `noAck`:
   ```powershell
   $env:NO_ACK="true"; node index.js
   ```
2. Envía otra inscripción desde la Terminal B.
3. En cuanto aparezca en consola, corta inmediatamente con **`Ctrl + C`**.
4. Ve a la consola web en **Queues** -> `notificaciones.correo`.
5. **Qué capturar:** La consola web mostrando la cola con **Ready: 0** y **Unacked: 0**: el mensaje se perdió definitivamente sin completarse el envío.
6. En tu terminal restaura la variable:
   ```powershell
   $env:NO_ACK="false"
   ```

---

### 📷 CAPTURA N.º 16: Reinicio del broker: cola durable intacta vs cola volátil eliminada
1. En la consola web, ve a **Queues** -> **Add a new queue**:
   - **Name:** `prueba.volatil`
   - **Durability:** `Transient`
   - Clic en **Add queue**.
2. Ve a **Exchanges** -> `inscripciones` -> **Bindings** y enlaza `prueba.volatil` con la routing key `inscripcion.confirmada`.
3. Detén cualquier consumidor abierto. Envía una inscripción desde curl para que haya mensajes en ambas colas.
4. En tu terminal, reinicia el contenedor de RabbitMQ:
   ```powershell
   docker compose restart rabbitmq
   docker compose logs rabbitmq | Select-String "Server startup complete"
   ```
5. Actualiza la lista de **Queues** en la consola web.
6. **Qué capturar:** La lista de colas mostrando que `prueba.volatil` ha desaparecido por completo tras el reinicio, mientras que `notificaciones.correo` (durable) sigue existiendo con sus mensajes intactos.

---

## 🟢 Laboratorio 6 — Reintentos limitados y cola de mensajes muertos (DLQ)

### 📷 CAPTURA N.º 17: Tres intentos fallidos con 5 segundos de espera
1. En la consola web, ve a **Queues** -> clic en `notificaciones.correo` -> baja al fondo y pulsa **Delete queue** (necesario para recrearla con DLX).
2. En la terminal raíz de `practica6-rabbitmq`, ejecuta el script de configuración DLQ:
   ```powershell
   node dlq.js
   ```
3. En la Terminal C, inicia el consumidor:
   ```powershell
   node index.js
   ```
4. En la Terminal B, publica una inscripción con correo inválido (sin arroba):
   ```powershell
   curl.exe -i -X POST http://localhost:3000/inscripciones -H "Content-Type: application/json" -d '{\"estudiante\":\"Ana Error\",\"correo\":\"ana.punto.usfx.bo\",\"curso\":\"COM-600\"}'
   ```
5. Observa la Terminal C durante 15-20 segundos.
6. **Qué capturar:** La Terminal C del consumidor mostrando los 3 intentos fallidos espaciados por 5 segundos:
   - `[correo] intento 1 fallido: correo invalido: ana.punto.usfx.bo`
   - `[correo] intento 2 fallido: correo invalido: ana.punto.usfx.bo`
   - `[correo] intento 3 fallido: correo invalido: ana.punto.usfx.bo`
   - `[correo] sin mas intentos: a la cola muerta`

---

### 📷 CAPTURA N.º 18: Mensaje envenenado en la cola `notificaciones.muertos`
1. Ve a la consola web en **Queues** -> haz clic en **`notificaciones.muertos`**.
2. Despliega la sección **Get messages**:
   - **Ack Mode:** `Nack message requeue true`
   - Clic en **Get Message(s)**.
3. **Qué capturar:** La consola web mostrando la cola `notificaciones.muertos` con `Ready: 1` y el contenido del mensaje desplegado con el correo `ana.punto.usfx.bo` y las cabeceras `x-death`.

---

## 🟢 Laboratorio 7 — Idempotencia: el mismo evento sin doble efecto

### 📷 CAPTURA N.º 19: Doble descuento de cupo por mensaje duplicado (sin idempotencia)
1. En la consola web, ve a **Exchanges** -> `inscripciones` -> **Publish message**.
2. Con routing key `inscripcion.confirmada`, publica dos veces seguidas el mismo evento:
   - **Headers:** agrega `message_id` con valor `INS-DUP-100` (o usa el payload con el mismo ID)
   - **Payload:** `{"id":"INS-DUP-100","estudiante":"Pedro Perez","correo":"pedro@usfx.bo","curso":"COM-600"}`
3. En una primera prueba sin validación de idempotencia (o si `procesados` estuviera vacío):
4. **Qué capturar:** La terminal del consumidor mostrando el evento procesado dos veces y el contador de cupos decrementándose dos veces (`quedan 29`, `quedan 28`).

---

### 📷 CAPTURA N.º 20: Evento repetido detectado e ignorado (idempotencia activa)
1. Con el consumidor de `notificaciones` corriendo (que tiene activa la validación de `procesados.has(id)` y persistencia):
2. Publica nuevamente por tercera vez el mismo mensaje con ID `INS-DUP-100`.
3. Observa la salida en la terminal del consumidor.
4. **Qué capturar:** La terminal del consumidor mostrando el reconocimiento del duplicado sin volver a descontar cupos:
   `[idempotencia] evento repetido INS-DUP-100 - se ignora`
