require("dotenv").config();

const { Client, GatewayIntentBits } = require("discord.js");
const {
  joinVoiceChannel,
  getVoiceConnection,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus
} = require("@discordjs/voice");

const googleIt = require("google-it");
const axios = require("axios");
const play = require("play-dl");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates
  ]
});

const PREFIX = ",";
const players = new Map();

// ================= READY =================
client.once("ready", () => {
  console.log(`🤖 Bot aktif: ${client.user.tag}`);
});

// ================= MESSAGE =================
client.on("messageCreate", async (message) => {

  if (message.author.bot) return;
  if (!message.content.startsWith(PREFIX)) return;

  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  // ================= HELP =================
  if (command === "help") {
    return message.reply(`
🔥 **ALL IN ONE BOT**

,ai <pertanyaan>
,voice
,leave
,nobar
,play <url>
,stop
,ping
`);
  }

  // ================= PING =================
  if (command === "ping") {
    return message.reply(`🏓 ${client.ws.ping}ms`);
  }

  // ================= VOICE =================
  if (command === "voice") {
    const vc = message.member.voice.channel;
    if (!vc) return message.reply("Masuk voice dulu.");

    joinVoiceChannel({
      channelId: vc.id,
      guildId: vc.guild.id,
      adapterCreator: vc.guild.voiceAdapterCreator
    });

    return message.reply("🎧 Bot masuk voice.");
  }

  if (command === "leave") {
    const conn = getVoiceConnection(message.guild.id);
    if (!conn) return message.reply("Bot tidak di voice.");

    conn.destroy();
    return message.reply("👋 Bot keluar.");
  }

  // ================= NOBAR =================
  if (command === "nobar") {

    const vc = message.member.voice.channel;
    if (!vc) return message.reply("Masuk voice dulu.");

    const invite = await vc.createInvite({
      targetApplication: "880218394199220334",
      targetType: 2,
      maxAge: 86400
    });

    return message.reply(`🎬 Nobar bareng:\nhttps://discord.gg/${invite.code}`);
  }

  // ================= AI =================
  if (command === "ai") {

    const question = args.join(" ");
    if (!question) return message.reply("Tulis pertanyaan.");

    message.reply("🔎 AI mencari...");

    try {
      const results = await googleIt({ query: question });

      if (!results.length) {
        return message.reply("Tidak ditemukan.");
      }

      let text = "";

      for (let i = 0; i < 3; i++) {
        try {
          const res = await axios.get(results[i].link, { timeout: 5000 });
          const clean = res.data.replace(/<[^>]*>/g, "");
          text += clean.slice(0, 400);
        } catch {}
      }

      return message.reply(`📚 ${text.slice(0, 1000)}...`);

    } catch (err) {
      console.log(err);
      return message.reply("AI error.");
    }
  }

  // ================= PLAY MUSIC =================
  if (command === "play") {

    const url = args[0];
    if (!url) return message.reply("Masukkan link YouTube.");

    const vc = message.member.voice.channel;
    if (!vc) return message.reply("Masuk voice dulu.");

    const conn = joinVoiceChannel({
      channelId: vc.id,
      guildId: vc.guild.id,
      adapterCreator: vc.guild.voiceAdapterCreator
    });

    const stream = await play.stream(url);
    const resource = createAudioResource(stream.stream, {
      inputType: stream.type
    });

    const player = createAudioPlayer();

    player.play(resource);
    conn.subscribe(player);

    players.set(message.guild.id, player);

    player.on(AudioPlayerStatus.Idle, () => {
      conn.destroy();
    });

    return message.reply("🎵 Memutar musik...");
  }

  // ================= STOP MUSIC =================
  if (command === "stop") {

    const player = players.get(message.guild.id);
    if (!player) return message.reply("Tidak ada musik.");

    player.stop();

    return message.reply("⏹ Musik dihentikan.");
  }

});

// ================= LOGIN =================
client.login(process.env.DISCORD_TOKEN);
