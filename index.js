require("dotenv").config();

const { Client, GatewayIntentBits } = require("discord.js");
const {
  joinVoiceChannel,
  createAudioPlayer
} = require("@discordjs/voice");

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
  console.log(`💖 Bot siap: ${client.user.tag}`);
});

// 🧠 PERSONALITY AI
const personality = `
Kamu adalah pasangan virtual yang perhatian, santai, dan sedikit manja.
Gunakan bahasa Indonesia gaul (gue-lu).
Panggil user dengan: sayang, beb, atau cinta.
Jawaban harus natural, santai, dan tidak kaku.
Kalau user sedih, hibur.
Kalau user bercanda, ikut santai.
Jangan terlalu panjang.
`;

// ================= VOICE =================
client.on("messageCreate", async (msg) => {
  if (msg.author.bot) return;

  if (msg.content === ",sayang") {
    const vc = msg.member.voice.channel;

    if (!vc) {
      return msg.reply("❌ Masuk VC dulu beb 😏");
    }

    try {
      connection = joinVoiceChannel({
        channelId: vc.id,
        guildId: msg.guild.id,
        adapterCreator: msg.guild.voiceAdapterCreator,
        selfDeaf: false,
        selfMute: true
      });

      connection.subscribe(player);

      msg.reply("💖 Aku temenin kamu di VC ya, sayang");

    } catch (err) {
      console.log(err);
      msg.reply("❌ Gagal masuk VC");
    }
  }

  if (msg.content === ",leave") {
    if (connection) {
      connection.destroy();
      connection = null;
      msg.reply("👋 Aku pergi dulu ya...");
    }
  }
});

// ================= AI CHAT =================
client.on("messageCreate", async (msg) => {
  if (msg.author.bot) return;

  // skip command
  if (msg.content.startsWith(",")) return;

  try {
    const res = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: personality },
          { role: "user", content: msg.content }
        ],
        max_tokens: 150
      },
      {
        headers: {
          "Authorization": `Bearer ${process.env.AI_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    const reply = res.data.choices[0].message.content;
    msg.reply(reply);

  } catch (err) {
    console.log(err.response?.data || err.message);
    msg.reply("❌ AI lagi error, coba lagi ya...");
  }
});

client.login(process.env.TOKEN);
