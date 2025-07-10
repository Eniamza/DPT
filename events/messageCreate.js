const { Events, MessageFlags, ChannelType, ThreadAutoArchiveDuration } = require('discord.js');
const { createPrivateThread, awakeAIBot } = require('../components/buttons.js');

module.exports = {
	name: Events.MessageCreate,
	async execute(message) {
		console.log(`Message from ${message.author.username}: ${message.content}`);
	},
};
