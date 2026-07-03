# --- STAGE 1: Build React Client ---
FROM node:18-alpine AS client-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

# --- STAGE 2: Build Node Server ---
FROM node:18-alpine
WORKDIR /app/server
COPY server/package*.json ./
RUN npm install --only=production
COPY server/ ./

# Copy compiled static client files to server for hosting
COPY --from=client-builder /app/client/dist ./public

# Expose port and start
EXPOSE 5000
ENV NODE_ENV=production
CMD ["node", "index.js"]
