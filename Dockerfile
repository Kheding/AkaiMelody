FROM node:18.20.8-bullseye

# ================= DEPENDENCIAS DEL SISTEMA =================
RUN apt-get update && apt-get install -y \
    ffmpeg \
    python3 \
    make \
    g++ \
    curl \
    && rm -rf /var/lib/apt/lists/*

# ================= INSTALAR YT-DLP =================
RUN curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp \
    -o /usr/local/bin/yt-dlp \
    && chmod a+rx /usr/local/bin/yt-dlp

# ================= DIRECTORIO DE LA APP =================
WORKDIR /app

# ================= COPIAR PACKAGE.JSON E INSTALAR DEPENDENCIAS =================
COPY package*.json ./

# Instalar dependencias normales
RUN npm install --omit=dev

# Forzar instalar la última versión de @discordjs/voice compatible con Node 18
RUN npm install @discordjs/voice@latest

# ================= COPIAR CÓDIGO =================
COPY . .

# ================= PUERTO PARA HEALTH CHECK =================
EXPOSE 8000

# ================= COMANDO DE ARRANQUE =================
CMD ["node", "index.js"]
