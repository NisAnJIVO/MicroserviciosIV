require("dotenv").config();
const amqp = require("amqplib");
const fs = require("fs");
const path = require("path");

const COLA = process.env.COLA || "notificaciones.correo";
const LIMITE = 3;
const cupos = { "COM-600": 30 };
const procesados = new Set();

// Archivo de persistencia de eventos procesados para idempotencia
const ARCHIVO_PROCESADOS = path.join(__dirname, "procesados.json");
if (fs.existsSync(ARCHIVO_PROCESADOS)) {
  try {
    const ids = JSON.parse(fs.readFileSync(ARCHIVO_PROCESADOS, "utf-8"));
    ids.forEach((id) => procesados.add(id));
  } catch (e) {}
}

function registrarProcesado(id) {
  if (!id) return;
  procesados.add(id);
  try {
    fs.writeFileSync(ARCHIVO_PROCESADOS, JSON.stringify([...procesados]), "utf-8");
  } catch (e) {}
}

function descontarCupo(evento) {
  const curso = evento.curso || "COM-600";
  cupos[curso] = (cupos[curso] ?? 30) - 1;
  console.log(`[cupos] ${curso} quedan ${cupos[curso]}`);
}

async function procesar(evento) {
  // Validación de formato de correo (Laboratorio 6)
  if (!evento.correo || !evento.correo.includes("@")) {
    throw new Error("correo invalido: " + evento.correo);
  }

  // Descuento de cupo (Laboratorio 7)
  descontarCupo(evento);

  // Simulación de envío con latencia de 1.5s (Laboratorio 3)
  console.log("[correo] enviando a", evento.correo, "por", evento.id);
  await new Promise((r) => setTimeout(r, 1500));
  console.log("[correo] enviado a", evento.correo);
}

async function main() {
  const conexion = await amqp.connect(process.env.RABBITMQ_URL);
  const canal = await conexion.createChannel();

  // Asegura la cola si no fue creada con argumentos especiales previamente
  try {
    await canal.assertQueue(COLA, { durable: true });
  } catch (e) {
    // Si ya existe con argumentos DLQ, se reutiliza
  }

  canal.prefetch(1); // un mensaje sin confirmar a la vez
  console.log("[correo] esperando mensajes en", COLA);

  const usarNoAck = process.env.NO_ACK === "true";

  canal.consume(
    COLA,
    async (mensaje) => {
      if (mensaje === null) return;

      // Laboratorio 5: simulación con noAck: true
      if (usarNoAck) {
        console.log("[correo] procesando sin ack manual...");
        const evento = JSON.parse(mensaje.content.toString());
        await procesar(evento);
        return;
      }

      // Laboratorio 6: control de reintentos mediante encabezado x-death
      const muertes = mensaje.properties.headers ? mensaje.properties.headers["x-death"] : null;
      const intentos = muertes ? muertes[0].count : 0;

      if (intentos >= LIMITE) {
        console.error("[correo] sin mas intentos: a la cola muerta");
        canal.sendToQueue("notificaciones.muertos", mensaje.content, {
          persistent: true,
        });
        return canal.ack(mensaje);
      }

      // Laboratorio 7: idempotencia verificando identificador unico de evento
      const id = mensaje.properties.messageId || JSON.parse(mensaje.content.toString()).id;
      if (id && procesados.has(id)) {
        console.log("[idempotencia] evento repetido", id, "- se ignora");
        return canal.ack(mensaje);
      }

      try {
        const evento = JSON.parse(mensaje.content.toString());
        await procesar(evento);
        registrarProcesado(id);
        canal.ack(mensaje); // confirmación manual
      } catch (e) {
        console.error("[correo] intento", intentos + 1, "fallido:", e.message);
        canal.nack(mensaje, false, false); // false: no reencolar en la misma cola, transferir a DLX
      }
    },
    { noAck: usarNoAck }
  );
}

main().catch((e) => {
  console.error("Error en consumidor:", e.message);
  process.exit(1);
});
