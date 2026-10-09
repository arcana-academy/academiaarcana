FROM --platform=linux/amd64 node:24-bookworm-slim

WORKDIR /app

RUN npm install --global npm@11.19.1 --ignore-scripts

COPY package.json package-lock.json ./
COPY scripts/verify-dependency-lifecycle-scripts.cjs ./scripts/verify-dependency-lifecycle-scripts.cjs

RUN node scripts/verify-dependency-lifecycle-scripts.cjs \
  && npm ci --ignore-scripts \
  && npm rebuild esbuild unrs-resolver --ignore-scripts=false

COPY . .

ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
ARG ACADEMIA_ARCANA_REVISION

ENV NODE_ENV=production \
  PORT=10000 \
  HOSTNAME=0.0.0.0 \
  NEXT_PUBLIC_APP_ENV=production \
  NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL} \
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=${NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY} \
  NEXT_PUBLIC_HONEYBADGER_REVISION=${ACADEMIA_ARCANA_REVISION} \
  ACADEMIA_ARCANA_REVISION=${ACADEMIA_ARCANA_REVISION}

RUN npm run build \
  && mkdir -p .next/cache \
  && chown -R node:node /app/.next

USER node

EXPOSE 10000

CMD ["npm", "start"]
