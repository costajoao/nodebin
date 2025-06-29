FROM oven/bun:1-alpine AS base
WORKDIR /app

# --- Install deps and build
FROM base AS build

# Copy only dependency files first (to cache bun install)
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

USER bun

COPY --chown=bun . .

EXPOSE 3000
ENTRYPOINT [ "bun", "run", "prod" ]