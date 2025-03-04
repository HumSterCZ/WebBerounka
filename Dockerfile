# Použijeme oficiální Node.js image jako základ
FROM node:14

# Nastavíme pracovní adresář v kontejneru
WORKDIR /usr/src/app

# Kopírujeme package.json a package-lock.json
COPY package*.json ./

# Instalace závislostí
RUN npm install

# Zkopírujeme zbytek aplikace
COPY . .

# Exponujeme port
EXPOSE 8080

# Spustíme aplikaci
CMD ["npm", "start"]