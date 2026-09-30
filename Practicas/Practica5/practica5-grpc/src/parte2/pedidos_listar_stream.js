const { grpc, paquete } = require("./carga_pedidos");

const DIR = process.env.GRPC_ADDR || "localhost:50052";
const cliente = new paquete.PedidoService(DIR, grpc.credentials.createInsecure());

console.log("=================================================");
console.log(" CONSUMO DE STREAM gRPC DE PEDIDOS (SERVER STREAMING)");
console.log("=================================================");

const tInicio = process.hrtime.bigint();
let primerTiempo = null;
let ultimoTiempo = null;
let contador = 0;

const flujo = cliente.ListarPedidosStream({ cliente_id: "" });

flujo.on("data", (pedido) => {
  contador++;
  const ahora = Number(process.hrtime.bigint() - tInicio) / 1e6;
  if (primerTiempo === null) {
    primerTiempo = ahora;
    console.log(`[STREAM] -> PRIMER ELEMENTO recibido a los ${primerTiempo.toFixed(2)} ms: [ID: ${pedido.id}, Cliente: ${pedido.cliente_id}, Total: $${pedido.total}]`);
  }
  ultimoTiempo = ahora;

  if (contador % 100 === 0) {
    console.log(`[STREAM] ... procesados ${contador} pedidos (${ahora.toFixed(2)} ms)`);
  }
});

flujo.on("end", () => {
  console.log("=================================================");
  console.log(` FIN DEL FLUJO: Total recibidos = ${contador} pedidos`);
  console.log(` Tiempo hasta el PRIMER elemento : ${primerTiempo.toFixed(2)} ms (TTFB)`);
  console.log(` Tiempo hasta el ÚLTIMO elemento : ${ultimoTiempo.toFixed(2)} ms`);
  console.log(` Delta de procesamiento concurrente: ${(ultimoTiempo - primerTiempo).toFixed(2)} ms`);
  console.log("=================================================");
});

flujo.on("error", (err) => {
  console.error("Error en flujo gRPC:", err.code, err.details);
});
