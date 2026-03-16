const { Client, GatewayIntentBits } = require("discord.js");
const { joinVoiceChannel, getVoiceConnection } = require("@discordjs/voice");
const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

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

    if (!message.member.voice.channel) {
      return message.reply("Masuk voice dulu.");
    }

    const channel = message.member.voice.channel;

    joinVoiceChannel({
      channelId: channel.id,
      guildId: channel.guild.id,
      adapterCreator: channel.guild.voiceAdapterCreator
    });

    return message.reply("Bot masuk ke voice.");
  }

  // ====================
  // LEAVE VOICE
  // ====================
  if (command === "leave") {

    const connection = getVoiceConnection(message.guild.id);

    if (!connection) {
      return message.reply("Bot tidak ada di voice.");
    }

    connection.destroy();

    return message.reply("Bot keluar dari voice.");
  }

  // ====================
  // AI COMMAND
  // ====================
  if (command === "ai") {

    const question = args.join(" ");

    if (!question) {
      return message.reply("Masukkan pertanyaan.");
    }

    try {

      const response = await openai.responses.create({
        model: "gpt-4.1-mini",
        input: question
      });

      const answer = response.output_text;

      return message.reply(answer.slice(0, 1900));

    } catch (err) {

      console.log("AI ERROR:");
      console.log(err);

      return message.reply("AI error, cek console server.");

    }

  }

  // ====================
  // HELP COMMAND
  // ====================
  if (command === "help") {

    return message.reply(`
COMMAND BOT

,voice → bot masuk voice
,leave → bot keluar voice
,ai <pertanyaan> → tanya AI
,help → lihat command
`);

  }

});

client.login(process.env.TOKEN);
