# 🎶 AkaiMelody

AkaiMelody es un **bot de música para Discord** desarrollado en **Node.js**, capaz de reproducir audio desde **YouTube** (URLs, búsqueda por texto y playlists), con sistema de **cola**, **skip**, y **salida automática** del canal de voz cuando no hay canciones.

Funciona correctamente en entornos **Docker** como **Koyeb**.

---

## ✨ Características

- ▶️ Reproducir música desde YouTube
- 🔍 Buscar canciones por texto
- 📜 Cola de canciones
- ⏭ Saltar canciones
- 🛑 Detener reproducción
- ⏸ Pausar / ▶ Reanudar
- 👋 Salida automática del canal cuando no hay canciones
- 🚀 Preparado para correr 24/7 en Koyeb

---

## 📌 Comandos

| Comando | Descripción |
|------|------------|
| `!play <url o texto>` | Reproduce una canción o la agrega a la cola |
| `!queue` | Muestra la cola actual |
| `!skip` | Salta la canción actual |
| `!pause` | Pausa la reproducción |
| `!resume` | Reanuda la reproducción |
| `!stop` | Detiene todo y limpia la cola |

---

## 🧰 Tecnologías usadas

- **Node.js 20**
- **discord.js v14**
- **@discordjs/voice**
- **yt-dlp**
- **ffmpeg**
- **Docker**
- **Koyeb**

---

## 🐳 Deploy en Koyeb (recomendado)

### Requisitos
- Cuenta en GitHub
- Cuenta en Koyeb
- Bot de Discord creado
- Token del bot

---

### Pasos resumidos

1. Subir el proyecto a GitHub
2. Asegurarse de tener:
   - `Dockerfile`
   - `.dockerignore`
3. En Koyeb:
   - **Create Service**
   - Source: GitHub
   - Build: Dockerfile
   - Instance: Nano
4. Agregar variable de entorno:
