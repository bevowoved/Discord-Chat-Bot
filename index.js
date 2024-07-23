require('dotenv').config();
require('colors');
const { CronJob } = require('cron');
const Discord = require('discord-simple-api');
const fs = require('fs');

if (!process.env.DISCORD_TOKEN) {
  console.error('The DISCORD_TOKEN is not set in .env file.'.red);
  process.exit(1);
}

const bot = new Discord(process.env.DISCORD_TOKEN);

let channelIDs;
try {
  if (!fs.existsSync('channels.txt')) {
    throw new Error('channels.txt file does not exist.');
  }
  channelIDs = fs
    .readFileSync('channels.txt', 'utf-8')
    .split('\n')
    .filter(Boolean);
} catch (error) {
  console.error(error.message.red);
  process.exit(1);
}

const sendMessage = (channelId, message, color) => {
  bot
    .sendMessageToChannel(channelId, message)
    .then((res) => {
      const logMessage = `Channel ID : ${channelId} | Message : ${res.content} | Date : ${new Date().toUTCString()}`;
      console.log(logMessage[color]);
      fs.appendFile('logs.txt', logMessage + '\n', (err) => {
        if (err) console.error('Failed to write to logs.txt'.red, err);
      });
    })
    .catch((err) => {
      const errorLog = `Failed to send message to channel ${channelId} | Date : ${new Date().toUTCString()} | Error : ${err.response.data.message}`;
      console.error(errorLog.red);
      fs.appendFile('logs.txt', errorLog + '\n', (err) => {
        if (err) console.error('Failed to write to logs.txt'.red, err);
      });
    });
};

const sendMessageSequentially = (messages) => {
  const sendNext = (index = 0) => {
    if (index >= messages.length) return;
    const { channelId, message, color } = messages[index];
    sendMessage(channelId, message, color);
    setTimeout(() => sendNext(index + 1), 1000);
  };
  sendNext();
};

const sendGoodMorning = () => {
  const messages = channelIDs.map((channelId) => ({
    channelId,
    message: 'GM',
    color: 'green',
  }));
  sendMessageSequentially(messages);
};

const sendGoodNight = () => {
  const messages = channelIDs.map((channelId) => ({
    channelId,
    message: 'GN',
    color: 'blue',
  }));
  sendMessageSequentially(messages);
};

const sendWork = () => {
  const messages = channelIDs.map((channelId) => ({
    channelId,
    message: '/work',
    color: 'yellow',
  }));
  sendMessageSequentially(messages);
};

const sendDaily = () => {
  const messages = channelIDs.map((channelId) => ({
    channelId,
    message: '/daily',
    color: 'cyan',
  }));
  sendMessageSequentially(messages);
};

const gmJob = new CronJob('0 8 * * *', sendGoodMorning, null, true, 'UTC');
const gnJob = new CronJob('0 20 * * *', sendGoodNight, null, true, 'UTC');
const workJob = new CronJob('*/66 * * * *', sendWork, null, true, 'UTC');
const dailyJob = new CronJob('0 */8 * * *', sendDaily, null, true, 'UTC');

gmJob.start();
gnJob.start();
workJob.start();
dailyJob.start();

console.log('Cron jobs started.'.yellow);
