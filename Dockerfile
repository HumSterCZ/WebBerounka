FROM node:18-alpine

WORKDIR /usr/src/app

# Kopírujeme pouze package.json a package-lock.json
COPY package*.json ./

# Instalujeme závislosti
RUN apk add --no-cache curl && \
    npm install

# Kopírujeme zdrojové soubory
COPY . .

EXPOSE 8080

CMD ["node", "app.js"]