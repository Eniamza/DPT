const { Events, MessageFlags, ChannelType, ThreadAutoArchiveDuration, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

/**
 * Creates a private thread for the user who triggered the interaction
 * @param {import('discord.js').ButtonInteraction} interaction - The button interaction object
 * @returns {Promise<void>}
 */

async function createPrivateThread(interaction) {
    const parentChannel = interaction.channel;

    try {

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const activeThreads = await parentChannel.threads.fetchActive();
        const archivedThreads = await parentChannel.threads.fetchArchived();

        const allThreads = [...activeThreads.threads.values(), ...archivedThreads.threads.values()];
        const targetThreadName = `private-${interaction.user.username.toLowerCase()}`;

        const existingThread = allThreads.find(thread =>
                thread.ownerId === interaction.client.user.id &&
                thread.type === ChannelType.PrivateThread &&
                thread.name.toLowerCase() === targetThreadName
        );

        if (existingThread) {
            await interaction.editReply({
                content: `You already have a private thread: <#${existingThread.id}>`,
                flags: MessageFlags.Ephemeral,
            });
            return;
        }

        const thread = await parentChannel.threads.create({
            name: `private-${interaction.user.username}`,
            autoArchiveDuration: ThreadAutoArchiveDuration.OneWeek,
            type: ChannelType.PrivateThread, // ChannelType.PrivateThread
            invitable: false,
        });

        await thread.members.add(interaction.user.id);
        await thread.members.add(interaction.client.user.id);

        const embed = new EmbedBuilder()
        .setTitle('Start Chat')
        .setDescription('Click the button below to start your journey!')
        .setColor(0x00AE86);

        const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('awake_chat')
            .setLabel('Start')
            .setStyle(ButtonStyle.Primary)
        );

        await thread.send({ embeds: [embed], components: [row] });



        await interaction.editReply({ content: `Private chat created: ${thread.name}`, flags: MessageFlags.Ephemeral });
    } catch (error) {
        console.error('Failed to create thread:', error);
        await interaction.editReply({ content: 'Failed to create the thread.', flags: MessageFlags.Ephemeral });
    }
}

/**
 * Activates the AI bot in response to a button interaction
 * @param {import('discord.js').ButtonInteraction} interaction - The button interaction object
 * @returns {Promise<void>}
 */

async function awakeAIBot(interaction) {
    try {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const thread = interaction.channel;

        const member = await thread.members.fetch(interaction.user.id).catch(() => null);
        if (!thread && thread.type !== ChannelType.PrivateThread && !member) {
            await interaction.editReply({ content: 'You can only wake the AI Bot in your private thread.', flags: MessageFlags.Ephemeral });
            return;

        }

        const threadMessageCollector = interaction.channel.createMessageCollector({
            filter: m => m.author.id === interaction.user.id,
            time: 60 * 1000, // 1 minute
        });

        threadMessageCollector.on('collect', async (message) => {
            // echo the message back to the user
            console.log(`Message from ${message.author.username}: ${message.content}`);
            await thread.send(`You said: ${message.content}`);

        });

        threadMessageCollector.on('end', () => {
            const embed = new EmbedBuilder()
            .setTitle('I went to sleep for a while')
            .setDescription('To save resources, I\'m taking a nap. You can wake me up by clicking the button below.')
            .setColor(0x00AE86);

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('awake_chat')
                    .setLabel('Wake me up!')
                    .setStyle(ButtonStyle.Primary)
            );

            thread.send({ embeds: [embed], components: [row] });
        })

        await interaction.editReply({ content: 'Guru is now active!', flags: MessageFlags.Ephemeral });

    } catch (error) {
        console.error('Failed to awake AI Bot:', error);
        await interaction.editReply({ content: 'Failed to awake Guru', flags: MessageFlags.Ephemeral });
    }
}

module.exports = {
 createPrivateThread, awakeAIBot
};