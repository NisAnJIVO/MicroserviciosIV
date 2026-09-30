const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const path = require("path");

const CARPETA = process.env.PROTO_DIR || path.join(__dirname, "..", "proto");
const definicion = protoLoader.loadSync(path.join(CARPETA, "estudiantes.proto"), {
  keepCase: true
});
const paquete = grpc.loadPackageDefinition(definicion).estudiantes;

module.exports = { grpc, paquete, definicion };
