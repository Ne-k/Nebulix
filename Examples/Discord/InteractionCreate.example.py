import base64
import discord
from discord.ext import commands

intents = discord.Intents.default()
client = commands.Bot(command_prefix="!", intents=intents)

def decode_base64(encoded_str):
    return base64.b64decode(encoded_str).decode('utf-8')

@client.event
async def on_ready():
    print(f'Logged in as {client.user}')

@client.event
async def on_interaction(interaction: discord.Interaction):
    if interaction.custom_id.startswith('Trading_'):
        encoded_contact = interaction.custom_id.replace('Trading_', '')
        contact_info = decode_base64(encoded_contact)
        thread = interaction.channel

        try:
            messages = await thread.history(limit=100).flatten()
            bot_message = next(msg for msg in messages if msg.author.bot)

            if not bot_message:
                await interaction.response.send_message('Looks like I ran into an error when trying to claim this trade. Please try again.', ephemeral=True)
                return

            footer = bot_message.embeds[0].footer.text
            stored_contact_info = decode_base64(footer)
            stored_contact_info = decode_base64(stored_contact_info)
            user_nickname = interaction.user.nick or interaction.user.name

            if contact_info != stored_contact_info:
                await interaction.response.send_message('Error: The contact information does not match the thread.', ephemeral=True)
                return

            await thread.edit(name=f'[Claimed] {thread.name}')
            await interaction.user.send(f'Contact Information for the trade request you\'ve claimed: `{contact_info}`')

            updated_description = f'{bot_message.embeds[0].description}\n\n### Trade claimed by {user_nickname}'
            updated_embed = discord.Embed.from_dict(bot_message.embeds[0].to_dict())
            updated_embed.description = updated_description

            disabled_button = discord.ui.Button(label='Claimed', custom_id=interaction.custom_id, style=discord.ButtonStyle.secondary, disabled=True)
            action_row = discord.ui.ActionRow(disabled_button)

            await bot_message.edit(embed=updated_embed, components=[action_row])

            await interaction.response.send_message('Trade has been claimed. Check your DMs for their contact information.', ephemeral=True)
        except StopIteration:
            await interaction.response.send_message('Looks like I ran into an error when trying to claim this trade. Please try again.', ephemeral=True)

# Replace 'YOUR_BOT_TOKEN' with your actual bot token
client.run('YOUR_BOT_TOKEN')
