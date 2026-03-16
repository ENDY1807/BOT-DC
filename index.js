const { Client, GatewayIntentBits } = require("discord.js");
const { joinVoiceChannel, getVoiceConnection, createAudioPlayer, createAudioResource, StreamType } = require("@discordjs/voice");
const fetch = require("node-fetch");
const gTTS = require("gtts"); // npm install gtts
require("dotenv").config(); // kalau mau pake .env

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates
  ]
});

const prefix = ",";

client.once("ready", () => {
  console.log(`Bot online sebagai ${client.user.tag}`);
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (!message.content.startsWith(prefix)) return;

  const args = message.content.slice(prefix.length).trim().split(" ");
  const command = args.shift().toLowerCase();

  // ===== JOIN VOICE =====
  if (command === "voice") {
    if (!message.member.voice.channel) return message.reply("Masuk voice dulu.");
    const channel = message.member.voice.channel;

    try {
      joinVoiceChannel({
        channelId: channel.id,
        guildId: channel.guild.id,
        adapterCreator: channel.guild.voiceAdapterCreator,
        selfDeaf: false
      });
      return message.reply("Bot masuk ke voice!");
    } catch (err) {
      console.log(err);
      return message.reply("Gagal join voice.");
    }
  }

  // ===== LEAVE VOICE =====
  if (command === "leave") {
    const connection = getVoiceConnection(message.guild.id);
    if (!connection) return message.reply("Bot tidak ada di voice.");
    try {
      connection.destroy();
      return message.reply("Bot keluar dari voice.");
    } catch (err) {
      console.log(err);
      return message.reply("Gagal keluar voice.");
    }
  }

  // ===== AI CHAT =====
  if (command === "ai") {
    const question = args.join(" ");
    if (!question) return message.reply("Masukkan pertanyaan.");

    const OPENAI_KEY = process.env.OPENAI_KEY;
    if (!OPENAI_KEY) return message.reply("OpenAI API Key belum diset!");

    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${OPENAI_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [{ role: "user", content: question }]
        })
      });

      const data = await res.json();
      const replyText = data.choices[0].message.content.slice(0, 2000);
      message.reply(replyText);

      // ===== TEXT TO SPEECH =====
      const connection = getVoiceConnection(message.guild.id);
      if (connection) {
        const tts = new gTTS(replyText, "id");
        const path = `./tts-${Date.now()}.mp3`;
        tts.save(path, () => {
          const player = createAudioPlayer();
          const resource = createAudioResource(path, { inputType: StreamType.Arbitrary });
          player.play(resource);
          connection.subscribe(player);
        });
      }

    } catch (err) {
      console.log(err);
      message.reply("AI error.");
    }
  }

  // ===== HELP =====
  if (command === "help") {
    message.reply(`
COMMAND BOT
,voice → bot join voice
,leave → bot keluar voice
,ai <pertanyaan> → chat AI & bot bacain di voice
,help → lihat command
`);
  }
});

client.login(process.env.TOKEN);
