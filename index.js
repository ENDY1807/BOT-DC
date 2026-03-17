require("dotenv").config();

const { Client, GatewayIntentBits } = require("discord.js");
const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource
} = require("@discordjs/voice");

const play = require("play-dl");
const googleIt = require("google-it");
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
  console.log(`✅ Bot nyala: ${client.user.tag}`);
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  const args = message.content.split(" ");
  const cmd = args[0];

  // ================= VOICE =================
  if (cmd === ",voice") {
    if (!message.member.voice.channel) {
      return message.reply("❌ Masuk VC dulu bro");
    }

    connection = joinVoiceChannel({
      channelId: message.member.voice.channel.id,
      guildId: message.guild.id,
      adapterCreator: message.guild.voiceAdapterCreator
    });

    connection.subscribe(player);

    message.reply("✅ Bot masuk voice (AFK)");
  }

  // ================= LEAVE =================
  if (cmd === ",leave") {
    if (connection) {
      connection.destroy();
      connection = null;
      message.reply("👋 Keluar dari voice");
    } else {
      message.reply("❌ Bot ga di VC");
    }
  }

  // ================= PLAY =================
  if (cmd === ",play") {
    const query = args.slice(1).join(" ");
    if (!query) return message.reply("❌ Masukin judul / link");

    if (!connection) {
      return message.reply("❌ Pake ,voice dulu");
    }

    try {
      let url = query;

      if (!query.includes("youtube.com")) {
        const search = await play.search(query, { limit: 1 });
        if (!search.length) {
          return message.reply("❌ Lagu ga ketemu");
        }
        url = search[0].url;
      }

      const stream = await play.stream(url);
      const resource = createAudioResource(stream.stream, {
        inputType: stream.type
      });

      player.play(resource);

      message.reply(`▶️ Play: ${url}`);
    } catch (err) {
      console.log(err);
      message.reply("❌ Error play");
    }
  }

  // ================= AI =================
  if (cmd === ",ai") {
    const question = args.slice(1).join(" ");
    if (!question) return message.reply("❌ Tulis pertanyaan");

    try {
      message.reply("🔍 Nyari jawaban...");

      // GOOGLE SEARCH
      const results = await googleIt({ query: question });

      if (results.length > 0) {
        const top = results[0];

        return message.reply(`
🧠 **Jawaban:**
${top.snippet || "Tidak ada deskripsi"}

🔗 ${top.link}
        `);
      }

      // FALLBACK API
      const res = await axios.get(
        `https://api.duckduckgo.com/?q=${encodeURIComponent(question)}&format=json`
      );

      if (res.data.Abstract) {
        return message.reply(`
🧠 **Jawaban:**
${res.data.Abstract}
        `);
      }

      message.reply("❌ AI Tidak menemukan jawaban");

    } catch (err) {
      console.log(err);
      message.reply("❌ AI error");
    }
  }
});

client.login(process.env.TOKEN);
