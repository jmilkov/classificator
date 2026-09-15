# --- СТАДИЯ 1: Базовый образ ---
FROM node:20-alpine AS base
RUN apk add --no-cache bash make g++
WORKDIR /app

# --- СТАДИЯ 2: Установка ВСЕХ зависимостей (Next.js + воркеры) ---
FROM base AS deps
COPY package.json package-lock.json* ./
# ИСПРАВЛЕНО: Указан точный и корректный URL репозитория
RUN npm install --registry=https://registry.npmjs.org

# --- СТАДИЯ 3: Сборка Next.js ---
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# --- СТАДИЯ 4: Финальный продакшн образ ---
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Системные зависимости для шрифтов и работы нативных модулей (sharp)
RUN apk add --no-cache fontconfig ttf-dejavu nano


RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# ИСПРАВЛЕНО: Для PM2 также указан верный реестр
RUN npm install -g pm2 --registry=https://registry.npmjs.org

# 1. Копируем изолированный standalone сервер Next.js
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# 2. Копируем исходный package.json в корень
COPY --chown=nextjs:nodejs package.json ./package.json

# 3. Копируем готовую папку node_modules со всеми зависимостями (включая mqtt, sharp)
COPY --from=deps --chown=nextjs:nodejs /app/node_modules ./node_modules


RUN mkdir -p .next && chown -R nextjs:nodejs .next

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Стартовая команда
CMD ["node", "server.js"]
