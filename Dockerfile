FROM node:hydrogen-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 8080
USER node

CMD ["node", "src/main-server.js"]