require("dotenv").config();

const { Client, GatewayIntentBits } = require("discord.js");
const { joinVoiceChannel, getVoiceConnection } = require("@discordjs/voice");
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

client.once("ready", () => {
  console.log(`Bot aktif sebagai ${client.user.tag}`);
});

client.on("messageCreate", async (message) => {

  if (message.author.bot) return;
  if (!message.content.startsWith(PREFIX)) return;

  const args = message.content.slice(PREFIX.length).trim().split(" ");
  const command = args.shift().toLowerCase();

  // =========================
  // VOICE JOIN
  // =========================
  if (command === "voice") {

    const vc = message.member.voice.channel;

    if (!vc) {
      return message.reply("Masuk voice channel dulu bro.");
    }

    joinVoiceChannel({
      channelId: vc.id,
      guildId: vc.guild.id,
      adapterCreator: vc.guild.voiceAdapterCreator,
      selfMute: true,
      selfDeaf: false
    });

    message.reply(`Bot masuk ke voice **${vc.name}** (AFK mode)`);
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
  // AI SEARCH
  // =========================
  if (command === "ai") {

    const question = args.join(" ");

    if (!question) {
      return message.reply("Tulis pertanyaan setelah command.");
    }

    message.reply("🔎 Sedang mencari jawaban...");

    try {

      const results = await googleIt({
        query: question,
        limit: 3
      });

      if (!results.length) {
        return message.reply("Tidak menemukan informasi.");
      }

      let reply = `📚 Hasil pencarian untuk: **${question}**\n\n`;

      results.forEach((r, i) => {
        reply += `${i + 1}. **${r.title}**\n${r.link}\n\n`;
      });

      message.reply(reply);

    } catch (err) {

      console.log(err);
      message.reply("AI Error saat mencari jawaban.");

    }
  }

});

client.login(process.env.TOKEN);
