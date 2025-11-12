# Multi-Provider AI Implementation for Jumble

## 🎯 Overview

Jumble's Nossie AI system now supports **6 different AI providers** with **40+ models**, including complete support for **self-hosted LLMs** via Open WebUI, Ollama, and Umbrel apps.

## ✅ Implemented Providers

### 1. **OpenAI** ✅
- **Models**: GPT-4o, GPT-4o Mini, GPT-4 Turbo, GPT-3.5 Turbo
- **API Key**: https://platform.openai.com/api-keys
- **Status**: Fully working
- **Best For**: General purpose, creative analysis
- **Cost**: $0.15-$5 per 1M tokens

### 2. **Anthropic** ✅
- **Models**: Claude 3.5 Sonnet, Claude 3.5 Haiku, Claude 3 Opus
- **API Key**: https://console.anthropic.com/settings/keys
- **Status**: Fully implemented
- **Best For**: Deep analysis, nuanced understanding
- **Cost**: $3-$15 per 1M tokens

### 3. **Google AI** ✅
- **Models**: Gemini 2.0 Flash, Gemini 1.5 Pro, Gemini 1.5 Flash, Gemini 1.5 Flash-8B
- **API Key**: https://aistudio.google.com/app/apikey
- **Status**: Fully implemented
- **Best For**: Fast responses, multimodal (images)
- **Cost**: $0.075-$7 per 1M tokens

### 4. **Groq** ✅ NEW!
- **Models**: 
  - Llama 3.3 70B Versatile
  - Llama 3.2 90B Text Preview
  - Llama 3.2 11B Text Preview
  - Llama 3.1 70B Versatile
  - Llama 3.1 8B Instant
  - Mixtral 8x7B
  - Gemma2 9B
- **API Key**: https://console.groq.com/keys
- **Status**: Fully implemented ✨
- **Best For**: **ULTRA-FAST** inference (tokens/sec), free tier available
- **Cost**: FREE tier with limits, then $0.05-$0.59 per 1M tokens
- **Speed**: 300-800 tokens/second! 🚀

### 5. **OpenRouter** ✅ NEW!
- **Models**:
  - OpenAI GPT-4o, GPT-4o Mini
  - Anthropic Claude 3.5 Sonnet, Claude 3 Haiku
  - Google Gemini Pro 1.5, Gemini Flash 1.5
  - Meta Llama 3.1 405B, Llama 3.1 70B
  - Mistral Large
- **API Key**: https://openrouter.ai/keys
- **Status**: Fully implemented ✨
- **Best For**: Access to ALL models through one API, pay-per-use
- **Cost**: Variable, typically cheaper than direct APIs
- **Features**: No monthly subscription, only pay for what you use

### 6. **Self-Hosted (Open WebUI / Ollama)** ✅ NEW!
- **Models**: ANY model you can run locally
  - Llama 3.2, 3.1 (1B-405B)
  - Mistral (7B-123B)
  - Mixtral 8x7B
  - CodeLlama
  - Phi3
  - Gemma2
  - Qwen2.5
  - DeepSeek Coder v2
  - ...and hundreds more!
- **API Key**: Not required for local instances
- **Status**: Fully implemented with multi-endpoint support ✨
- **Best For**: **FREE** unlimited AI, complete privacy, offline usage
- **Cost**: **$0** - completely free! 🎉
- **Setup**: See OPEN_WEBUI_INTEGRATION.md

## 🚀 Key Features

### Multi-Endpoint Support (Self-Hosted)
The self-hosted implementation automatically tries multiple API endpoints for maximum compatibility:
1. `/v1/chat/completions` (OpenAI standard)
2. `/api/chat/completions` (Open WebUI)
3. `/api/chat` (Ollama)
4. `/chat/completions` (Alternative)

### Intelligent Error Handling
- Provider-specific error messages
- Automatic retry with multiple endpoints
- Detailed logging for debugging
- User-friendly error descriptions

### Configuration Validation
- API key validation for cloud providers
- Base URL validation for self-hosted
- Model name verification
- Connection testing before saving

### Conversation History
- Multi-turn conversations with context
- Stored locally in browser
- Works across all providers
- Preserves analysis history

## 🎨 Enhanced UI

### Settings Page Features
- **Tabbed Interface**: Configure AI + Available Providers info
- **Provider Cards**: Detailed information for each provider
- **Debug Information**: Shows loaded providers and config
- **Smart Forms**: Dynamic fields based on selected provider
- **Visual Feedback**: Status indicators, test results, validation
- **Direct Links**: Quick access to API key pages
- **Model Selection**: Provider-specific model dropdowns

### Self-Hosted Setup Wizard
- **Visual Guide**: Step-by-step setup for Open WebUI and Ollama
- **Example URLs**: Common server configurations
- **Quick Reference**: Model names, ports, commands
- **Benefits Banner**: Highlights free, private, unlimited usage
- **Documentation Links**: Direct links to setup guides

## 📊 Provider Comparison

