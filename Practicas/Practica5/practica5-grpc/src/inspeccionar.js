const { paquete, definicion } = require("./carga");

console.log("Tipos y servicios declarados en el contrato:");
console.log(Object.keys(definicion));

console.log("\nMétodos de EstudianteService y su ruta:");
for (const [nombre, m] of Object.entries(paquete.EstudianteService.service)) {
  console.log(" ", nombre, "->", m.path);
}
