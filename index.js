require("dotenv").config();

const { Client, GatewayIntentBits } = require("discord.js");
const { joinVoiceChannel, getVoiceConnection } = require("@discordjs/voice");
const axios = require("axios");
const cheerio = require("cheerio");
const googleIt = require("google-it");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates
  ]
});

const PREFIX = ",";

// ================= BOT READY =================
client.once("ready", () => {
  console.log(`Bot aktif sebagai ${client.user.tag}`);
});

// ================= MESSAGE =================
client.on("messageCreate", async (message) => {

  if (message.author.bot) return;
  if (!message.content.startsWith(PREFIX)) return;

  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  // ================= VOICE =================

  if (command === "voice") {

    const vc = message.member.voice.channel;

    if (!vc) {
      return message.reply("Masuk voice channel dulu.");
    }

    joinVoiceChannel({
      channelId: vc.id,
      guildId: vc.guild.id,
      adapterCreator: vc.guild.voiceAdapterCreator
    });

    return message.reply("🎧 Bot masuk voice.");
  }

  if (command === "leave") {

    const connection = getVoiceConnection(message.guild.id);

    if (!connection) {
      return message.reply("Bot tidak sedang di voice.");
    }

    connection.destroy();

    return message.reply("Bot keluar voice.");
  }

  // ================= AI =================

  if (command === "ai") {

    const question = args.join(" ");

    if (!question) {
      return message.reply("Tulis pertanyaan setelah ,ai");
    }

    message.reply("🔎 AI sedang mencari jawaban di internet...");

    try {

      const searchResults = await googleIt({ query: question });

      if (!searchResults.length) {
        return message.reply("Informasi tidak ditemukan.");
      }

      let collectedText = "";

      for (let i = 0; i < Math.min(3, searchResults.length); i++) {

        try {

          const url = searchResults[i].link;

          const res = await axios.get(url, {
            timeout: 8000,
            headers: {
              "User-Agent": "Mozilla/5.0"
            }
          });

          const $ = cheerio.load(res.data);

          const paragraphs = $("p")
            .map((i, el) => $(el).text())
            .get()
            .join(" ");

          collectedText += paragraphs.substring(0, 700) + "\n\n";

        } catch {}

      }

      if (!collectedText) {
        return message.reply("AI tidak bisa membaca website.");
      }

      const answer = collectedText.substring(0, 1200);

      message.reply(`📚 **Jawaban dari internet:**\n\n${answer}...`);

    } catch (err) {

      console.log(err);

      message.reply("AI mengalami error saat browsing.");

    }

  }

});

client.login(process.env.TOKEN);