| Provider | Cost | Speed | Privacy | Models | Setup |
|----------|------|-------|---------|--------|-------|
| **OpenAI** | 💰💰💰 | ⚡⚡⚡ | ❌ Cloud | 4 | ⭐ Easy |
| **Anthropic** | 💰💰💰 | ⚡⚡ | ❌ Cloud | 3 | ⭐ Easy |
| **Google** | 💰💰 | ⚡⚡⚡ | ❌ Cloud | 4 | ⭐ Easy |
| **Groq** | 💰 FREE | ⚡⚡⚡⚡⚡ | ❌ Cloud | 7 | ⭐ Easy |
| **OpenRouter** | 💰💰 | ⚡⚡⚡ | ❌ Cloud | 100+ | ⭐ Easy |
| **Self-Hosted** | **FREE** | ⚡⚡⚡⚡ | ✅ **100%** | **Unlimited** | ⭐⭐ Medium |

## 🔧 Technical Implementation

### API Abstraction Layer
```typescript
// Each provider has dedicated implementation
callOpenAIAPI()      // OpenAI, standard OpenAI format
callAnthropicAPI()   // Anthropic, custom message format
callGoogleAPI()      // Google, Gemini-specific format
callGroqAPI()        // Groq, OpenAI-compatible format
callOpenRouterAPI()  // OpenRouter, OpenAI-compatible + headers
callSelfHostedAPI()  // Multi-endpoint with fallbacks
```

### Provider Configuration
```typescript
interface ProviderConfig {
  name: string
  description: string
  baseUrl: string
  models: string[]
  defaultModel: string
  supportsImages?: boolean
  supportsStreaming?: boolean
  apiKeyUrl?: string
  isSelfHosted?: boolean
}
```

### State Management
- **Local Storage**: Persists configuration across sessions
- **React State**: Real-time updates and validation
- **TanStack Query**: API calls and caching

## 🎯 User Benefits

### For Regular Users
- **Choice**: Pick the best provider for your needs
- **Flexibility**: Switch providers anytime
- **Cost Control**: Use free tier or self-hosted options

### For Privacy-Conscious Users
- **Self-Hosted**: Run everything locally
- **No Tracking**: Data never sent to cloud
- **Open Source**: Inspect and modify code
- **Offline Capable**: Works without internet

### For Power Users
- **Multiple Providers**: Use different providers for different tasks
- **Model Selection**: Choose optimal model per use case
- **Advanced Config**: Custom base URLs, API endpoints
- **Debug Tools**: Comprehensive logging and testing

## 📝 Usage Examples

### Example 1: Cloud Provider (Groq - Fastest)
```
1. Go to Settings → Nossie AI
2. Select "Groq" provider
3. Choose "llama-3.1-70b-versatile" model
4. Get free API key from console.groq.com/keys
5. Save and test
6. Enjoy ultra-fast AI analysis!
```

### Example 2: Self-Hosted (Free & Private)
```
1. Install Open WebUI: docker run -d -p 3000:8080 ghcr.io/open-webui/open-webui:main
2. Visit http://localhost:3000 and create account
3. Download llama3.2 model from Models page
4. In Jumble: Settings → Nossie AI
5. Select "Self-Hosted (Open WebUI / Ollama)"
6. Server URL: http://localhost:3000
7. Model Name: llama3.2
8. Save and test
9. FREE unlimited AI! 🎉
```

### Example 3: Umbrel Integration
```
1. Open Umbrel App Store
2. Install "Open WebUI" app
3. Wait for installation to complete
4. Note the app's local URL (e.g., http://umbrel.local:3000)
5. Open the app and download models
6. In Jumble: Settings → Nossie AI
7. Select "Self-Hosted (Open WebUI / Ollama)"
8. Enter Umbrel app URL
9. Enter model name from Open WebUI
10. Save and enjoy free AI on your Umbrel node!
```

## 🔮 Future Enhancements

### Planned Features
- [ ] Streaming responses for real-time analysis
- [ ] Image analysis support (multimodal models)
- [ ] Custom system prompts per provider
- [ ] Usage tracking and analytics
- [ ] Model performance comparison
- [ ] Auto-switching based on post type
- [ ] Batch analysis for multiple posts
- [ ] Export analysis as Nostr notes

### Provider Additions
- [ ] Cohere
- [ ] Together AI
- [ ] Replicate
- [ ] Hugging Face Inference API
- [ ] Azure OpenAI
- [ ] AWS Bedrock

## 📚 Resources

### Official Documentation
- **Jumble Integration**: See `/OPEN_WEBUI_INTEGRATION.md`
- **Nossie AI**: Settings → Nossie AI → Available Providers tab

### External Resources
- **Open WebUI Docs**: https://docs.openwebui.com/
- **Ollama Docs**: https://github.com/ollama/ollama
- **Groq Console**: https://console.groq.com/
- **OpenRouter**: https://openrouter.ai/docs
- **Umbrel Apps**: https://apps.umbrel.com/

### Community
- **Nostr**: Search #nossie or #jumble
- **GitHub**: https://github.com/CodyTseng/jumble
- **Issues**: Report bugs on GitHub

## 🎉 Summary

Jumble now offers the **most comprehensive AI provider support** in the Nostr ecosystem:

✅ **6 Providers** (OpenAI, Anthropic, Google, Groq, OpenRouter, Self-Hosted)  
✅ **40+ Models** across all providers  
✅ **FREE Options** via Groq free tier and self-hosted  
✅ **Complete Privacy** with self-hosted option  
✅ **Easy Setup** with guided UI and documentation  
✅ **Production Ready** with full error handling and testing  

**Get started now**: Settings → Nossie AI 🚀
