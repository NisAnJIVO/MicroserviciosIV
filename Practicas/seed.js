// seed.js — Restaura la base de datos tienda al punto de partida
// Uso dentro de mongosh: load("seed.js")

use("tienda");

db.productos.drop();
db.pedidos.drop();

db.productos.insertMany([
  {
    codigo: "ART-001",
    nombre: "Charango de madera de naranjo",
    precio: 850,
    stock: 12,
    stock_minimo: 3,
    activo: true,
    categoria: 3,
    categorias: [3, 8],
    etiquetas: ["musica", "artesania", "madera"],
    medidas: { alto: 60, ancho: 20, unidad: "cm" },
    inventario: [
      { almacen: "Sucre",   cantidad: 5 },
      { almacen: "La Paz",  cantidad: 7 }
    ],
    registrado: new Date("2024-03-12T00:00:00Z")
  },
  {
    codigo: "ART-002",
    nombre: "Aguayo tejido a mano",
    precio: 320,
    stock: 40,
    stock_minimo: 10,
    activo: true,
    categoria: 4,
    categorias: [4, 8],
    etiquetas: ["textil", "artesania", "tradicional"],
    descuento: 10,
    medidas: { alto: 120, ancho: 100, unidad: "cm" },
    inventario: [
      { almacen: "Sucre",  cantidad: 25 },
      { almacen: "Potosí", cantidad: 15 }
    ],
    registrado: new Date("2024-01-20T00:00:00Z")
  },
  {
    codigo: "ALM-003",
    nombre: "Quinua real orgánica 1 kg",
    precio: 45,
    stock: 200,
    stock_minimo: 50,
    activo: true,
    categoria: 1,
    categorias: [1],
    etiquetas: ["organico", "grano", "altiplano"],
    medidas: { alto: 25, ancho: 15, unidad: "cm" },
    inventario: [
      { almacen: "Sucre",       cantidad: 120 },
      { almacen: "Cochabamba",  cantidad: 80  }
    ],
    registrado: new Date("2025-02-05T00:00:00Z")
  },
  {
    codigo: "BEB-004",
    nombre: "Singani de Tarija 750 ml",
    precio: 95,
    stock: 60,
    stock_minimo: 15,
    activo: true,
    categoria: 2,
    categorias: [2],
    etiquetas: ["destilado", "tarija"],
    medidas: { alto: 30, ancho: 8, unidad: "cm" },
    inventario: [
      { almacen: "Sucre",  cantidad: 35 },
      { almacen: "Tarija", cantidad: 25 }
    ],
    registrado: new Date("2024-11-11T00:00:00Z")
  },
  {
    codigo: "ALM-005",
    nombre: "Chocolate de Sucre 100 g",
    precio: 28,
    stock: 150,
    stock_minimo: 40,
    activo: true,
    categoria: 1,
    categorias: [1],
    etiquetas: ["cacao", "sucre", "dulce"],
    descuento: 15,
    medidas: { alto: 12, ancho: 7, unidad: "cm" },
    inventario: [
      { almacen: "Sucre", cantidad: 150 }
    ],
    registrado: new Date("2025-04-18T00:00:00Z")
  },
  {
    codigo: "TEX-006",
    nombre: "Chompa de alpaca",
    precio: 480,
    stock: 18,
    stock_minimo: 5,
    activo: true,
    categoria: 4,
    categorias: [4, 8],
    etiquetas: ["textil", "alpaca", "abrigo"],
    medidas: { alto: 70, ancho: 55, unidad: "cm" },
    inventario: [
      { almacen: "La Paz", cantidad: 10 },
      { almacen: "Sucre",  cantidad: 8  }
    ],
    variantes: [
      { nombre: "Talla M", color: "gris"  },
      { nombre: "Talla L", color: "negro" }
    ],
    registrado: new Date("2024-06-30T00:00:00Z")
  },
  {
    // Irregularidad 2: stock_minimo como string
    codigo: "CER-007",
    nombre: "Vasija de cerámica Tiwanaku",
    precio: 260,
    stock: 7,
    stock_minimo: "5",
    activo: false,
    categoria: 5,
    categorias: [5, 8],
    etiquetas: ["ceramica", "replica"],
    medidas: { alto: 35, ancho: 28, unidad: "cm" },
    inventario: [
      { almacen: "La Paz", cantidad: 7 }
    ],
    registrado: new Date("2023-09-14T00:00:00Z")
  },
  {
    codigo: "JOY-008",
    nombre: "Aretes de plata 950",
    precio: 190,
    stock: 25,
    stock_minimo: 8,
    activo: true,
    categoria: 6,
    categorias: [6],
    etiquetas: ["plata", "potosi", "joyeria"],
    medidas: { alto: 4, ancho: 2, unidad: "cm" },
    inventario: [
      { almacen: "Potosí", cantidad: 25 }
    ],
    variantes: [
      { nombre: "Colgante", color: "plata" },
      { nombre: "Argolla",  color: "plata" }
    ],
    registrado: new Date("2025-01-08T00:00:00Z")
  },
  {
    // Irregularidad 2: stock_minimo como string
    codigo: "LIB-009",
    nombre: "Historia de Potosí (tapa dura)",
    precio: 120,
    stock: 26,
    stock_minimo: "10",
    activo: true,
    categoria: 7,
    categorias: [7],
    etiquetas: ["libro", "historia"],
    descuento: 20,
    medidas: { alto: 24, ancho: 17, unidad: "cm" },
    inventario: [
      { almacen: "Sucre",  cantidad: 20 },
      { almacen: "Potosí", cantidad: 6  }
    ],
    registrado: new Date("2024-08-22T00:00:00Z")
  },
  {
    codigo: "ART-010",
    nombre: "Máscara de diablada",
    precio: 1250,
    stock: 3,
    stock_minimo: 1,
    activo: true,
    categoria: 8,
    categorias: [8, 3],
    etiquetas: ["carnaval", "oruro", "artesania"],
    medidas: { alto: 55, ancho: 45, unidad: "cm" },
    inventario: [
      { almacen: "Oruro", cantidad: 3 }
    ],
    registrado: new Date("2025-03-01T00:00:00Z")
  },
  {
    codigo: "ALM-011",
    nombre: "Café de los Yungas 250 g",
    precio: 60,
    stock: 90,
    stock_minimo: 20,
    activo: true,
    categoria: 1,
    categorias: [1, 2],
    etiquetas: ["cafe", "yungas", "organico"],
    medidas: { alto: 18, ancho: 10, unidad: "cm" },
    inventario: [
      { almacen: "La Paz", cantidad: 50 },
      { almacen: "Sucre",  cantidad: 40 }
    ],
    registrado: new Date("2025-05-10T00:00:00Z")
  },
  {
    // Irregularidad 1: sin campo precio
    codigo: "TEX-012",
    nombre: "Poncho de vicuña",
    stock: 2,
    stock_minimo: 1,
    activo: false,
    categoria: 4,
    categorias: [4, 8],
    etiquetas: ["textil", "vicuna", "lujo"],
    medidas: { alto: 150, ancho: 140, unidad: "cm" },
    inventario: [
      { almacen: "La Paz", cantidad: 2 }
    ],
    registrado: new Date("2025-07-01T00:00:00Z")
  }
]);

