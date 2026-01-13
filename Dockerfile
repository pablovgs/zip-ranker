FROM node:20-alpine

RUN apk add --no-cache sqlite

WORKDIR /app

COPY package*.json ./

RUN npm install --production

COPY bot.js .
COPY deploy-commands.js .

VOLUME /app/data

ENV TZ=Europe/Paris

CMD ["node", "bot.js"]
