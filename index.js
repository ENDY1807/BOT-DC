const { Client, Intents } = require("discord.js");
const { joinVoiceChannel, getVoiceConnection, createAudioPlayer, createAudioResource, StreamType } = require("@discordjs/voice");
const gtts = require("google-tts-api");
const { Configuration, OpenAIApi } = require("openai");

const client = new Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILD_VOICE_STATES,
    Intents.FLAGS.MESSAGE_CONTENT
  ]
});

const prefix = ",";
const openai = new OpenAIApi(new Configuration({
  apiKey: process.env.OPENAI_API_KEY
}));

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
      // ====================
      // AI RESPONSE
      // ====================
      const response = await openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: question }]
      });

      const replyText = response.data.choices[0].message.content.slice(0, 2000);
      message.reply(replyText);

      // ====================
      // TTS STREAM
      // ====================
      const connection = getVoiceConnection(message.guild.id);
      if (connection) {
        const url = gtts.getAudioUrl(replyText, {
          lang: "id",
          slow: false,
          host: "https://translate.google.com"
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
