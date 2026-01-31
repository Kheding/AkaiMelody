FROM node:20-slim

# Instalar dependencias del sistema
RUN apt-get update && apt-get install -y \
  ffmpeg \
  python3 \
  python3-pip \
  ca-certificates \
  curl \
  && rm -rf /var/lib/apt/lists/*

# Instalar yt-dlp globalmente
RUN pip3 install --no-cache-dir yt-dlp

# Crear directorio de la app
WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar dependencias Node
RUN npm install --production

# Copiar el resto del código
COPY . .

# Puerto dummy para healthcheck
EXPOSE 8000

# Comando de arranque
CMD ["npm", "start"]
