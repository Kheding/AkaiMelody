FROM node:20-bullseye

RUN apt-get update && apt-get install -y \
    ffmpeg \
    yt-dlp \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY . .

EXPOSE 8000

CMD ["node", "index.js"]
