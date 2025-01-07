# Nebulix

Nebulix is a project that integrates with Discord to handle trade requests for FIRST FRC shirt/goods trading. This
project is built using TypeScript and Node.js. It is designed to simplify the trading process and prioritize first-come,
first-serve.

## Purpose

The purpose of Nebulix is to streamline the process of trading FIRST FRC shirts and goods by automating the creation and
management of trade requests through a Discord bot. This ensures a fair and efficient trading experience for all users.

## Features

- **Create Trade Request Threads in Discord**: Automatically create threads in a specified Discord channel for each
  trade request.
- **Automated Trade Request Management**: Manage trade requests by handling user interactions and updating the status of
  trades.
- **User-Friendly Interaction Handling**: Provide an easy-to-use interface for users to submit trade requests and
  interact with the bot.
- **Rate Limiting**: Prevent users from submitting too many requests in a short period to ensure fair usage.
- **Form Validation**: Ensure all required fields are filled out before allowing form submission.

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

1. **Website End**: This part of the system creates the Discord channel thread and sends a message with a trade request.
   It is handled by the `api/sendWebhook.ts` file.
2. **Interaction Handling**: This part handles the interaction when a user clicks the "Claim" button in the Discord
   message. It is handled by the `InteractionCreate.js` file.

### Using `Discord/InteractionCreate.js`

To use the `Discord/InteractionCreate.js` file, follow these steps:

1. Ensure your Discord bot is set up to handle interactions. This typically involves setting up an event listener for
   interactions in your bot's main file.

2. Ensure your bot has the necessary permissions to create threads and send messages in the specified channel.

**Note:** The `Discord/InteractionCreate.js` file is meant to be an example or a rough idea of the interaction handling
side of the bot and may be implemented differently depending on your bot structure.

## Laundry List 
[ ] Implement ReCaptcha to prevent spamming of requests

## Contributing

Please read the [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting
pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.