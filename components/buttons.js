const { Events, MessageFlags, ChannelType, ThreadAutoArchiveDuration, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

/**
 * Creates a private thread for the user who triggered the interaction
 * @param {import('discord.js').ButtonInteraction} interaction - The button interaction object
 * @returns {Promise<void>}
 */

const {evaluateLimit} = require('../utils/evaluateText');
const {processWithGPT} = require('../utils/processwithGPT');

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
let trackAwake = {}

async function awakeAIBot(interaction) {
    try {
 
        

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const thread = interaction.channel;

        if( trackAwake[interaction.channel.id]  && trackAwake[interaction.channel.id] === true ) {
            await interaction.editReply({ content: 'Guru is already awake!', flags: MessageFlags.Ephemeral });
            return;
        }

        const member = await thread.members.fetch(interaction.user.id).catch(() => null);
        if (!thread && thread.type !== ChannelType.PrivateThread && !member) {
            await interaction.editReply({ content: 'You can only wake the AI Bot in your private thread.', flags: MessageFlags.Ephemeral });
            return;

        }

        const threadMessageCollector = interaction.channel.createMessageCollector({
            filter: m => m.author.id === interaction.user.id,
            time: 60 * 1000, // 1 minute
        });

        trackAwake[interaction.channel.id] = true;

        threadMessageCollector.on('collect', async (message) => {
            const { isEligible, messageCountToday } = await evaluateLimit(interaction.user.id);
            if (!isEligible) {
                await message.reply({
                    content: `You have reached your daily limit of ${messageCountToday} messages. Please try again tomorrow.`,
                    flags: MessageFlags.Ephemeral,
                });
                return;
            }

            

            console.log(`Message from ${message.author.username}: ${message.content}`);
            
            // aggregate last 6 messages between bot and user
            const messages = await thread.messages.fetch({ limit: 6, cache: false });
            let aggregatedMessages = [];

            const sortedMessages = Array.from(messages.values())
        .filter(msg => msg.author.id === interaction.client.user.id || msg.author.id === interaction.user.id)
        .sort((a, b) => a.createdTimestamp - b.createdTimestamp);

        sortedMessages.forEach(msg => {
            aggregatedMessages.push({
                role: msg.author.id === interaction.client.user.id ? 'assistant' : 'user',
                content: msg.content,
            });
        });

        if (!sortedMessages.some(msg => msg.id === message.id)) {
            aggregatedMessages.push({
                role: 'user',
                content: message.content
            });
        }

            // Process the aggregated messages with GPT
            const reply = await processWithGPT(aggregatedMessages)
            await message.reply({
                content: reply,
            });

            // reset collector timeout
            threadMessageCollector.resetTimer();

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

            trackAwake[interaction.channel.id] = false; // Reset the awake status

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