FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY proto ./proto
COPY src ./src
ENV GRPC_ADDR=0.0.0.0:50051
EXPOSE 50051
CMD ["node", "src/servidor.js"]
