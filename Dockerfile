FROM node:20-alpine

WORKDIR /app

COPY backend/package.json backend/package-lock.json ./
RUN npm ci --omit=dev

COPY backend/ ./

RUN mkdir -p uploads config

# Persist user uploads across container restarts when Railway volume is mounted at /app/uploads
VOLUME ["/app/uploads"]

ENV NODE_ENV=production

CMD ["npm", "start"]
