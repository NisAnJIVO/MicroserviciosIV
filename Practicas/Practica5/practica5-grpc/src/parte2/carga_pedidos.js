const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const path = require("path");

const CARPETA = process.env.PROTO_DIR || path.join(__dirname, "..", "..", "proto");
const definicion = protoLoader.loadSync(path.join(CARPETA, "pedidos.proto"), {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});

const paquete = grpc.loadPackageDefinition(definicion).pedidos;

module.exports = { grpc, paquete, definicion };
