require("dotenv").config();
const { Client, GatewayIntentBits } = require("discord.js");
const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus
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
  console.log(`✅ Bot aktif: ${client.user.tag}`);
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  const args = message.content.split(" ");
  const cmd = args[0];

  // ================= VOICE JOIN =================
  if (cmd === ",voice") {
    if (!message.member.voice.channel) {
      return message.reply("❌ Lu harus masuk VC dulu!");
    }

    connection = joinVoiceChannel({
      channelId: message.member.voice.channel.id,
      guildId: message.guild.id,
      adapterCreator: message.guild.voiceAdapterCreator
    });

    connection.subscribe(player);
    message.reply("✅ Masuk voice & standby");
  }

  // ================= LEAVE =================
  if (cmd === ",leave") {
    if (connection) {
      connection.destroy();
      connection = null;
      message.reply("👋 Keluar dari voice");
    }
  }

  // ================= NOBAR / PLAY =================
  if (cmd === ",play") {
    const query = args.slice(1).join(" ");
    if (!query) return message.reply("❌ Masukin judul / link!");

    try {
      let url = query;

      if (!query.includes("youtube.com")) {
        const search = await play.search(query, { limit: 1 });
        if (!search.length) return message.reply("❌ Lagu tidak ditemukan");
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
      message.reply("❌ Gagal play");
    }
  }

  // ================= AI =================
  if (cmd === ",ai") {
    const question = args.slice(1).join(" ");
    if (!question) return message.reply("❌ Tulis pertanyaan!");

    try {
      message.reply("🔍 Lagi nyari jawaban...");

      // 1. Google Search
      const results = await googleIt({ query: question });

      if (!results.length) {
        return message.reply("❌ Tidak ditemukan");
      }

      // 2. Ambil snippet terbaik
      const top = results[0];

      let answer = `
🧠 **Jawaban AI:**

${top.snippet || "Tidak ada deskripsi"}

🔗 Sumber: ${top.link}
`;

      message.reply(answer);

    } catch (err) {
      console.log(err);

      // fallback kalau google error
      try {
        const res = await axios.get(
          `https://api.duckduckgo.com/?q=${encodeURIComponent(question)}&format=json`
        );

        if (res.data.Abstract) {
          return message.reply(`
🧠 **Jawaban AI:**

${res.data.Abstract}
          `);
        }

        message.reply("❌ AI tidak menemukan jawaban");
      } catch {
        message.reply("❌ Error parah");
      }
    }
  }
});

// ================= LOGIN =================
client.login(process.env.TOKEN);
