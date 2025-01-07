/**
 *
 * This file is meant to be a general idea of how to handle the interaction from Nebulix,
 * this may be implemented differently depending on the structure of your bot.
 *
 * I know this is some really jank code, but as a wise person once said, if it works, it works.
 *
 */
const {ButtonBuilder, EmbedBuilder, ActionRowBuilder} = require("discord.js");

const decodeBase64 = (str) => {
    return Buffer.from(str, 'base64').toString('utf-8');
};

module.exports = async (client, interaction) => {

    // ...
    if (interaction.customId.startsWith('Trading_')) {
        const encodedContact = interaction.customId.replace('Trading_', '');
        const contactInfo = decodeBase64(encodedContact);
        const thread = interaction.channel;

        const messages = await thread.messages.fetch({limit: 100});
        const botMessage = messages.filter(msg => msg.author.bot).first();

        if (!botMessage) return interaction.reply({
            content: 'Looks like I ran into an error when trying to claim this trade. Please try again.',
            ephemeral: true
        });

        const footer = botMessage.embeds[0].footer.text;
        let storedContactInfo = decodeBase64(footer);
        storedContactInfo = decodeBase64(storedContactInfo);
        const userNickname = interaction.member.nickname || interaction.user.username;

        if (contactInfo !== storedContactInfo) {
            return interaction.reply({
                content: 'Error: The contact information does not match the thread.',
                ephemeral: true
            });
        }

        await thread.setName(`[Claimed] ${thread.name}`);

        await interaction.user.send(`Contact Information for the trade request you've claimed: \`${contactInfo}\``);

        const updatedDescription = `${botMessage.embeds[0].description}\n\n### Trade claimed by ${userNickname}`;
        const updatedEmbed = EmbedBuilder.from(botMessage.embeds[0])
            .setDescription(updatedDescription);

        const disabledButton = new ButtonBuilder()
            .setCustomId(interaction.customId)
            .setLabel(`Claimed`)
            .setStyle(2)
            .setDisabled(true);
        const actionRow = new ActionRowBuilder().addComponents(disabledButton);

        await botMessage.edit({embeds: [updatedEmbed], components: [actionRow]});

        interaction.reply({
            content: 'Trade has been claimed. Check your DMs for their contact information.',
            ephemeral: true
        });
    }

}