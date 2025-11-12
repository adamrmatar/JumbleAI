# Cross-Browser Access Guide for Jumble

## 🌐 Opening Your Jumble Project in Another Browser

Your Jumble project is currently running in Shakespeare (https://shakespeare.diy/project/jumble-1). Here's how to access it from other browsers:

---

## **Method 1: Shakespeare in Another Browser** ⭐ EASIEST

### What Works Across Browsers
- ✅ **AI Credits** (if using Shakespeare AI provider)
- ✅ **Nostr Login** (your identity)
- ✅ **Project List** (can see all projects)

### What's Browser-Specific
- ⚠️ **Project Files** (stored in browser's IndexedDB)
- ⚠️ **AI Configuration** (API keys, provider settings)
- ⚠️ **User Preferences** (theme, language, etc.)

### Steps
1. Open **https://shakespeare.diy** in new browser
2. **Login with Nostr** (same account: npub17lm4jpjrstzawtj6sya4rhja26...)
3. You'll see your project list
4. **Note**: Files won't be there unless synced (see Method 2 or 3)

---

## **Method 2: Export/Import Project** ⭐ RECOMMENDED

### Export from Current Browser
1. In Shakespeare: Click **Settings** (gear icon)
2. Go to **Storage** section
3. Click **"Export Projects"** button
4. Downloads `shakespeare-projects.zip`

### Import to New Browser
1. Open **https://shakespeare.diy** in new browser
2. Login with Nostr (same account)
3. Click **Settings** → **Storage**
4. Click **"Import Projects"**
5. Select the downloaded ZIP file
6. **Done!** All files now in new browser ✅

### What Transfers
✅ All project files  
✅ AI configuration (API keys)  
✅ User preferences  
✅ Complete project state  

---

## **Method 3: Git Sync** ⭐ BEST FOR LONG-TERM

### Setup Once, Sync Everywhere

#### In Current Browser (Setup)
1. **Settings** → **Git** in Shakespeare
2. Click **"Initialize Repository"**
3. Configure Git credentials:
   - Name: Your name
   - Email: Your email
4. Click **"Commit & Push"**
5. Authorize GitHub OAuth
6. Creates GitHub repository automatically

#### In New Browser (Clone)
1. Open Shakespeare in new browser
2. Login with Nostr
3. **Settings** → **Git**
4. Click **"Clone Repository"**
5. Enter your repository URL
6. **Done!** Synced! ✅

#### Keep in Sync
- **After changes**: Settings → Git → "Commit & Push"
- **Get updates**: Settings → Git → "Pull"
- **Automatic**: Can set up auto-sync

---

## **Method 4: Run Locally Outside Shakespeare** ⭐ BEST FOR DEVELOPMENT

### Why Run Locally?
✅ Faster development  
✅ Better debugging tools  
✅ Direct console access  
✅ No browser switching  
✅ Can test Open WebUI easily  
✅ Native performance  

### Setup Steps

#### Option A: From Shakespeare Export
```bash
# 1. Export project from Shakespeare (Method 2)
# 2. Extract jumble-1 folder from ZIP
# 3. Navigate to folder
cd jumble-1

# 4. Install dependencies
npm install

# 5. Run development server
npm run dev

# 6. Opens at http://localhost:5173
```

#### Option B: From Git
```bash
# 1. Clone from GitHub (if using Method 3)
git clone https://github.com/your-username/jumble-1.git
cd jumble-1

# 2. Install & run
npm install
npm run dev
```

#### Option C: From Original Repository
```bash
# Clone original Jumble
git clone https://github.com/CodyTseng/jumble.git
cd jumble

# Copy your AI enhancements
# (Or apply them manually)

npm install
npm run dev
```

### Access from Any Device
Once running locally:
- **Same machine**: http://localhost:5173
- **Other devices**: http://YOUR_IP:5173 (on same network)
- **Deploy**: Use Netlify, Vercel, or own server

---

## **Method 5: Deploy to Public URL** 🌍

### Deployment Options

#### Netlify (FREE)
```bash
# From local project
npm run build
npm install -g netlify-cli
netlify deploy --prod --dir=dist
```

#### Vercel (FREE)
```bash
npm run build
npm install -g vercel
vercel --prod
```

#### GitHub Pages (FREE)
```bash
# Add to package.json scripts:
"deploy": "npm run build && gh-pages -d dist"

npm install -g gh-pages
npm run deploy
```

#### Your Own Server
```bash
npm run build
# Upload dist/ folder to server
# Point web server to dist/index.html
```

---

## 🔑 **AI Configuration Across Browsers**

### Problem
Your Nossie AI config (API keys, provider) is stored in **browser localStorage**, which is browser-specific.

### Solutions

#### Solution 1: Export/Import (One-Time)
- Export from browser 1 → Import to browser 2
- Transfers all AI settings ✅

#### Solution 2: Reconfigure (Quick)
- Takes 1-2 minutes to reconfigure
- Just enter API key again
- Settings persist in that browser

#### Solution 3: Use Self-Hosted
- No API key needed!
- Works everywhere if Open WebUI accessible
- Just configure server URL

#### Solution 4: Environment Variables
Add to `.env` file:
```bash
VITE_NOSSIE_PROVIDER=groq
VITE_NOSSIE_API_KEY=your-api-key
VITE_NOSSIE_MODEL=llama-3.3-70b-versatile
```

Then load in app from `import.meta.env`

---

## 🎯 **Recommended Workflow**

### For Your Use Case (Testing AI Providers)

**Best Approach: Run Locally**
```bash
1. Export project from Shakespeare
2. Extract and cd into jumble-1/
3. npm install && npm run dev
4. Configure AI providers at http://localhost:5173/settings/nossie
5. Test all 6 providers easily
6. Debug with full Chrome DevTools
7. When happy, push back to Git or re-import to Shakespeare
```

**Why This Is Best:**
- ✅ Full control over code
- ✅ Easy debugging
- ✅ Fast iteration
- ✅ Can test Open WebUI on localhost easily
- ✅ Better console logging
- ✅ No Shakespeare limitations

---

## 🔧 **Fixing Google AI API Error**

### The Problem
Your error shows:
```
404: Method doesn't exist: generativelanguage.googleapis.com.models.gemini-1.5-flash:generateContent
```

### The Fix
I've updated the Google API implementation to use the correct URL format:
```
https://generativelanguage.googleapis.com/v1beta/models/MODEL_NAME:generateContent?key=API_KEY
```

### Verify Your API Key
1. Go to https://aistudio.google.com/app/apikey
2. Create new API key (or use existing)
3. **Important**: Enable the Generative Language API in Google Cloud Console
4. May need to enable billing (has free tier)

### Common Google API Issues

#### Issue 1: API Not Enabled
```
Error: API [generativelanguage.googleapis.com] not enabled
```

**Fix:**
1. Go to https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com
2. Click "Enable"
3. Wait 1-2 minutes
4. Try again

#### Issue 2: Billing Not Set Up
```
Error: Billing account required
```

**Fix:**
1. Go to https://console.cloud.google.com/billing
2. Set up billing (has generous free tier)
3. Free tier: 15 requests/minute, 1500 requests/day

#### Issue 3: Wrong Model Name
**Solution**: Use these exact model names:
- `gemini-1.5-flash-latest` (recommended)
- `gemini-1.5-pro-latest`
- `gemini-2.0-flash-exp`

---

## ✅ **Verifying OpenRouter Works**

### OpenRouter Configuration
```
Provider: OpenRouter
API Key: Get from https://openrouter.ai/keys
Model: openai/gpt-4o-mini (recommended for testing)
```

### OpenRouter API Format
The implementation uses:
```javascript
URL: https://openrouter.ai/api/v1/chat/completions
Headers:
  - Authorization: Bearer YOUR_API_KEY
  - HTTP-Referer: window.location.origin
  - X-Title: Jumble
Body: OpenAI-compatible format
```

### Test OpenRouter
1. Get API key from https://openrouter.ai/keys
2. Configure in Jumble
3. Click "Test API"
4. Should see: "Configuration test successful! ✅"

---

## ✅ **Verifying Open WebUI Works**

### Open WebUI Configuration
```
Provider: Self-Hosted (Open WebUI / Ollama)
Server URL: http://localhost:3000 (or your server)
Model Name: llama3.2 (or model you downloaded)
API Key: Leave blank for local instances
```

### Open WebUI Endpoints Tried
The implementation automatically tries:
1. `http://localhost:3000/v1/chat/completions`
2. `http://localhost:3000/api/chat/completions`
3. `http://localhost:3000/api/chat`
4. `http://localhost:3000/chat/completions`

### Common Open WebUI Issues

#### Issue 1: CORS Error
```
Error: CORS policy blocked
```

**Fix**: Open WebUI enables CORS by default, but if you see this:
1. Check Open WebUI is running: `docker ps | grep open-webui`
2. Restart container: `docker restart open-webui`
3. Try from same machine first

#### Issue 2: Model Not Found
```
Error: Model "llama3.2" not found
```

**Fix**:
1. Open http://localhost:3000
2. Go to **Settings → Models**
3. Pull model from Ollama:
   - Click "Pull a model from Ollama.com"
   - Enter: `llama3.2`
   - Wait for download
4. Use exact model name in Jumble (case-sensitive!)

#### Issue 3: Connection Refused
```
Error: Failed to connect
```

**Fix**:
```bash
# Check if running
docker ps | grep open-webui

# Start if not running
docker run -d -p 3000:8080 \
  -v open-webui:/app/backend/data \
  --name open-webui \
  ghcr.io/open-webui/open-webui:main

# Check logs
docker logs open-webui
```

---

## 🎯 **Quick Setup Commands**

### Install Open WebUI (Docker)
```bash
docker run -d -p 3000:8080 \
  --add-host=host.docker.internal:host-gateway \
  -v open-webui:/app/backend/data \
  --name open-webui \
  --restart always \
  ghcr.io/open-webui/open-webui:main
```

### Install Ollama
```bash
# macOS/Linux
curl -fsSL https://ollama.com/install.sh | sh

# Download models
ollama pull llama3.2
ollama pull mistral
ollama pull mixtral

# Enable CORS
export OLLAMA_ORIGINS="*"
ollama serve
```

### Test Connection
```bash
# Test Open WebUI
curl http://localhost:3000/api/health

# Test Ollama
curl http://localhost:11434/api/tags

# Test with real API call
curl -X POST http://localhost:3000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "llama3.2",
    "messages": [{"role": "user", "content": "test"}]
  }'
```

---

## 📱 **Mobile/Tablet Access**

### If Running Locally
1. **Find your computer's IP**: `ifconfig` (Mac/Linux) or `ipconfig` (Windows)
2. **Access from mobile**: http://YOUR_IP:5173
3. **Same network required**

### If Deployed
- Access via public URL
- Works on any device
- No network restrictions

---

## 🎉 **Summary**

### To Access in Another Browser:
1. **Quickest**: Export/Import (Method 2) - 5 minutes
2. **Best Long-Term**: Git Sync (Method 3) - 10 minutes setup
3. **Development**: Run Locally (Method 4) - Best for testing AI
4. **Public Access**: Deploy (Method 5) - Share with anyone

### For AI Configuration:
- **Groq/OpenRouter**: Need API key in each browser
- **Self-Hosted**: Just configure server URL (no key needed!)
- **Transfer Settings**: Use Export/Import method

### Recommendation:
**Export project → Run locally → Test all AI providers → Deploy when ready**

This gives you the best development experience and allows easy testing of Open WebUI, Groq, and OpenRouter! 🚀

---

## 🔗 **Useful Links**

- **Shakespeare**: https://shakespeare.diy
- **Your Project**: https://shakespeare.diy/project/jumble-1
- **Google AI Studio**: https://aistudio.google.com/app/apikey
- **Groq Console**: https://console.groq.com/keys
- **OpenRouter**: https://openrouter.ai/keys
- **Open WebUI**: https://docs.openwebui.com/
- **Ollama**: https://ollama.com/download

---

**Need help?** Check the browser console (F12) for detailed error logs! 🔍
