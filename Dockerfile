# Stage 1: Build
FROM oven/bun:1.2.7-slim AS builder

ENV DEBIAN_FRONTEND=noninteractive

RUN apt update && apt upgrade -y
RUN apt install -y --no-install-recommends git ca-certificates tzdata
RUN rm -rf /var/lib/apt/lists/*

WORKDIR /app
RUN git clone https://github.com/costajoao/nodebin.git .

RUN bun install

# Stage 2: Final image
FROM builder AS final

# Create non-root user (skip if already exists)
RUN id -u bun 2>/dev/null || adduser --system --home /home/bun --shell /bin/bash bun

WORKDIR /app
COPY --from=builder --chown=bun:bun /app /app

USER bun

# Fixed port exposure (optional)
EXPOSE 3000

CMD ["bun", "src/index.ts"]