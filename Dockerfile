# Use official Bun image as base
FROM oven/bun:1.1.13-slim

# Set working directory
WORKDIR /app

# Copy package.json and bun.lockb
COPY package.json bun.lockb ./

# Install dependencies
RUN bun install --production

ENV PORT=3000

# Copy project files
COPY . .

# Expose port (change if your app uses a different port)
EXPOSE ${PORT:-3000}

# Default command (update as needed)
CMD ["bun", "src/index"]