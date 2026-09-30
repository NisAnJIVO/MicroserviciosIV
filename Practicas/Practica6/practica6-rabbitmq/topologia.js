const amqp = require("amqplib");

const URL = "amqp://admin:admin123@localhost:5672";
const EX = "eventos.academicos";

// cola  ->  patron de clave de enrutamiento
const enlaces = [
  ["correo.bienvenida", "inscripcion.*"],
  ["finanzas.cobros",   "pago.*"],
  ["auditoria.todo",    "#"],
];

async function main() {
  const conexion = await amqp.connect(URL);
  const canal = await conexion.createChannel();
  await canal.assertExchange(EX, "topic", { durable: true });
  for (const [cola, patron] of enlaces) {
    await canal.assertQueue(cola, { durable: true });
    await canal.bindQueue(cola, EX, patron);
    console.log("enlazada", cola, "con el patron", patron);
  }
  await conexion.close();
}

main().catch((err) => {
  console.error("Error en topologia.js:", err.message);
  process.exit(1);
});
