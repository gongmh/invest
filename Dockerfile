FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY src ./src
COPY public ./public
COPY index.html ./
COPY vite.config.js ./

RUN npm run build

FROM node:18-alpine

WORKDIR /app

COPY server ./server
WORKDIR /app/server

RUN npm install

RUN mkdir -p /app/server/data && \
    echo '[]' > /app/server/data/favorites.json

ENV PORT=3001
ENV NODE_ENV=production

EXPOSE 3001

CMD ["node", "index.js"]
