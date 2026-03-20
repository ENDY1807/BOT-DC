require("dotenv").config();

const { Client, GatewayIntentBits } = require("discord.js");
const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource
} = require("@discordjs/voice");

const play = require("play-dl");
const axios = require("axios");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates
  ]
});

let connection;
let player = createAudioPlayer();

client.once("ready", () => {
  console.log(`✅ Bot aktif: ${client.user.tag}`);
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  const args = message.content.split(" ");
  const cmd = args[0];

  // ================= VOICE =================
  if (cmd === ",voice") {
    if (!message.member.voice.channel)
      return message.reply("❌ Masuk VC dulu");

    connection = joinVoiceChannel({
      channelId: message.member.voice.channel.id,
      guildId: message.guild.id,
      adapterCreator: message.guild.voiceAdapterCreator
    });

    connection.subscribe(player);
    message.reply("✅ Masuk VC");
  }

  // ================= LEAVE =================
  if (cmd === ",leave") {
    if (connection) {
      connection.destroy();
      connection = null;
      message.reply("👋 Keluar VC");
    }
  }

  // ================= PLAY =================
  if (cmd === ",play") {
    const query = args.slice(1).join(" ");
    if (!query) return message.reply("❌ Masukin lagu");

    if (!connection)
      return message.reply("❌ Pake ,voice dulu");

    try {
      let url = query;

      if (!query.includes("youtube.com")) {
        const search = await play.search(query, { limit: 1 });
        if (!search.length)
          return message.reply("❌ Ga ketemu");

        url = search[0].url;
      }

      const stream = await play.stream(url);
      const resource = createAudioResource(stream.stream, {
        inputType: stream.type
      });

      player.play(resource);

      message.reply(`▶️ ${url}`);
    } catch (err) {
      console.log(err);
      message.reply("❌ Error play");
    }
  }

  // ================= AI =================
  if (cmd === ",ai") {
    const q = args.slice(1).join(" ");
    if (!q) return message.reply("❌ Tanya apa?");

    try {
      message.reply("🔍 Nyari...");

      const res = await axios.get(
        `https://api.duckduckgo.com/?q=${encodeURIComponent(q)}&format=json`
      );

      if (res.data.Abstract) {
        return message.reply(`🧠 ${res.data.Abstract}`);
      }

      if (res.data.RelatedTopics.length > 0) {
        return message.reply(`🧠 ${res.data.RelatedTopics[0].Text}`);
      }

      message.reply("❌ Ga nemu jawaban");
    } catch (err) {
      console.log(err);
      message.reply("❌ AI error");
    }
  }
});

client.login(process.env.TOKEN);
