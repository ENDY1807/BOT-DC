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

// ================= READY =================
client.once("ready", () => {
  console.log(`🤖 Bot aktif sebagai ${client.user.tag}`);
});

// ================= MESSAGE EVENT =================
client.on("messageCreate", async (message) => {

  if (message.author.bot) return;
  if (!message.content.startsWith(PREFIX)) return;

  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  // ================= HELP =================
  if (command === "help") {

    const helpText = `
🤖 **AI Discord Bot Commands**

,ai <pertanyaan>
→ Tanya AI (Bahasa Indonesia)

,ai-en <question>
→ Tanya AI (English)

,voice
→ Bot join voice channel

,leave
→ Bot keluar voice

,ping
→ Cek apakah bot hidup
`;

    return message.reply(helpText);
  }

  // ================= PING =================
  if (command === "ping") {
    return message.reply(`🏓 Pong! ${client.ws.ping}ms`);
  }

  // ================= JOIN VOICE =================
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

    return message.reply(`🎧 Bot masuk ke voice: **${vc.name}**`);
  }

  // ================= LEAVE VOICE =================
  if (command === "leave") {

    const connection = getVoiceConnection(message.guild.id);

    if (!connection) {
      return message.reply("Bot tidak sedang di voice.");
    }

    connection.destroy();

    return message.reply("👋 Bot keluar dari voice.");
  }

  // ================= AI INDONESIA =================
  if (command === "ai") {

    const question = args.join(" ");

    if (!question) {
      return message.reply("Tulis pertanyaan setelah `,ai`");
    }

    message.reply("🔎 AI sedang mencari jawaban...");

    try {

      const url = `https://id.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(question)}`;

      const res = await axios.get(url);

      if (!res.data.extract) {
        return message.reply("AI tidak menemukan informasi.");
      }

      const answer =
`📚 **${res.data.title}**

${res.data.extract}`;

      return message.reply(answer);

    } catch (err) {

      console.log(err);

      return message.reply("AI tidak menemukan jawaban untuk pertanyaan itu.");

    }
  }

  // ================= AI ENGLISH =================
  if (command === "ai-en") {

    const question = args.join(" ");

    if (!question) {
      return message.reply("Write a question after `,ai-en`");
    }

    message.reply("🔎 AI searching...");

    try {

      const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(question)}`;

      const res = await axios.get(url);

      if (!res.data.extract) {
        return message.reply("No information found.");
      }

      const answer =
`📚 **${res.data.title}**

${res.data.extract}`;

      return message.reply(answer);

    } catch (err) {

      console.log(err);

      return message.reply("AI could not find the answer.");

    }
  }

});

// ================= LOGIN =================
client.login(process.env.TOKEN);
