FROM node:22.17.1-bullseye-slim

WORKDIR /app

COPY package*.json ./
RUN npm ci --production

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["node", "dist/main.js"]
