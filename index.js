require("dotenv").config();

const { Client, GatewayIntentBits } = require("discord.js");
const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus
} = require("@discordjs/voice");

const play = require("play-dl");
const OpenAI = require("openai");

// ================= SETUP =================
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates
  ]
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

let connection;
const player = createAudioPlayer();

// ================= READY =================
client.once("ready", () => {
  console.log(`✅ Bot aktif: ${client.user.tag}`);
});

// ================= MESSAGE =================
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  const args = message.content.split(" ");
  const cmd = args[0].toLowerCase();

  // ================= HELP =================
  if (cmd === ",help") {
    return message.reply(`
🔥 COMMAND BOT 🔥

🎵 MUSIC
,voice → join VC
,leave → keluar VC
,play <judul/url> → play lagu

🧠 AI
,ai <pertanyaan> → tanya apa aja

⚡ UTILITY
,ping → cek bot
`);
  }

  // ================= PING =================
  if (cmd === ",ping") {
    return message.reply("🏓 Pong!");
  }

  // ================= JOIN VOICE =================
  if (cmd === ",voice") {
    if (!message.member.voice.channel)
      return message.reply("❌ Masuk VC dulu");

    connection = joinVoiceChannel({
      channelId: message.member.voice.channel.id,
      guildId: message.guild.id,
      adapterCreator: message.guild.voiceAdapterCreator
    });

    connection.subscribe(player);

    return message.reply("✅ Masuk voice channel");
  }

  // ================= LEAVE =================
  if (cmd === ",leave") {
    if (!connection)
      return message.reply("❌ Bot ga di VC");

    connection.destroy();
    connection = null;

    return message.reply("👋 Keluar VC");
  }

  // ================= PLAY MUSIC =================
  if (cmd === ",play") {
    const query = args.slice(1).join(" ");
    if (!query) return message.reply("❌ Masukin judul lagu");

    if (!connection)
      return message.reply("❌ Pake ,voice dulu");

    try {
      let url = query;

      // kalau bukan link → search
      if (!query.includes("youtube.com")) {
        const search = await play.search(query, { limit: 1 });
        if (!search.length)
          return message.reply("❌ Lagu ga ketemu");

        url = search[0].url;
      }

      const stream = await play.stream(url);
      const resource = createAudioResource(stream.stream, {
        inputType: stream.type
      });

      player.play(resource);

      player.on(AudioPlayerStatus.Idle, () => {
        // auto selesai (bisa nanti tambah queue)
      });

      return message.reply(`▶️ Playing: ${url}`);
    } catch (err) {
      console.log(err);
      return message.reply("❌ Error play lagu");
    }
  }

  // ================= AI =================
  if (cmd === ",ai") {
    const q = args.slice(1).join(" ");
    if (!q) return message.reply("❌ Tanya sesuatu");

    try {
      await message.reply("🧠 Lagi mikir...");

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "Kamu adalah AI pintar, santai, dan selalu menjawab dalam bahasa Indonesia dengan jelas dan mudah dipahami."
          },
          {
            role: "user",
            content: q
          }
        ]
      });

      const jawab = completion.choices[0].message.content;

      return message.reply(jawab);
    } catch (err) {
      console.log(err);
      return message.reply("❌ Error AI (cek API KEY lu)");
    }
  }
});

// ================= LOGIN =================
client.login(process.env.TOKEN);
