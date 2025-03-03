# Použijeme oficiální Node.js image jako základ
FROM node:14

# Nastavíme pracovní adresář v kontejneru
WORKDIR /usr/src/app

# Kopírujeme pouze package.json a package-lock.json
COPY package*.json ./

# Čistá instalace závislostí
RUN rm -rf node_modules && npm install

# Zkopírujeme zbytek aplikace do pracovního adresáře
COPY . .

# Exponujeme port, na kterém bude aplikace běžet
EXPOSE 8080

# Definujeme příkaz pro spuštění aplikace
CMD ["node", "app.js"]