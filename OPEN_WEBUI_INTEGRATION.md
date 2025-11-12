# Open WebUI & Self-Hosted LLM Integration Guide

## Overview

Jumble's Nossie AI now supports **self-hosted LLMs** through Open WebUI, Ollama, and any OpenAI-compatible API. This allows you to:

- 🆓 **Use AI for FREE** with local models
- 🔒 **Complete Privacy** - your data never leaves your machine
- ⚡ **Fast Responses** - no network latency
- 🎛️ **Full Control** - choose any model you want

## Supported Self-Hosted Solutions

### 1. Open WebUI (Recommended)
- **Description**: Beautiful web interface for Ollama and other LLM backends
- **Default Port**: 3000
- **Best For**: User-friendly interface, model management, conversation history
- **Download**: https://docs.openwebui.com/

### 2. Ollama
- **Description**: Lightweight LLM runner optimized for local deployment
- **Default Port**: 11434
- **Best For**: Command-line users, minimal overhead, fast startup
- **Download**: https://ollama.com/download

### 3. Umbrel Apps
- **Open WebUI on Umbrel**: Install from Umbrel App Store
- **Ollama on Umbrel**: Available as an Umbrel app
- **Default Access**: Via Umbrel's local network

### 4. Custom OpenAI-Compatible Servers
- LocalAI
- text-generation-webui
- FastChat
- vLLM

## Quick Start Guide

### Option 1: Open WebUI Setup

#### Step 1: Install Open WebUI
```bash
# Using Docker (Recommended)
docker run -d -p 3000:8080 --add-host=host.docker.internal:host-gateway \
  -v open-webui:/app/backend/data --name open-webui \
  --restart always ghcr.io/open-webui/open-webui:main

# Or install via pip
pip install open-webui
open-webui serve
```

#### Step 2: Access Open WebUI
- Open browser to `http://localhost:3000`
- Create an account (stored locally)
- Download models from the Models page

#### Step 3: Configure Jumble
1. Go to **Settings → Nossie AI** in Jumble
2. Select **"Self-Hosted (Open WebUI / Ollama)"**
3. Enter **Server URL**: `http://localhost:3000`
4. Enter **Model Name**: Exact name from Open WebUI (e.g., `llama3.2`)
5. Leave **API Key** blank (not needed for local Open WebUI)
6. Click **"Test API"** to verify connection
7. Click **"Save Settings"**

### Option 2: Ollama Setup

#### Step 1: Install Ollama
```bash
# macOS/Linux
curl -fsSL https://ollama.com/install.sh | sh

# Windows
# Download from https://ollama.com/download
```

#### Step 2: Start Ollama & Download Models
```bash
# Start Ollama service (usually auto-starts)
ollama serve

# Pull a model
ollama pull llama3.2
ollama pull mistral
ollama pull codellama
```

#### Step 3: Enable CORS (Required for Browser Access)
```bash
# Set environment variable
export OLLAMA_ORIGINS="*"

# Or add to systemd service (Linux)
# Edit /etc/systemd/system/ollama.service
# Add: Environment="OLLAMA_ORIGINS=*"
```

#### Step 4: Configure Jumble
1. Go to **Settings → Nossie AI** in Jumble
2. Select **"Self-Hosted (Open WebUI / Ollama)"**
3. Enter **Server URL**: `http://localhost:11434`
4. Enter **Model Name**: Model you downloaded (e.g., `llama3.2`)
5. Leave **API Key** blank
6. Click **"Test API"** to verify connection
7. Click **"Save Settings"**

### Option 3: Umbrel Setup

#### Step 1: Install from Umbrel App Store
1. Open your Umbrel dashboard
2. Go to **App Store**
3. Search for **"Open WebUI"** or **"Ollama"**
4. Click **Install**

#### Step 2: Access the App
- Open WebUI will be available at: `http://umbrel.local:PORT`
- Check Umbrel dashboard for exact port

#### Step 3: Configure Jumble
1. Find your Umbrel's local IP address
2. In Jumble: **Settings → Nossie AI**
3. Select **"Self-Hosted (Open WebUI / Ollama)"**
4. Enter **Server URL**: `http://[umbrel-ip]:[port]`
5. Enter **Model Name** from Open WebUI
6. Click **"Save Settings"**

## Recommended Models for Nostr Analysis

### Best Overall
- **llama3.2** (3B/1B) - Fast, accurate, great for short posts
- **llama3.1** (8B/70B) - More capable, better for complex analysis
- **mistral** (7B) - Excellent reasoning, good balance

### Fastest (Good for frequent analysis)
- **llama3.2:1b** - Ultra-fast, minimal resources
- **phi3** - Microsoft's efficient model
- **gemma2:2b** - Google's lightweight model

### Most Capable (Best insights)
- **llama3.1:70b** - Large parameter model, deep analysis
- **mixtral:8x7b** - Mixture of experts, versatile
- **qwen2.5:14b** - Strong multilingual support

### Specialized
- **codellama** - For technical/code analysis
- **deepseek-coder-v2** - Advanced technical content
- **nous-hermes** - Instruction-following, conversational

## Troubleshooting

### "Failed to connect" Error

**Possible Causes:**
1. Server not running
2. Wrong port number
3. CORS not enabled
4. Firewall blocking connection

