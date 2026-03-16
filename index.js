const { Client, GatewayIntentBits } = require("discord.js");
const { joinVoiceChannel, getVoiceConnection } = require("@discordjs/voice");
const fetch = require("node-fetch");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates
  ]
});

const prefix = ",";

client.once("clientReady", () => {
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

      const url = `https://id.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(question)}`;

      const res = await fetch(url);
      const data = await res.json();

      if (!data.extract) {
        return message.reply("Tidak menemukan informasi.");
      }

      const text = `📚 **${data.title}**\n\n${data.extract}\n\n${data.content_urls.desktop.page}`;

      return message.reply(text.slice(0,1900));

    } catch (err) {

      console.log(err);
      return message.reply("AI sedang error.");

    }

  }

  // ====================
  // HELP
  // ====================
  if (command === "help") {

    return message.reply(`
COMMAND BOT

,voice → bot masuk voice
,leave → bot keluar voice
,ai <pertanyaan> → cari info dari Wikipedia
,help → lihat command
`);

  }

});

client.login(process.env.TOKEN);
