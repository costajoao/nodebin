# Stage 1: Build dependencies and app
FROM oven/bun:1.2.7-slim AS builder

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && \
  apt-get upgrade -y && \
  apt-get install -y --no-install-recommends \
  git ca-certificates tzdata && \
  rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy only package files first for better cache usage
COPY package.json bun.lockb* ./
RUN bun install --frozen-lockfile

# Copy the rest of the source code
COPY . .

# Stage 2: Minimal runtime image
FROM oven/bun:1.2.7-slim AS runtime

# Create non-root user
RUN id -u bun 2>/dev/null || adduser --system --home /home/bun --shell /bin/bash bun

USER bun
WORKDIR /app

# Copy only built app and dependencies from builder
COPY --from=builder --chown=bun:bun /app /app

EXPOSE 3000

CMD ["bun", "src/index.ts"]