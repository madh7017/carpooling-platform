# Build stage for frontend
FROM node:16-alpine AS client-build

WORKDIR /app/client

COPY client/package*.json ./

RUN npm install

COPY client/ ./

RUN npm run build

# Backend stage
FROM node:16-alpine AS production

WORKDIR /app

# Install server dependencies
COPY server/package*.json ./

RUN npm install --production

# Copy server files
COPY server/src ./src
COPY server/server.js ./server.js
COPY server/.env.example ./.env.example

# Copy built client files
COPY --from=client-build /app/client/dist ./public

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:5000/api/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start server
CMD ["npm", "start"]
