# Práctica 4: GraphQL y el patrón Backend for Frontend (BFF)

Este repositorio contiene la implementación de una capa GraphQL y Backend for Frontend (BFF) que compone datos de una base de datos relacional MySQL y de un servicio REST de usuarios.

## Estructura del Proyecto

```text
practica4-graphql/
├── db/
│   └── practica4.sql        # Script de creación y poblado de la base MySQL
├── src/
│   ├── cargadores.js        # Implementación de DataLoader para resolver N+1
│   ├── db.js                # Conexión MySQL con contador y logger de consultas
│   ├── esquema.js           # Esquema GraphQL (types, inputs, queries, mutations)
│   ├── resolvers.js         # Resolvers de lectura, mutaciones y composición BFF
│   └── servidor.js          # Configuración de Apollo Server, formatError y depthLimit
├── package.json
└── README.md
```

## Instrucciones para levantar los servicios

### 1. Base de Datos MySQL
1. Iniciar el servidor MySQL (XAMPP o servicio local en puerto 3306).
2. Ejecutar el script SQL para crear la base de datos `practica4_ventas` y cargar los datos de prueba:
   ```bash
   mysql -u root < db/practica4.sql
   ```

### 2. Servicio REST de Usuarios (Práctica 3)
El servicio REST debe estar corriendo en el puerto 3000:
```bash
# Desde la raíz de la práctica
node servicio-usuarios-rest.js
```
Endpoints expuestos:
- `GET http://localhost:3000/usuarios`
- `GET http://localhost:3000/usuarios/:id`

### 3. Capa GraphQL (BFF)
1. Instalar dependencias dentro de la carpeta `practica4-graphql`:
   ```bash
   cd practica4-graphql
   npm install
   ```
2. Iniciar el servidor Apollo:
   ```bash
   node src/servidor.js
   ```
3. El explorador Apollo Sandbox estará disponible en:
   [http://localhost:4000/](http://localhost:4000/)
