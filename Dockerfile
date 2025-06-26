# syntax=docker/dockerfile:1
FROM node:22-alpine AS base


# Install dependencies
FROM base AS deps
WORKDIR /app

COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* .npmrc* ./
RUN \
  if [ -f yarn.lock ]; then \
    corepack enable yarn && yarn --frozen-lockfile; \
  elif [ -f package-lock.json ]; then \
    npm ci --ignore-scripts; \
  elif [ -f pnpm-lock.yaml ]; then \
    corepack enable pnpm && pnpm i --frozen-lockfile; \
  else \
    echo "Lockfile not found." && exit 1; \
  fi


# Build application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Temporary build-time placeholders that will be overridden at runtime
ENV API_URL=http://placeholder:8080
ENV COOKIE_SECRET=build-placeholder-secret
ENV ANSATTPORTEN_AUTH_DETAILS=build-placeholder-secret
ENV ANSATTPORTEN_CLIENT_ID=build-placeholder-secret
ENV ANSATTPORTEN_CLIENT_SECRET=build-placeholder-secret
ENV ANSATTPORTEN_URL=build-placeholder-secret

RUN \
  if [ -f yarn.lock ]; then \
    corepack enable yarn && yarn run build; \
  elif [ -f package-lock.json ]; then \
    npm run build; \
  elif [ -f pnpm-lock.yaml ]; then \
    corepack enable pnpm && pnpm run build; \
  else \
    echo "Lockfile not found." && exit 1; \
  fi


# Production image
FROM base AS runner
WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV PORT=8080
ENV HOSTNAME="0.0.0.0"

RUN apk add --no-cache curl
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app .

USER nextjs
EXPOSE 8080
CMD ["npm", "run", "start"]
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080/api/health || exit 1
