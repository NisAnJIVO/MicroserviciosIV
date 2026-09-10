CREATE DATABASE IF NOT EXISTS practica4_ventas;
USE practica4_ventas;

CREATE TABLE IF NOT EXISTS ventas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cliente_id INT NOT NULL,
  fecha DATE NOT NULL,
  total DECIMAL(10,2) DEFAULT 0
);

CREATE TABLE IF NOT EXISTS detalle_venta (
  id INT AUTO_INCREMENT PRIMARY KEY,
  venta_id INT NOT NULL,
  producto VARCHAR(100) NOT NULL,
  cantidad INT NOT NULL,
  precio_unitario DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (venta_id) REFERENCES ventas(id) ON DELETE CASCADE
);

-- Limpiar tablas si ya existían para evitar duplicados
DELETE FROM detalle_venta;
DELETE FROM ventas;

-- Insertar datos de prueba
INSERT INTO ventas (id, cliente_id, fecha, total) VALUES
  (1, 1, '2026-08-03', 450.00),
  (2, 2, '2026-08-04', 120.50),
  (3, 1, '2026-08-05', 280.00);

INSERT INTO detalle_venta (venta_id, producto, cantidad, precio_unitario) VALUES
  (1, 'Laptop', 1, 350.00),
  (1, 'Mouse', 2, 50.00),
  (2, 'Teclado', 1, 120.50),
  (3, 'Monitor', 1, 280.00);
