const { definicion } = require("./carga");
const metodo = definicion["estudiantes.EstudianteService"].AgregarEstudiante;
const estudiante = { ci: "9876543", nombres: "Ana", apellidos: "Torres",
 carrera: "Sistemas" };
const binario = metodo.requestSerialize(estudiante);
const json = Buffer.from(JSON.stringify(estudiante));
console.log("protobuf:", binario.length, "bytes");
console.log(binario.toString("hex"));
console.log("JSON :", json.length, "bytes");
console.log(json.toString());