**Solutions:**
```bash
# Check if server is running
curl http://localhost:3000/api/health  # Open WebUI
curl http://localhost:11434/api/tags   # Ollama

# Enable CORS for Ollama
export OLLAMA_ORIGINS="*"
systemctl restart ollama

# Check firewall
sudo ufw allow 3000  # Open WebUI
sudo ufw allow 11434 # Ollama
```

### "Model not found" Error

**Solution:**
```bash
# List available models in Ollama
ollama list

# Pull a model if missing
ollama pull llama3.2

# In Open WebUI
# Go to Models → Pull a model from registry
```

### API Key Errors

**Solution:**
- For **local** Open WebUI/Ollama: **Leave API Key blank**
- For **remote** servers with auth: Enter the API key

### Cross-Origin (CORS) Errors

**Open WebUI:**
- CORS is enabled by default

**Ollama:**
```bash
# Add CORS environment variable
export OLLAMA_ORIGINS="*"

# Or edit service file
sudo systemctl edit ollama
# Add:
# [Service]
# Environment="OLLAMA_ORIGINS=*"
```

## Performance Tips

### Model Selection
- **Short posts (<280 chars)**: Use small models (1B-3B)
- **Long posts/threads**: Use medium models (7B-14B)
- **Complex analysis**: Use large models (70B+)

### System Resources
| Model Size | RAM Required | GPU VRAM |
|------------|--------------|----------|
| 1B-3B      | 4GB          | 2GB      |
| 7B-8B      | 8GB          | 4GB      |
| 13B-14B    | 16GB         | 8GB      |
| 70B+       | 64GB         | 40GB     |

### Speed Optimization
1. Use quantized models (Q4, Q5) for faster inference
2. Enable GPU acceleration if available
3. Pre-load frequently used models
4. Use streaming for real-time responses

## Advanced Configuration

### Custom System Prompts
You can modify Nossie's behavior by editing the system prompt in `/src/config/nossie.ts`

### Multiple Self-Hosted Servers
Configure different base URLs for different models:
- Development: `http://localhost:3000`
- Production: `http://your-server:8080`
- Umbrel: `http://umbrel.local:PORT`

### API Endpoint Compatibility
Jumble expects OpenAI-compatible endpoints:
- **Chat Completions**: `/v1/chat/completions`
- **Request Format**: OpenAI chat format
- **Response Format**: OpenAI response structure

Most modern self-hosted LLMs support this format.

## Security Considerations

### Local Setup (Recommended)
- ✅ Data never leaves your machine
- ✅ No API keys needed
- ✅ Complete privacy
- ✅ No usage limits or costs

### Remote Self-Hosted
- ⚠️ Use HTTPS for encrypted connections
- ⚠️ Set up authentication/API keys
- ⚠️ Configure firewall rules
- ⚠️ Use VPN for secure access

### Open WebUI Security
- 🔐 Built-in user authentication
- 🔐 Role-based access control
- 🔐 API key management
- 🔐 Conversation encryption

## Example Configurations

### Example 1: Local Open WebUI
```
AI Provider: Self-Hosted (Open WebUI / Ollama)
Server URL: http://localhost:3000
Model Name: llama3.2
API Key: [leave blank]
```

### Example 2: Local Ollama
```
AI Provider: Self-Hosted (Open WebUI / Ollama)
Server URL: http://localhost:11434
Model Name: mistral
API Key: [leave blank]
```

### Example 3: Umbrel Open WebUI
```
AI Provider: Self-Hosted (Open WebUI / Ollama)
Server URL: http://umbrel.local:3000
Model Name: llama3.1
API Key: [leave blank or your Umbrel auth token]
```

### Example 4: Remote Server with Auth
```
AI Provider: Self-Hosted (Open WebUI / Ollama)
Server URL: https://my-llm-server.com
Model Name: mixtral
API Key: your-api-key-here
```

## Benefits of Self-Hosted AI

### Cost Savings
- **$0 per analysis** vs $0.01-$0.10 per analysis with cloud APIs
- **No usage limits**
- **No monthly subscriptions**

### Privacy
- **100% local processing** - your posts never sent to third parties
- **No data collection**
- **No terms of service**
- **Complete control**

### Performance
- **No network latency** for local deployments
- **Instant responses** with small models
- **Works offline**

### Customization
- **Custom models** trained on specific data
- **Fine-tuned prompts** for Nostr content
- **Model switching** based on post type
- **Unlimited experimentation**

## Recommended Workflow

1. **Start Local**: Use Open WebUI with llama3.2 for testing
2. **Test Different Models**: Try mistral, mixtral, phi3 to find best fit
3. **Optimize**: Use smaller models for simple posts, larger for complex
4. **Scale**: Add more models as needed, no cost increase
5. **Enjoy**: Free, private AI analysis on all your Nostr posts!

## Resources

- **Open WebUI Documentation**: https://docs.openwebui.com/
- **Ollama Documentation**: https://github.com/ollama/ollama/blob/main/docs/api.md
- **Umbrel App Store**: https://apps.umbrel.com/
- **Model Library**: https://ollama.com/library
- **Groq Free API**: https://console.groq.com/keys (cloud, but free tier)
- **OpenRouter**: https://openrouter.ai/keys (pay-per-use, access to all models)

## Support

Having issues? Check:
1. Server is running (`curl http://localhost:3000/api/health`)
2. Model is downloaded (`ollama list`)
3. CORS is enabled (check browser console)
4. Port is correct (3000 for Open WebUI, 11434 for Ollama)
5. Model name matches exactly (case-sensitive!)

For more help, check the browser console (F12) for detailed error messages.
