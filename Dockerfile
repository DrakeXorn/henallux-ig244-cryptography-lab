FROM node:20-alpine AS builder
LABEL maintainer="Christophe Bernard <me@christophebernard.be>"

WORKDIR /app
COPY package.json package-lock.json* yarn.lock* ./

RUN npm install --frozen-lockfile

COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine AS runner
LABEL maintainer="Christophe Bernard <me@christophebernard.be>"

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app .
RUN npm install --frozen-lockfile --omit=dev
RUN npx prisma db push

EXPOSE 3000
CMD ["npm", "start"]
