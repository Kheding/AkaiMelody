const { Client, GatewayIntentBits } = require('discord.js');
const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  entersState,
  VoiceConnectionStatus,
  AudioPlayerStatus
} = require('@discordjs/voice');

const { spawn } = require('child_process');
const prism = require('prism-media');
const ffmpegPath = require('ffmpeg-static');
require('dotenv').config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates
  ]
});

const player = createAudioPlayer();
let connection = null;
let queue = [];
let playing = false;
let textChannel = null;
let leaveTimeout = null;

/* ================= READY ================= */
client.once('ready', () => {
  console.log(`✅ Bot conectado como ${client.user.tag}`);
});

/* ================= AUTO LEAVE ================= */
function scheduleLeave() {
  if (leaveTimeout) return;

  leaveTimeout = setTimeout(() => {
    if (queue.length === 0 && connection) {
      connection.destroy();
      connection = null;
      playing = false;
      leaveTimeout = null;

      if (textChannel) {
        textChannel.send('👋 No hay más canciones, saliendo del canal de voz');
      }
    }
  }, 30_000);
}

function cancelLeave() {
  if (leaveTimeout) {
    clearTimeout(leaveTimeout);
    leaveTimeout = null;
  }
}

/* ================= PLAY ENGINE ================= */
async function playNext() {
  if (queue.length === 0) {
    playing = false;
    scheduleLeave();
    return;
  }

  cancelLeave();

  const song = queue.shift();
  playing = true;

  try {
    const ytdlp = spawn('yt-dlp', [
      '-f', 'bestaudio',
      '-o', '-',
      song
    ]);

    const ffmpeg = new prism.FFmpeg({
      args: [
        '-i', 'pipe:0',
        '-f', 'opus',
        '-ar', '48000',
        '-ac', '2'
      ],
      executable: ffmpegPath
    });

    const stream = ytdlp.stdout.pipe(ffmpeg);
    const resource = createAudioResource(stream);

    player.play(resource);

    if (connection) {
      connection.subscribe(player);
    }

    if (textChannel) {
      textChannel.send(`🎶 Reproduciendo: **${song}**`);
    }

  } catch (err) {
    console.error('⚠️ Error reproduciendo audio:', err);
    if (textChannel) {
      textChannel.send('⚠️ No se pudo reproducir la canción, continuando con la cola...');
    }
    playing = false;
    playNext();
  }
}

/* ================= PLAYER EVENTS ================= */
player.on(AudioPlayerStatus.Idle, () => {
  playing = false;
  playNext();
});

player.on('error', (err) => {
  console.error('Error en player:', err);
});

/* ================= CLIENT ERROR HANDLERS ================= */
client.on('error', (err) => console.error('Error en client:', err));
client.on('shardError', (err) => console.error('Shard error:', err));

/* ================= COMMANDS ================= */
client.on('messageCreate', async message => {
  if (message.author.bot) return;
  if (!message.content.startsWith('!')) return;

  const args = message.content.slice(1).trim().split(/ +/);
  const command = args.shift()?.toLowerCase();

  /* ===== PLAY ===== */
  if (command === 'play') {
    if (!args.length)
      return message.reply('❌ Pon un link o texto');

    if (!message.member.voice.channel)
      return message.reply('❌ Debes estar en un canal de voz');

    textChannel = message.channel;
    cancelLeave();

    try {
      if (!connection) {
        connection = joinVoiceChannel({
          channelId: message.member.voice.channel.id,
          guildId: message.guild.id,
          adapterCreator: message.guild.voiceAdapterCreator,
          selfDeaf: true,
          preferredEncryptionMode: 'aead_aes256_gcm_rtpsize'
        });

        await entersState(connection, VoiceConnectionStatus.Ready, 20_000);
      }

      const query = args.join(' ');
      const song = query.startsWith('http') ? query : `ytsearch1:${query}`;

      queue.push(song);
      message.reply('✅ Agregado a la cola');

      if (!playing) playNext();

    } catch (err) {
      console.error('⚠️ Error conectando a voz:', err);
      message.reply('⚠️ No se pudo unir al canal de voz, pero el bot seguirá activo.');
    }
  }

  /* ===== SKIP ===== */
  if (command === 'skip') {
    if (!playing)
      return message.reply('❌ No hay música');

    player.stop();
    message.reply('⏭ Saltado');
  }

  /* ===== QUEUE ===== */
  if (command === 'queue') {
    if (queue.length === 0)
      return message.reply('📭 Cola vacía');

    message.reply(
      `📜 **Cola:**\n` +
      queue.map((q, i) => `${i + 1}. ${q}`).join('\n')
    );
  }

  /* ===== STOP ===== */
  if (command === 'stop') {
    queue = [];
    playing = false;
    cancelLeave();
    player.stop();

    if (connection) {
      connection.destroy();
      connection = null;
    }

    message.reply('⏹ Música detenida');
  }
});

/* ================= HTTP SERVER PARA HEALTH CHECK ================= */
const http = require('http');

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Bot activo ✅');
});

server.listen(8000, () => {
  console.log('HTTP server escuchando en puerto 8000');
});

/* ================= LOGIN BOT ================= */
client.login(process.env.TOKEN);
