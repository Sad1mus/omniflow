#syntax=docker/dockerfile:1

# ---- Stage 1: Build ----
FROM node:22-alpine AS builder

WORKDIR /app

# Copiar package.json primero (mejor caching de capa)
COPY package*.json ./

# Instalar dependencias de desarrollo + producción
RUN npm ci

# Copiar código fuente
COPY . .

# Compilar TypeScript
RUN npm run build

# ---- Stage 2: Production ----
FROM node:22-alpine AS production

WORKDIR /app

# Instalar solo dependencias de producción
COPY --from=builder /app/package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copiar código compilado y assets
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/tsconfig.build.json ./tsconfig.build.json

# Variables de entorno obligatorias
ENV NODE_ENV=production
ENV PORT=3000

# Usuario no root para seguridad
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

EXPOSE 3000

# Salud del contenedor
HEALTHCHECK --interval=30s --timeout=10s --retries=3 --start-period=40s \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Entrypoint principal
CMD ["npm", "run", "start"]
