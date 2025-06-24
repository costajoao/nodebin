# Use official Node.js image as base
FROM node:23-slim

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy project files
COPY . .

# Expose port (change if your app uses a different port)
EXPOSE 8000

# Default command (update as needed)
CMD ["node", "main.js"]