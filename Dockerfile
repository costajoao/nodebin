# Stage 1: Build dependencies and app
FROM oven/bun:1.2.17 AS builder

ENV DEBIAN_FRONTEND=noninteractive

WORKDIR /app

# Install git and clone only latest commit
RUN apt update && \
  apt install -y --no-install-recommends git ca-certificates && \
  git clone --depth=1 https://github.com/costajoao/nodebin.git . && \
  rm -rf /var/lib/apt/lists/*

RUN bun install --production

# Stage 2: Minimal runtime image
FROM oven/bun:1.2.17

# Create non-root user
RUN adduser --system --home /home/bun --shell /bin/bash bun

WORKDIR /app

# Copy only built app and dependencies
COPY --from=builder --chown=bun:bun /app /app

USER bun

EXPOSE 3000

CMD ["bun", "src/index.ts"]