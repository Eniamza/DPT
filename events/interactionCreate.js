const { Events, MessageFlags, ChannelType, ThreadAutoArchiveDuration } = require('discord.js');
const { createPrivateThread, awakeAIBot } = require('../components/buttons.js');

module.exports = {
	name: Events.InteractionCreate,
	async execute(interaction) {
		try {
			// Handle Slash Commands
			if (interaction.isChatInputCommand()) {
				const command = interaction.client.commands.get(interaction.commandName);

				if (!command) {
					console.error(`No command matching ${interaction.commandName} was found.`);
					return;
				}

				await command.execute(interaction);
			}

			// Handle Button Interactions
			else if (interaction.isButton()) {
				if (interaction.customId === 'create_chat') {

					await createPrivateThread(interaction);

				} else if (interaction.customId === 'awake_chat') {
					await awakeAIBot(interaction);
				}
				
				else {
					// Unknown button ID
					await interaction.editReply({ content: 'Unknown button interaction.', flags: MessageFlags.Ephemeral });
				}
			}
		} catch (error) {
			console.error('Interaction error:', error);

			if (interaction.replied || interaction.deferred) {
				await interaction.followUp({ content: 'There was an error while handling this interaction!', flags: MessageFlags.Ephemeral });
			} else {
				await interaction.reply({ content: 'There was an error while handling this interaction!', flags: MessageFlags.Ephemeral });
			}
		}
	},
};
