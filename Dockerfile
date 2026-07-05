FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files from backend directory to install dependencies
COPY backend/package*.json ./

# Install only production dependencies
RUN npm ci --omit=dev

# Copy backend source files
COPY backend/ ./

# Create directories and set ownership to the non-root node user for security
RUN mkdir -p uploads config && chown -R node:node /app

# Expose port (Railway will override this with its own PORT environment variable)
EXPOSE 5001

# Set production environment
ENV NODE_ENV=production

# Run the app as a non-root user for security
USER node

# Start the application
CMD ["npm", "start"]