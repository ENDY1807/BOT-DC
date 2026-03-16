const { Client, GatewayIntentBits } = require("discord.js");
const { joinVoiceChannel, getVoiceConnection, createAudioPlayer, createAudioResource, StreamType } = require("@discordjs/voice");
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

client.once("ready", () => {
  console.log(`Bot online sebagai ${client.user.tag}`);
});

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
  // AI CHAT + TTS
  // ====================
  if (command === "ai") {
    const question = args.join(" ");
    if (!question) return message.reply("Masukkan pertanyaan.");

    try {
      const res = await fetch("https://api.affiliateplus.xyz/api/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: question,
          botname: "VoiceAI",
          ownername: "Endy",
          user: message.author.id
        })
      });

      const data = await res.json();
      if (!data.message) return message.reply("AI tidak bisa menjawab sekarang.");

      const replyText = data.message.slice(0, 2000);
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

        const player = createAudioPlayer();
        const resource = createAudioResource(url, { inputType: StreamType.Arbitrary });
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

client.login(process.env.TOKEN);
