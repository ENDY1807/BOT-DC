require("dotenv").config();
const { Client, GatewayIntentBits } = require("discord.js");
const {
  joinVoiceChannel,
  getVoiceConnection,
  createAudioPlayer,
  createAudioResource,
  StreamType
} = require("@discordjs/voice");
const fetch = require("node-fetch");
const gtts = require("google-tts-api");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates
  ]
});

const prefix = ",";
const OPENAI_KEY = process.env.OPENAI_KEY;

client.once("ready", () => {
  console.log(`Bot online sebagai ${client.user.tag}`);
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (!message.content.startsWith(prefix)) return;

  const args = message.content.slice(prefix.length).trim().split(" ");
  const command = args.shift().toLowerCase();

  if (command === "voice") {
    if (!message.member.voice.channel) return message.reply("Masuk voice dulu.");
    const channel = message.member.voice.channel;

    joinVoiceChannel({
      channelId: channel.id,
      guildId: channel.guild.id,
      adapterCreator: channel.guild.voiceAdapterCreator,
      selfDeaf: false
    });

    return message.reply("Bot join voice!");
  }

  if (command === "leave") {
    const connection = getVoiceConnection(message.guild.id);
    if (!connection) return message.reply("Bot tidak ada di voice.");
    connection.destroy();
    return message.reply("Bot keluar dari voice.");
  }

  if (command === "ai") {
    const question = args.join(" ");
    if (!question) return message.reply("Masukkan pertanyaan.");

    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENAI_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [
            { role: "system", content: "Kamu asisten ramah, jawab pakai bahasa Indonesia." },
            { role: "user", content: question }
          ]
        })
      });

      const data = await res.json();
      const replyText = data.choices[0].message.content;
      await message.reply(replyText);

      const connection = getVoiceConnection(message.guild.id);
      if (connection) {
        const url = gtts.getAudioUrl(replyText, {
          lang: "id",
          slow: false,
          host: "https://translate.google.com"
        });

        const player = createAudioPlayer();
        const resource = createAudioResource(url, {
          inputType: StreamType.Arbitrary
        });

        player.play(resource);
        connection.subscribe(player);
      }
    } catch (err) {
      console.error(err);
      message.reply("AI error atau voice gagal diputar.");
    }
  }

  if (command === "help") {
    return message.reply(`
COMMAND BOT
,voice → join voice
,leave → keluar voice
,ai <pertanyaan> → chat AI & bacain
,help → lihat command
`);
  }
});

client.login(process.env.TOKEN);
