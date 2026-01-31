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
client.once('clientReady', () => {
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
  }, 30_000); // ⏱ 30 segundos
}

function cancelLeave() {
  if (leaveTimeout) {
    clearTimeout(leaveTimeout);
    leaveTimeout = null;
  }
}

/* ================= PLAY ENGINE ================= */
function playNext() {
  if (queue.length === 0) {
    playing = false;
    scheduleLeave(); // 🔥 activar salida automática
    return;
  }

  cancelLeave();

  const song = queue.shift();
  playing = true;

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
  connection.subscribe(player);

  if (textChannel) {
    textChannel.send(`🎶 Reproduciendo: **${song}**`);
  }
}

/* ================= PLAYER EVENTS ================= */
player.on(AudioPlayerStatus.Idle, () => {
  playing = false;
  playNext();
});

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

    if (!connection) {
      connection = joinVoiceChannel({
        channelId: message.member.voice.channel.id,
        guildId: message.guild.id,
        adapterCreator: message.guild.voiceAdapterCreator,
        selfDeaf: true
      });

      await entersState(connection, VoiceConnectionStatus.Ready, 20_000);
    }

    const query = args.join(' ');
    const song =
      query.startsWith('http')
        ? query
        : `ytsearch1:${query}`;

    queue.push(song);
    message.reply('✅ Agregado a la cola');

    if (!playing) playNext();
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

client.login(process.env.TOKEN);