db.pedidos.insertMany([
  {
    _id: 1,
    cliente: "Ana Vargas",
    ciudad: "Sucre",
    estado: "pendiente",
    items: [{ codigo: "ART-001", cantidad: 1, precio: 850 }],
    total: 850,
    fecha: new Date("2025-06-01T14:00:00Z")
  },
  {
    _id: 2,
    cliente: "Luis Mamani",
    ciudad: "La Paz",
    estado: "enviado",
    items: [
      { codigo: "ALM-003", cantidad: 4, precio: 45 },
      { codigo: "ALM-011", cantidad: 2, precio: 60 }
    ],
    total: 300,
    fecha: new Date("2025-06-03T09:30:00Z")
  },
  {
    _id: 3,
    cliente: "Rosa Quispe",
    ciudad: "Potosí",
    estado: "entregado",
    items: [{ codigo: "JOY-008", cantidad: 2, precio: 190 }],
    total: 380,
    fecha: new Date("2025-06-05T16:45:00Z")
  },
  {
    _id: 4,
    cliente: "Ana Vargas",
    ciudad: "Sucre",
    estado: "pendiente",
    items: [{ codigo: "ALM-005", cantidad: 10, precio: 28 }],
    total: 280,
    fecha: new Date("2025-06-09T11:15:00Z")
  },
  {
    _id: 5,
    cliente: "Carlos Nina",
    ciudad: "Cochabamba",
    estado: "cancelado",
    items: [{ codigo: "TEX-006", cantidad: 1, precio: 480 }],
    total: 480,
    fecha: new Date("2025-06-11T08:00:00Z")
  },
  {
    _id: 6,
    cliente: "Rosa Quispe",
    ciudad: "Potosí",
    estado: "enviado",
    items: [
      { codigo: "ART-002", cantidad: 3, precio: 320 },
      { codigo: "LIB-009", cantidad: 1, precio: 120 }
    ],
    total: 1080,
    fecha: new Date("2025-06-14T13:20:00Z")
  }
]);

print("productos: " + db.productos.countDocuments());
print("pedidos:   " + db.pedidos.countDocuments());
