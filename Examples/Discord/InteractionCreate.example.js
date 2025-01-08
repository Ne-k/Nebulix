/**
 *
 * This file is meant to be a general idea of how to handle the interaction from Nebulix,
 * this may be implemented differently depending on the structure of your bot.
 *
 * I know this is some really jank code, but as a wise person once said, if it works, it works.
 *
 */
const {ButtonBuilder, EmbedBuilder, ActionRowBuilder, PermissionsBitField} = require("discord.js");

const decodeBase64 = (str) => {
    return Buffer.from(str, 'base64').toString('utf-8');
};

module.exports = async (client, interaction) => {

    // ...
    if (interaction.customId.startsWith('Trading_')) {
        const [_, threadId, encodedContact] = interaction.customId.split('_');
        const contactInfo = decodeBase64(encodedContact);

        let thread = interaction.channel;

        const messages = await thread.messages.fetch({ limit: 100 });
        const botMessage = messages.filter(msg => msg.author.bot).first();

        if (!botMessage) return interaction.reply({
            content: 'Looks like I ran into an error when trying to claim this trade. Please try again.',
            ephemeral: true
        });

        const footer = botMessage.embeds[0].footer.text;
        let storedContactInfo = decodeBase64(footer);
        const userNickname = interaction.member.nickname || interaction.user.username;

        if (threadId !== thread.id) {
            const fetchedThread = await client.channels.fetch(threadId).catch(() => null);

            if (!fetchedThread) {
                return interaction.reply({
                    content: 'Error: Looks like I was unable to find the thread for this trade. Please try again.',
                    ephemeral: true
                });
            }
            thread = fetchedThread;
        }

        await thread.setName(`[Claimed] ${thread.name}`);

        await interaction.user.send(`Contact Information for the trade request you've claimed: \`${contactInfo}\``);

        const updatedDescription = `${botMessage.embeds[0].description}\n\n### Trade claimed by ${userNickname}`;
        const updatedEmbed = EmbedBuilder.from(botMessage.embeds[0])
            .setDescription(updatedDescription)
            .setFooter(" ");

        const disabledButton = new ButtonBuilder()
            .setCustomId(interaction.customId)
            .setLabel(`Claimed`)
            .setStyle(2)
            .setDisabled(true);
        const deleteButton = new ButtonBuilder()
            .setCustomId("Trading_Delete_" + threadId)
            .setLabel(`Delete`)
            .setStyle(4)
            .setDisabled(false);
        const actionRow = new ActionRowBuilder().addComponents(disabledButton, deleteButton);

        await botMessage.edit({ embeds: [updatedEmbed], components: [actionRow] });

        interaction.reply({
            content: 'Trade has been claimed. Check your DMs for their contact information.',
            ephemeral: true
        });

    }
    if (interaction.customId.startsWith("Delete_")) {
        const [_, threadId] = interaction.customId.split('_');
        let thread = await client.channels.fetch(threadId);

        if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
            return interaction.reply({
                content: 'You require `MANAGE_MESSAGES` to delete this request.',
                ephemeral: true
            });
        }

        interaction.reply({
            content: "Deleting the thread...",
            ephemeral: true
        });

        if (thread) {
            await thread.delete().catch(err => {
                console.log(err);
                interaction.followUp({
                    content: 'There was an error trying to delete the thread.',
                    ephemeral: true
                });
            });
        } else {
            interaction.followUp({
                content: 'Thread not found or already deleted.',
                ephemeral: true
            });
        }
    }

}