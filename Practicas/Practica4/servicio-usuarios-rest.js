const http = require('http');

const usuarios = [
  { id: 1, nombre: 'Ana García', email: 'ana@example.com' },
  { id: 2, nombre: 'Carlos Mendoza', email: 'carlos@example.com' },
  { id: 3, nombre: 'Lucía Fernández', email: 'lucia@example.com' }
];

const server = http.createServer((req, res) => {
  res.setHeader('Content-Type', 'application/json');
  const url = req.url;

  if (url === '/usuarios' || url === '/usuarios/') {
    res.writeHead(200);
    return res.end(JSON.stringify(usuarios));
  }

  const match = url.match(/^\/usuarios\/(\d+)$/);
  if (match) {
    const id = parseInt(match[1], 10);
    const u = usuarios.find(item => item.id === id);
    if (u) {
      res.writeHead(200);
      return res.end(JSON.stringify(u));
    } else {
      res.writeHead(404);
      return res.end(JSON.stringify({ error: 'Usuario no encontrado' }));
    }
  }

  res.writeHead(404);
  res.end(JSON.stringify({ error: 'Ruta no encontrada' }));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Servicio REST Usuarios (Práctica 3) corriendo en http://localhost:${PORT}`);
});
