require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const { joinVoiceChannel, getVoiceConnection } = require('@discordjs/voice');
const googleIt = require('google-it');
const axios = require('axios');
const cheerio = require('cheerio');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates
  ]
});

const PREFIX = process.env.PREFIX || "!";

client.on('ready', () => {
  console.log(`Bot aktif sebagai ${client.user.tag}`);
});

// Command handler
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (!message.content.startsWith(PREFIX)) return;

  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  // ===== Voice join/afk =====
  if (command === "voice") {
    const vc = message.member.voice.channel;
    if (!vc) return message.reply("Kamu harus berada di voice channel dulu!");
    joinVoiceChannel({
      channelId: vc.id,
      guildId: vc.guild.id,
      adapterCreator: vc.guild.voiceAdapterCreator,
      selfDeaf: false,
      selfMute: true // AFK mode
    });
    message.reply(`Berhasil join voice channel: **${vc.name}** (AFK mode)`);
  }

  // ===== Leave voice =====
  if (command === "leave") {
    const connection = getVoiceConnection(message.guild.id);
    if (!connection) return message.reply("Bot tidak sedang berada di voice channel!");
    connection.destroy();
    message.reply("Bot telah keluar dari voice channel.");
  }

  // ===== AI chat =====
  if (command === "ai") {
    const query = args.join(" ");
    if (!query) return message.reply("Tolong tulis pertanyaanmu!");

    message.channel.send(`Mencari jawaban untuk: **${query}** ...`);

    try {
      // Cari hasil dari Google
      const results = await googleIt({ query, limit: 3 });

      let replyText = "";
      for (let i = 0; i < results.length; i++) {
        const link = results[i].link;

        try {
          const { data } = await axios.get(link);
          const $ = cheerio.load(data);
          const text = $("p").first().text();
          if (text) {
            replyText += `**Sumber:** ${link}\n**Info:** ${text}\n\n`;
          }
        } catch (err) {
          replyText += `**Sumber:** ${link}\n**Info:** Tidak bisa diambil.\n\n`;
        }
      }

      if (!replyText) replyText = "Maaf, tidak menemukan jawaban yang jelas.";
      message.reply(replyText);

    } catch (err) {
      console.error(err);
      message.reply("Ada error saat mencari jawaban.");
    }
  }
});

client.login(process.env.TOKEN);
