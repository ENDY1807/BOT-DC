require("dotenv").config();

const { Client, GatewayIntentBits } = require("discord.js");
const { joinVoiceChannel, getVoiceConnection } = require("@discordjs/voice");
const axios = require("axios");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates
  ]
});

const PREFIX = ",";

client.once("ready", () => {
  console.log(`Bot aktif sebagai ${client.user.tag}`);
});

client.on("messageCreate", async (message) => {

  if (message.author.bot) return;
  if (!message.content.startsWith(PREFIX)) return;

  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  // =========================
  // JOIN VOICE
  // =========================
  if (command === "voice") {

    const vc = message.member.voice.channel;

    if (!vc) {
      return message.reply("Masuk voice channel dulu.");
    }

    joinVoiceChannel({
      channelId: vc.id,
      guildId: vc.guild.id,
      adapterCreator: vc.guild.voiceAdapterCreator,
      selfMute: true,
      selfDeaf: false
    });

    message.reply(`Bot masuk ke voice: ${vc.name}`);
  }

  // =========================
  // LEAVE VOICE
  // =========================
  if (command === "leave") {

    const connection = getVoiceConnection(message.guild.id);

    if (!connection) {
      return message.reply("Bot tidak sedang di voice.");
    }

    connection.destroy();
    message.reply("Bot keluar dari voice.");
  }

  // =========================
  // AI COMMAND
  // =========================
  if (command === "ai") {

    const question = args.join(" ");

    if (!question) {
      return message.reply("Tulis pertanyaan setelah ,ai");
    }

    message.reply("🔎 Mencari jawaban...");

    try {

      const url = `https://id.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(question)}`;

      const res = await axios.get(url);

      if (!res.data.extract) {
        return message.reply("Informasi tidak ditemukan.");
      }

      const answer =
`📚 **${res.data.title}**

${res.data.extract}`;

      message.reply(answer);

    } catch (err) {

      console.log(err);
      message.reply("Informasi tidak ditemukan.");

    }
  }

});

client.login(process.env.TOKEN);
