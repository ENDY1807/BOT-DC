const { Client, GatewayIntentBits } = require("discord.js");
const { joinVoiceChannel, getVoiceConnection } = require("@discordjs/voice");
const { search } = require("duck-duck-scrape");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates
  ]
});

const prefix = ",";
let aiCooldown = false;

// delay function
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

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
  // AI SEARCH
  // ====================
  if (command === "ai") {

    if (aiCooldown) {
      return message.reply("Tunggu sebentar sebelum pakai AI lagi.");
    }

    const question = args.join(" ");

    if (!question) {
      return message.reply("Masukkan pertanyaan.");
    }

    try {

      aiCooldown = true;

      await sleep(2000); // delay biar tidak diblok search engine

      const results = await search(question);

      if (!results.results.length) {
        aiCooldown = false;
        return message.reply("Tidak menemukan jawaban di internet.");
      }

      const top = results.results.slice(0, 3);

      let text = `🔎 **Hasil pencarian untuk:** ${question}\n\n`;

      top.forEach((r, i) => {
        text += `${i+1}. **${r.title}**\n${r.description}\n${r.url}\n\n`;
      });

      aiCooldown = false;

      return message.reply(text.slice(0,1900));

    } catch (err) {

      console.log(err);
      aiCooldown = false;

      return message.reply("AI sedang error atau diblok sementara.");

    }

  }

  // ====================
  // HELP
  // ====================
  if (command === "help") {

    return message.reply(`
📜 **COMMAND BOT**

,voice → bot masuk voice
,leave → bot keluar voice
,ai <pertanyaan> → cari jawaban di internet
,help → lihat command
`);
  }

});

client.login(process.env.TOKEN);
