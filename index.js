const { Client, GatewayIntentBits } = require('discord.js');
const { joinVoiceChannel } = require('@discordjs/voice');

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

client.on("messageCreate", (message) => {
  if (message.content === ",voice") {

    if (!message.member.voice.channel) {
      return message.reply("Masuk Ke Dalam Voice terlebih Dahulu Sebelum Menggunakan Bot");
    }

    const channel = message.member.voice.channel;

    joinVoiceChannel({
      channelId: channel.id,
      guildId: channel.guild.id,
      adapterCreator: channel.guild.voiceAdapterCreator,
      selfDeaf: true,
      selfMute: true
    });

    message.reply("Bot masuk voice dan AFK.");
  }
});

client.login("MTQ4MjczMzk1NzY5NDA5OTYyOA.GvqMYM.0PZAovll5QMECywvlTZVsaFB4X9PbMAUCx_gpU");