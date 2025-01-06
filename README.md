# Nebulix

Nebulix is a project that integrates with Discord to handle trade requests for FIRST FRC shirt/goods trading. This project is built using TypeScript and Node.js. It is designed to simplify the trading process and prioritize first-come, first-serve.

## Features
- Create trade request threads in Discord
- Automated trade request management
- User-friendly interaction handling

## Getting Started

### Prerequisites
- Node.js
- npm

### Installation
1. Clone the repository:
    ```sh
    git clone https://github.com/Ne-k/Nebulix.git
    cd Nebulix
    ```

2. Install dependencies:
    ```sh
    npm install
    ```

3. Create a `.env` file in the root directory and add your environment variables:
    ```dotenv
    DISCORD_BOT_TOKEN=your_discord_bot_token
    DISCORD_CHANNEL_ID=your_discord_channel_id
    GITHUB_REPO_URL=https://github.com/Ne-k/Nebulix
    ```

4. Run the project:
    ```sh
    npm start
    ```

## Usage

### How the Project Works
The project consists of two main parts:
1. **Website End**: This part of the system creates the Discord channel thread and sends a message with a trade request. It is handled by the `api/sendWebhook.ts` file.
2. **Interaction Handling**: This part handles the interaction when a user clicks the "Claim" button in the Discord message. It is handled by the `InteractionCreate.js` file.

### Using `Discord/InteractionCreate.js`
To use the `Discord/InteractionCreate.js` file, follow these steps:

1. Ensure your Discord bot is set up to handle interactions. This typically involves setting up an event listener for interactions in your bot's main file.

2. Ensure your bot has the necessary permissions to create threads and send messages in the specified channel.

**Note:** The `Discord/InteractionCreate.js` file is meant to be an example or a rough idea of the interaction handling side of the bot and may be implemented differently depending on your bot structure.

## Contributing
Please read the [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.