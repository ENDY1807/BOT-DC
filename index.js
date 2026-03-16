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

  // ================= VOICE JOIN =================
  if (command === "voice") {

    const vc = message.member.voice.channel;
    if (!vc) return message.reply("Masuk voice channel dulu.");

    joinVoiceChannel({
      channelId: vc.id,
      guildId: vc.guild.id,
      adapterCreator: vc.guild.voiceAdapterCreator,
      selfMute: true,
      selfDeaf: false
    });

    return message.reply("Bot masuk voice.");
  }

  // ================= VOICE LEAVE =================
  if (command === "leave") {

    const connection = getVoiceConnection(message.guild.id);

    if (!connection) return message.reply("Bot tidak di voice.");

    connection.destroy();

    return message.reply("Bot keluar voice.");
  }

  // ================= AI =================
  if (command === "ai") {

    const question = args.join(" ");

    if (!question) return message.reply("Tulis pertanyaan setelah ,ai");

    message.reply("🔎 AI mencari informasi...");

    try {

      // cari topik di wikipedia
      const search = await axios.get(
        `https://id.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(question)}&format=json`
      );

      if (!search.data.query.search.length) {
        return message.reply("AI tidak menemukan informasi.");
      }

      const title = search.data.query.search[0].title;

      // ambil ringkasan
      const summary = await axios.get(
        `https://id.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`
      );

      const text = summary.data.extract;

      return message.reply(`📚 **${title}**\n\n${text}`);

    } catch (err) {

      console.log(err);

      return message.reply("AI gagal mengambil informasi.");

    }

  }

});

client.login(process.env.DISCORD_TOKEN);
