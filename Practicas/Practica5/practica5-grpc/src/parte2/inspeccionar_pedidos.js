const { paquete, definicion } = require("./carga_pedidos");

console.log("=================================================");
console.log(" TIPOS Y MENSAJES DECLARADOS EN pedidos.proto");
console.log("=================================================");
console.log(Object.keys(definicion));

console.log("\n=================================================");
console.log(" MÉTODOS DEL SERVICIO PedidoService Y SUS RUTAS");
console.log("=================================================");
for (const [nombre, m] of Object.entries(paquete.PedidoService.service)) {
  console.log(`  RPC [${nombre}] -> Ruta: ${m.path}`);
}
