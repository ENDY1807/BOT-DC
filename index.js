require("dotenv").config(); // pastikan ada file .env dengan OPENAI_KEY
const { Client, GatewayIntentBits } = require("discord.js");
const { joinVoiceChannel, getVoiceConnection, createAudioPlayer, createAudioResource, StreamType } = require("@discordjs/voice");
const gtts = require("google-tts-api");
const fs = require("fs");
const fetch = require("node-fetch");
const { Configuration, OpenAIApi } = require("openai");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates
  ]
});

const prefix = ",";

// Setup OpenAI
const configuration = new Configuration({
  apiKey: process.env.OPENAI_KEY
});
const openai = new OpenAIApi(configuration);

client.once("ready", () => {
  console.log(`Bot online sebagai ${client.user.tag}`);
});

// ====================
// MESSAGE HANDLER
// ====================
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (!message.content.startsWith(prefix)) return;

  const args = message.content.slice(prefix.length).trim().split(" ");
  const command = args.shift().toLowerCase();

  // ====================
  // JOIN VOICE
  // ====================
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
      return message.reply("Bot masuk ke voice dan stay di channel!");
    } catch (err) {
      console.log(err);
      return message.reply("Gagal join voice.");
    }
  }

  // ====================
  // LEAVE VOICE
  // ====================
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

  // ====================
  // AI CHAT
  // ====================
  if (command === "ai") {
    const question = args.join(" ");
    if (!question) return message.reply("Masukkan pertanyaan.");

    try {
      // Panggil OpenAI Chat API
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: question }]
      });

      const replyText = completion.choices[0].message.content.slice(0, 2000);
      message.reply(replyText);

      // ====================
      // TEXT-TO-SPEECH
      // ====================
      const connection = getVoiceConnection(message.guild.id);
      if (connection) {
        const url = gtts.getAudioUrl(replyText, {
          lang: 'id',
          slow: false,
          host: 'https://translate.google.com',
        });

        const resource = createAudioResource(url, { inputType: StreamType.Arbitrary });
        const player = createAudioPlayer();
        player.play(resource);
        connection.subscribe(player);
      }

    } catch (err) {
      console.log(err);
      message.reply("AI error.");
    }
  }

  // ====================
  // HELP
  // ====================
  if (command === "help") {
    return message.reply(`
COMMAND BOT

,voice → bot join voice dan stay
,leave → bot keluar voice
,ai <pertanyaan> → chat AI & bot bacain di voice
,help → lihat command
`);
  }
});

// ====================
// LOGIN BOT
// ====================
client.login(process.env.TOKEN);
