# Use the official Bun image
FROM oven/bun:1.2.17

# Set non-interactive mode for apt-get
ENV DEBIAN_FRONTEND=noninteractive

# Install required packages: git, CA certificates, and timezone data
RUN apt-get update && \
  apt-get install -y --no-install-recommends \
  git \
  ca-certificates \
  tzdata && \
  rm -rf /var/lib/apt/lists/*

# Clone your repository into /app
RUN git clone https://github.com/costajoao/nodebin.git /app

# Set working directory
WORKDIR /app

# Install dependencies using Bun
RUN bun install

# Set the PORT environment variable (default to 3000)
ENV PORT=${PORT:-3000}

# Expose the application port
EXPOSE ${PORT}

# Start the application
CMD ["bun", "src/index.ts"]