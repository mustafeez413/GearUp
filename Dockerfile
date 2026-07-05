FROM node:20-alpine

WORKDIR /app

# Copy package files from backend directory to install dependencies
COPY backend/package*.json ./
RUN npm install --omit=dev

# Copy backend source files
COPY backend/ ./

RUN mkdir -p uploads config

# Persist user uploads across container restarts when Railway volume is mounted at /app/uploads
VOLUME ["/app/uploads"]

EXPOSE 5001

ENV NODE_ENV=production

CMD ["npm", "start"]