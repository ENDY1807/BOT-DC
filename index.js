const { Client, GatewayIntentBits } = require('discord.js');
const { joinVoiceChannel, getVoiceConnection } = require('@discordjs/voice');
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

client.on("ready", () => {
  console.log(`Bot online sebagai ${client.user.tag}`);
});

client.on("messageCreate", async (message) => {

  if (message.author.bot) return;

  // COMMAND VOICE
  if (message.content === ",voice") {

    if (!message.member.voice.channel) {
      return message.reply("Masuk voice dulu sebelum pakai bot.");
    }

    const channel = message.member.voice.channel;

    joinVoiceChannel({
      channelId: channel.id,
      guildId: channel.guild.id,
      adapterCreator: channel.guild.voiceAdapterCreator,
      selfDeaf: true,
      selfMute: true
    });

    return message.reply("Bot masuk voice dan AFK.");
  }

  // COMMAND LEAVE
  if (message.content === ",leave") {
    const connection = getVoiceConnection(message.guild.id);

    if (!connection) return message.reply("Bot tidak ada di voice.");

    connection.destroy();
    return message.reply("Bot keluar dari voice.");
  }

  // AI CHAT
  if (message.content.startsWith(",ai ")) {

    const question = message.content.slice(4);

    try {

      const response = await openai.chat.completions.create({
        model: "gpt-4.1-mini",
        messages: [
          { role: "system", content: "Kamu adalah AI Discord yang membantu menjawab pertanyaan user." },
          { role: "user", content: question }
        ]
      });

      const answer = response.choices[0].message.content;

      message.reply(answer);

    } catch (error) {
      console.error(error);
      message.reply("AI sedang error.");
    }

  }

});

client.login(process.env.TOKEN);
