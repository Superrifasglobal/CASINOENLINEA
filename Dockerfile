# Base image
FROM node:20-alpine AS build

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source and build
COPY . .
RUN npm run build

# Production image
FROM node:20-alpine

WORKDIR /app

# Copy production dependencies
COPY package*.json ./
RUN npm install --production
RUN npm install better-sqlite3

# Copy build artifacts and server
COPY --from=build /app/dist ./dist
COPY --from=build /app/server.js ./
COPY --from=build /app/migrations ./migrations

# Env variables
ENV PORT=3000
ENV NODE_ENV=production

EXPOSE 3000

CMD ["node", "server.js"]
