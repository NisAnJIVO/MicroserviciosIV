const amqp = require("amqplib");
let canal;

async function conectar() {
  const conexion = await amqp.connect(process.env.RABBITMQ_URL);
  canal = await conexion.createChannel();
  const ex = process.env.EXCHANGE;
  const tipo = process.env.EXCHANGE_TYPE || (ex === "eventos.academicos" ? "topic" : "direct");
  await canal.assertExchange(ex, tipo, { durable: true });
  console.log(`[inscripciones] conectado al broker (exchange: ${ex}, tipo: ${tipo})`);
  process.on("SIGINT", async () => {
    await canal.close();
    await conexion.close();
    process.exit(0);
  });
}

function publicar(clave, evento) {
  const cuerpo = Buffer.from(JSON.stringify(evento));
  // persistent: true pide que el mensaje se escriba en disco
  // messageId asigna el identificador unico del hecho para idempotencia
  return canal.publish(process.env.EXCHANGE, clave, cuerpo, {
    persistent: true,
    contentType: "application/json",
    messageId: evento.id,
  });
}

module.exports = { conectar, publicar };
