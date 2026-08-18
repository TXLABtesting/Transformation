# ---- deps ----
FROM node:22-bookworm-slim AS deps
WORKDIR /app
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json* ./
RUN npm ci || npm install

# ---- builder ----
FROM node:22-bookworm-slim AS builder
WORKDIR /app
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

ARG NEXT_PUBLIC_DATA_MODE=api
ARG NEXT_PUBLIC_UAEPASS_MODE=live
ARG NEXT_PUBLIC_DEFAULT_ROLE=entity
ARG NEXT_PUBLIC_BASE_PATH=
ARG NEXT_PUBLIC_AUTH_PROVIDER=workspaceone
ARG NEXT_PUBLIC_DEMO_MODE=0
ARG NEXT_PUBLIC_DEMO_DATA=0

ENV NEXT_PUBLIC_DATA_MODE=${NEXT_PUBLIC_DATA_MODE}
ENV NEXT_PUBLIC_AUTH_PROVIDER=${NEXT_PUBLIC_AUTH_PROVIDER}
ENV NEXT_PUBLIC_BASE_PATH=${NEXT_PUBLIC_BASE_PATH}
ENV NEXT_PUBLIC_DEFAULT_ROLE=${NEXT_PUBLIC_DEFAULT_ROLE}
ENV NEXT_PUBLIC_UAEPASS_MODE=${NEXT_PUBLIC_UAEPASS_MODE}
ENV NEXT_PUBLIC_DEMO_MODE=${NEXT_PUBLIC_DEMO_MODE}
ENV NEXT_PUBLIC_DEMO_DATA=${NEXT_PUBLIC_DEMO_DATA}

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

# ---- runner ----
FROM node:22-bookworm-slim AS runner
WORKDIR /app
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
ENV NODE_ENV=production
ENV NEXT_PUBLIC_DATA_MODE=api
ENV NEXT_PUBLIC_AUTH_PROVIDER=workspaceone
ENV NEXT_PUBLIC_BASE_PATH=
ENV NEXT_PUBLIC_DEFAULT_ROLE=entity
ENV NPM_CONFIG_CACHE=/tmp/.npm
ENV HOME=/tmp
ENV PRISMA_HIDE_UPDATE_MESSAGE=true
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma
# Keep seed dependencies available for manual kubectl seed execution.
# prisma/seed.ts imports ../lib/seed, ../lib/domain, ../lib/entities and data JSON.
COPY --from=builder /app/lib ./lib
COPY --from=builder /app/tsconfig.json ./tsconfig.json
EXPOSE 3000
CMD ["npm", "run", "start"]
