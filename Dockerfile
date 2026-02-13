FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY src ./src
COPY index.html ./
COPY vite.config.js ./

RUN npm run build

FROM node:18-alpine

WORKDIR /app/server

COPY server/package*.json ./
RUN npm install --production

COPY server .

RUN mkdir -p data && echo '[]' > data/favorites.json

ENV PORT=3001
ENV NODE_ENV=production

EXPOSE 3001

CMD ["node", "index.js"]
