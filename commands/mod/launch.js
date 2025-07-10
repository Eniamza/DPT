const { SlashCommandBuilder, ChannelType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('launch')
		.setDescription('Launches the create chat message in a specified channel')
		.addChannelOption(option =>
			option.setName('channel')
				.setDescription('Target Channel to create the message in')
				.setRequired(true)
				.addChannelTypes(ChannelType.GuildText)
		),
	async execute(interaction) {
		const channel = interaction.options.getChannel('channel');

		const embed = new EmbedBuilder()
			.setTitle('Create a Private Chat')
			.setDescription('Let Guru Accompany you in your journey to success! Click the button below to create a private chat with us.')
			.setColor(0x00AE86);

		const row = new ActionRowBuilder().addComponents(
			new ButtonBuilder()
				.setCustomId('create_chat')
				.setLabel('Create a Chat')
				.setStyle(ButtonStyle.Primary)
		);

		await channel.send({ embeds: [embed], components: [row] });

		await interaction.reply({ content: `Message sent in ${channel}`, flags: MessageFlags.Ephemeral });
	},
};
