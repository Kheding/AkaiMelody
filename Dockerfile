FROM node:20-bookworm

# Instalar dependencias del sistema
RUN apt-get update && apt-get install -y \
  ffmpeg \
  python3 \
  python3-pip \
  libsodium-dev \
  && rm -rf /var/lib/apt/lists/*

# Instalar yt-dlp
RUN pip3 install -U yt-dlp

# Directorio de trabajo
WORKDIR /app

# Copiar dependencias
COPY package*.json ./
RUN npm install --omit=dev

# Copiar el resto
COPY . .

# Variables
ENV NODE_ENV=production

# Comando de arranque
CMD ["node", "index.js"]