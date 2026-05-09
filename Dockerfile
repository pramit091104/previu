# ---- Dependencies stage ----
FROM node:20-alpine AS deps

WORKDIR /app

COPY package.json package-lock.json ./
# Install ALL deps (tsx is a devDep needed at runtime for TS execution)
RUN npm ci

# ---- Production stage ----
FROM node:20-alpine AS runner

WORKDIR /app

# Copy node_modules (includes tsx and all runtime deps)
COPY --from=deps /app/node_modules ./node_modules

# Copy only the server source — no frontend src needed
COPY package.json ./
COPY tsconfig.json ./
COPY server-prod.ts ./
COPY server ./server

# ffmpeg-static ships its own binary — no system ffmpeg install needed
# better-sqlite3 native addon is already compiled in node_modules

EXPOSE 3000

ENV NODE_ENV=production

CMD ["node_modules/.bin/tsx", "server-prod.ts"]
