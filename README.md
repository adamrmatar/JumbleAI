<div align="center">
  <picture>
    <img src="./resources/logo-light.svg" alt="Jumble Logo" width="400" />
  </picture>
  <p>logo designed by <a href="http://wolfertdan.com/">Daniel David</a></p>
</div>

# Jumble

A user-friendly Nostr client for exploring relay feeds with **AI-powered analysis**

Experience Jumble at [https://jumble.social](https://jumble.social)

## 🤖 NEW: Multi-Provider AI Analysis (Nossie)

Jumble now features **Nossie AI** - an intelligent assistant that analyzes Nostr posts with full thread context!

### ✨ 6 AI Providers Supported
- **OpenAI** - GPT-4o, GPT-4 Turbo, GPT-3.5
- **Anthropic** - Claude 3.5 Sonnet, Claude 3 Opus
- **Google AI** - Gemini 2.0 Flash, Gemini 1.5 Pro
- **Groq** - ⚡ Ultra-fast Llama 3.3 70B (300-800 tokens/sec!)
- **OpenRouter** - Access 100+ models through one API
- **Self-Hosted** - 🆓 FREE unlimited AI with Open WebUI/Ollama!

### 🎯 Key Features
- 🆓 **FREE options** - Groq free tier & self-hosted unlimited
- 🔒 **100% private** - Self-hosted option keeps data on your device
- ⚡ **Ultra-fast** - Groq provides 300-800 tokens/second
- 🌐 **40+ models** - Choose the best AI for your needs
- 📱 **Easy setup** - Visual guides for all providers
- 🎛️ **Umbrel support** - Run AI on your Bitcoin node!

[📖 AI Setup Guide](./OPEN_WEBUI_INTEGRATION.md) | [🤔 Which Provider?](./WHICH_AI_PROVIDER.md) | [🔧 Troubleshooting](./TROUBLESHOOTING_AI.md)

## Forks

> Some interesting forks of Jumble.

- [https://jumblekat.com/](https://jumblekat.com/) - by [@Karnage](https://jumble.social/users/npub1r0rs5q2gk0e3dk3nlc7gnu378ec6cnlenqp8a3cjhyzu6f8k5sgs4sq9ac)
- [https://grouped-notes.dtonon.com/](https://grouped-notes.dtonon.com/) - by [@daniele](https://jumble.social/users/npub10000003zmk89narqpczy4ff6rnuht2wu05na7kpnh3mak7z2tqzsv8vwqk)
- [https://jumble.imwald.eu/](https://jumble.imwald.eu/) Repo: [Silberengel/jumble](https://github.com/Silberengel/jumble) - by [@Silberengel](https://jumble.social/users/npub1l5sga6xg72phsz5422ykujprejwud075ggrr3z2hwyrfgr7eylqstegx9z)

## Run Locally

```bash
# Clone this repository
git clone https://github.com/CodyTseng/jumble.git

# Go into the repository
cd jumble

# Install dependencies
npm install

# Run the app
npm run dev
```

## Run Docker

```bash
# Clone this repository
git clone https://github.com/CodyTseng/jumble.git

# Go into the repository
cd jumble

# Run the docker compose
docker compose up --build -d
```

After finishing, access: http://localhost:8089

## Sponsors

<a target="_blank" href="https://opensats.org/">
  <img alt="open-sats-logo" src="./resources/open-sats-logo.svg" height="44">
</a>

## Donate

If you like this project, you can buy me a coffee :)

- **Lightning:** ⚡️ codytseng@getalby.com ⚡️
- **Bitcoin:** bc1qwp2uqjd2dy32qfe39kehnlgx3hyey0h502fvht
- **Geyser:** https://geyser.fund/project/jumble

## License

MIT
