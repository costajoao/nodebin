# Use official Bun image as base
FROM oven/bun:1.2.17-slim

# Set working directory
WORKDIR /app

# Copy package.json and bun.lockb
# Ensure both files exist in the build context, or copy only the existing ones
COPY package.json bun.lock ./

# Install dependencies
RUN bun install

ENV PORT=3000

# Copy project files
COPY . .

# Expose port (change if your app uses a different port)
EXPOSE ${PORT:-3000}

# Default command (update as needed)
CMD ["bun", "src/index"]