# Single-stage image: install, seed the SQLite db, build, and run `next start`.
# Kept simple on purpose so `docker compose up` "just works" after a clone.
FROM node:24-bookworm-slim

WORKDIR /app

# No build/runtime telemetry on the server.
ENV NEXT_TELEMETRY_DISABLED=1

# Build toolchain so better-sqlite3 can compile from source if no prebuilt
# binary matches this platform/Node ABI (prebuilt usually covers linux x64).
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# Install dependencies first (better layer caching). The seed script + its data
# generator are copied before `npm ci` so the `postinstall` seed step can run.
COPY package.json package-lock.json ./
COPY scripts ./scripts
COPY lib ./lib
RUN npm ci

# App source + production build (prerenders /full from the seeded SQLite db).
COPY . .
RUN npm run build

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

# Seed if the db is missing (e.g. a fresh volume), then start.
CMD ["sh", "-c", "node scripts/seed.mjs && npm run start"]
