# 📸 GUÍA PASO A PASO PARA SACAR LAS 19 CAPTURAS DE PANTALLA
### COM-600 Microservicios · Práctica 5: Comunicación de Alto Rendimiento con gRPC

> **Nota importante:** En todas las capturas de la terminal debe verse tu nombre de usuario o nombre de equipo de Windows para validar la autoría. Abre tu terminal de **PowerShell** en `c:\Users\Usuario\Desktop\MICROSERVICIOSIV\Practicas\Practica5\practica5-grpc`.

---

## 🧭 Laboratorio 0 — Entorno y proyecto base

### 📷 CAPTURA N.º 1: Verificación de versiones y servicio REST (200 OK)
1. En una terminal nueva, levanta primero el servicio REST auxiliar:
   ```powershell
   cd c:\Users\Usuario\Desktop\MICROSERVICIOSIV\Practicas\Practica5\practica3-rest
   node src/index.js
   ```
2. Abre **otra terminal** en `practica5-grpc` y ejecuta juntos los 4 comandos:
   ```powershell
   cd c:\Users\Usuario\Desktop\MICROSERVICIOSIV\Practicas\Practica5\practica5-grpc
   node --version; npm --version; docker --version; curl -s -o /dev/null -w "%{http_code}`n" http://localhost:3000/usuarios
   ```
3. **Qué capturar:** La salida en consola mostrando las versiones de Node, npm, Docker y el código `200`.

---

### 📷 CAPTURA N.º 2: Instalación de paquetes y estructura de carpetas
1. Ejecuta:
   ```powershell
   npm install
   Get-ChildItem -Recurse -Depth 2 -Exclude node_modules
   ```
2. **Qué capturar:** La salida de `npm install` (mostrando `@grpc/grpc-js` y `@grpc/proto-loader`) y las carpetas `proto`, `proto-v1`, `src`, `informe`.

---

## 🧭 Laboratorio 1 — El archivo .proto como contrato

### 📷 CAPTURA N.º 3: Inspección de tipos y rutas gRPC
1. Ejecuta:
   ```powershell
   node src/inspeccionar.js
   ```
2. **Qué capturar:** La lista de tipos declarados (`estudiantes.Estudiante`, etc.) y las rutas de los métodos `/estudiantes.EstudianteService/AgregarEstudiante`, etc.

---

### 📷 CAPTURA N.º 4: Comparación de bytes y volcado hexadecimal (Protobuf vs JSON)
1. Ejecuta:
   ```powershell
   node src/bytes.js
   ```
2. **Qué capturar:** La comparación de tamaños (Protobuf: 32 bytes vs JSON: 74 bytes) y el volcado hexadecimal que inicia con `0a07...`.

---

## 🧭 Laboratorio 2 — El servidor y la primera llamada unaria

### 📷 CAPTURA N.º 5: Servidor gRPC escuchando en puerto 50051
1. En la **Terminal 1**, inicia el servidor:
   ```powershell
   node src/servidor.js
   ```
2. **Qué capturar:** El mensaje: `Servicio gRPC escuchando en el puerto 50051`. *(Deja esta Terminal 1 abierta).*

---

### 📷 CAPTURA N.º 6: Llamadas unarias con grpcurl
1. En la **Terminal 2**, ejecuta:
   ```powershell
   .\grpcurl.exe -plaintext -proto proto/estudiantes.proto -d "{\"ci\":\"9876543\",\"nombres\":\"Ana\",\"apellidos\":\"Torres\",\"carrera\":\"Sistemas\"}" localhost:50051 estudiantes.EstudianteService/AgregarEstudiante
   
   .\grpcurl.exe -plaintext -proto proto/estudiantes.proto -d "{\"ci\":\"9876543\"}" localhost:50051 estudiantes.EstudianteService/ObtenerEstudiante
   ```
2. **Qué capturar:** Las dos llamadas con sus respuestas JSON formateadas conteniendo al estudiante Ana Torres.

---

## 🧭 Laboratorio 3 — El cliente y los códigos de estado de gRPC

### 📷 CAPTURA N.º 7: Salida de cliente.js
1. En la **Terminal 2**, ejecuta:
   ```powershell
   node src/cliente.js
   ```
2. **Qué capturar:** La salida con el estudiante `Agregado:` y luego `Obtenido:`.

---

### 📷 CAPTURA N.º 8: Búsqueda exitosa vs NOT_FOUND (Código 5)
1. En la **Terminal 2**, ejecuta ambos comandos:
   ```powershell
   node src/buscar.js 0000000; node src/buscar.js 9876543
   ```
2. **Qué capturar:** La primera ejecución devolviendo `código : 5 = NOT_FOUND` y la segunda devolviendo el estudiante `Encontrado:`.

---

### 📷 CAPTURA N.º 9: Errores UNIMPLEMENTED (12) y DEADLINE_EXCEEDED (4)
1. En la **Terminal 2**, ejecuta:
   ```powershell
   .\grpcurl.exe -plaintext -proto proto/estudiantes.proto -d "{\"ci\":\"9876543\"}" localhost:50051 estudiantes.EstudianteService/BorrarEstudiante

   .\grpcurl.exe -plaintext -max-time 0.001 -proto proto/estudiantes.proto -d "{\"ci\":\"9876543\"}" localhost:50051 estudiantes.EstudianteService/ObtenerEstudiante
   ```
2. **Qué capturar:** Los dos mensajes de error mostrando los códigos `Code: Unimplemented` (12) y `Code: DeadlineExceeded` (4).

---

## 🧭 Laboratorio 4 — Streaming: cuando una sola respuesta no alcanza

### 📷 CAPTURA N.º 10: Salida de flujo con un estudiante
1. En la **Terminal 2**, ejecuta:
   ```powershell
   node src/listar.js
   ```
2. **Qué capturar:** La salida mostrando el tiempo en ms, los datos del estudiante y el mensaje `fin del flujo`.

---

### 📷 CAPTURA N.º 11: Sembrado de 500 estudiantes y medición del flujo
1. En la **Terminal 2**, ejecuta:
   ```powershell
   node src/sembrar.js
   node src/listar.js Sistemas
   ```
2. **Qué capturar:** El mensaje `Sembrados 500 estudiantes` y la salida de `listar.js Sistemas` donde se evidencian los milisegundos del primer estudiante y del último recibido.

---

## 🧭 Laboratorio 5 — Evolución del contrato

### 📷 CAPTURA N.º 12: Compatibilidad hacia adelante (Cliente nuevo vs Cliente viejo)
1. En la **Terminal 2**, ejecuta:
   ```powershell
   node src/buscar.js 9876543
   $env:PROTO_DIR="./proto-v1"; node src/buscar.js 9876543; Remove-Item Env:\PROTO_DIR
   ```
2. **Qué capturar:** Ambas salidas consecutivas demostrando que el cliente nuevo muestra el correo y el cliente viejo responde perfectamente sin fallar.

---

### 📷 CAPTURA N.º 13: Ruptura silenciosa por reuso de números (Tags intercambiados)
1. En la **Terminal 2**, ejecuta:
   ```powershell
   $env:PROTO_DIR="./proto-mal"; node src/buscar.js 9876543; Remove-Item Env:\PROTO_DIR
   ```
2. **Qué capturar:** La salida del cliente mostrando la dirección de correo electrónico dentro del campo `carrera` sin ningún error en consola.

---

### 📷 CAPTURA N.º 14: Error de número reservado y arranque corregido
1. En la **Terminal 2**, ejecuta el intento con error y luego la carga corregida:
   ```powershell
   $env:PROTO_DIR="./proto-error-reserved"; node src/inspeccionar.js; Remove-Item Env:\PROTO_DIR
   $env:PROTO_DIR="./proto-definitivo"; node src/inspeccionar.js; Remove-Item Env:\PROTO_DIR
   ```
2. **Qué capturar:** El error de carga de proto-loader al detectar el uso de un tag reservado y la inspección exitosa con el contrato definitivo.

---

## 🧭 Laboratorio 6 — Mediciones y Docker

### 📷 CAPTURA N.º 15: Mediciones del servicio REST con curl
1. En la **Terminal 2** (con el servicio REST corriendo en el puerto 3000), ejecuta:
   ```powershell
   1..10 | ForEach-Object { curl.exe -s -o /dev/null -w "%{size_download} bytes %{time_total} s`n" http://localhost:3000/usuarios/1 }
   ```
2. **Qué capturar:** Las 10 líneas de salida con el tamaño en bytes y tiempo de respuesta en segundos.

---

### 📷 CAPTURA N.º 16: Benchmark gRPC con medir.js
1. En la **Terminal 2**, ejecuta:
   ```powershell
   node src/medir.js
   ```
2. **Qué capturar:** La salida con el promedio de las 10 llamadas en ms y los tamaños comparados de Protobuf vs JSON.

---

### 📷 CAPTURA N.º 17: Tabla de comparación de estilos
1. En la **Terminal 2**, visualiza la tabla comparativa:
   ```powershell
   Get-Content informe/comparacion.md
   ```
2. **Qué capturar:** La tabla completa con las columnas `REST (P3)`, `GraphQL (P4)` y `gRPC (P5)` y la fila `Público al que sirve mejor`.

---

### 📷 CAPTURA N.º 18: Docker Compose y consumo de gRPC por REST
1. Detén cualquier servidor local en terminales previas (Ctrl+C).
2. Levanta los contenedores con Docker Compose:
   ```powershell
   docker compose up --build -d
   docker compose ps
   curl.exe -i http://localhost:3000/usuarios/1/expediente
   ```
3. **Qué capturar:** La salida de `docker compose ps` mostrando ambos contenedores (`estudiantes` y `usuarios`) en estado *Up*, y la respuesta HTTP `200 OK` de curl trayendo los datos de expediente devueltos internamente por gRPC.

---

### 📷 CAPTURA N.º 19: Estructura del repositorio en GitHub
1. Inicializa y sube tu repositorio a GitHub (o abre tu navegador en la página de GitHub del repo):
   ```powershell
   git init
   git add .
   git commit -m "Práctica 5: servicio gRPC interno consumido por el REST"
   ```
2. **Qué capturar:** Captura de pantalla de la página web de tu repositorio en GitHub mostrando la carpeta `practica5-grpc` con `proto/`, `proto-v1/`, `src/`, `Dockerfile` y `README.md`.
