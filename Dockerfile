FROM oven/bun:1.2.17

# Set non-interactive mode for apt
ENV DEBIAN_FRONTEND=noninteractive

# Install git and tzdata (without prompts)
RUN apt-get update && \
  apt-get install -y --no-install-recommends git tzdata && \
  rm -rf /var/lib/apt/lists/*

# Clone the repo
RUN git clone https://github.com/costajoao/nodebin.git /app

# Set working directory
WORKDIR /app

# Install dependencies using Bun
RUN bun install

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV TZ=America/Sao_Paulo

# Expose port
EXPOSE ${PORT}

# Start app
CMD ["bun", "src/index.ts"]