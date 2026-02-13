FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY src ./src
COPY index.html ./
COPY vite.config.js ./

RUN npm run build

FROM node:18-alpine

WORKDIR /app

COPY server/package*.json ./server/
RUN cd server && npm install --production

COPY server ./server

RUN mkdir -p /app/server/data && echo '[]' > /app/server/data/favorites.json

COPY --from=builder /app/dist ./dist

ENV PORT=3001
ENV NODE_ENV=production

EXPOSE 3001

WORKDIR /app/server

CMD ["node", "index.js"]
