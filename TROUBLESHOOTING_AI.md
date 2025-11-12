# AI Provider Troubleshooting Guide

## 🔍 Common Issues & Solutions

### Issue: "Groq not showing in dropdown"

**Possible Causes:**
1. Browser cache issue
2. Old saved configuration
3. TypeScript compilation error

**Solutions:**
1. **Hard refresh**: Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)
2. **Clear localStorage**: 
   - Open browser console (F12)
   - Run: `localStorage.removeItem('nossie_config')`
   - Refresh page
3. **Check console**: Look for errors starting with 🔍 or 📋
4. **Verify providers loaded**: Should see "6 providers loaded" at top of settings

### Issue: "OpenRouter not showing in dropdown"

**Solutions:**
Same as above - hard refresh and clear cache. Both Groq and OpenRouter are properly configured in the code.

### Issue: "Self-hosted connection fails"

**Common Causes & Fixes:**

#### 1. Server Not Running
```bash
# Check if Open WebUI is running
curl http://localhost:3000/api/health

# Check if Ollama is running
curl http://localhost:11434/api/tags

# Start Open WebUI (Docker)
docker start open-webui

# Start Ollama
ollama serve
```

#### 2. Wrong Port
- **Open WebUI**: Usually 3000 or 8080
- **Ollama**: Usually 11434
- **Check**: Look at server startup logs

#### 3. CORS Not Enabled (Ollama Only)
```bash
# Set environment variable
export OLLAMA_ORIGINS="*"

# Restart Ollama
ollama serve

# Or edit systemd service (Linux)
sudo systemctl edit ollama.service
# Add: Environment="OLLAMA_ORIGINS=*"
sudo systemctl restart ollama
```

#### 4. Wrong API Endpoint
The self-hosted implementation tries 4 different endpoints automatically:
- `/v1/chat/completions`
- `/api/chat/completions`
- `/api/chat`
- `/chat/completions`

Check browser console for which endpoint worked.

#### 5. Model Not Found
```bash
# List available models
ollama list

# Pull a model
ollama pull llama3.2

# In Open WebUI
Go to Settings → Models → Pull a model from registry
```

#### 6. Wrong Model Name
Model names are **case-sensitive**!

**Correct:**
- `llama3.2`
- `mistral`
- `mixtral:8x7b`

**Wrong:**
- `Llama3.2` ❌
- `MISTRAL` ❌
- `Mixtral` ❌

### Issue: "API Key Invalid" (Cloud Providers)

**Check:**
1. **Copied correctly**: No extra spaces or characters
2. **Key active**: Not expired or deleted
3. **Billing enabled**: Some providers require payment method
4. **Region**: Some APIs restricted by geography

**Get New Key:**
- **OpenAI**: https://platform.openai.com/api-keys
- **Anthropic**: https://console.anthropic.com/settings/keys
- **Google**: https://aistudio.google.com/app/apikey
- **Groq**: https://console.groq.com/keys
- **OpenRouter**: https://openrouter.ai/keys

### Issue: "Request Timeout"

**Solutions:**
1. **Check internet**: Ensure stable connection
2. **Try different model**: Some models are slower
3. **Use faster provider**: Groq is fastest
4. **Local instance**: Self-hosted for no network latency

### Issue: "Rate Limit Exceeded"

**By Provider:**

#### Groq Free Tier
- **Limit**: 30 requests/minute
- **Solution**: Wait a minute or upgrade to paid

#### OpenAI
- **Limit**: Varies by tier
- **Solution**: Add payment method or reduce usage

#### Google AI
- **Limit**: Generous free tier
- **Solution**: Rarely hit, but can upgrade

#### Self-Hosted
- **Limit**: ♾️ NONE! Use unlimited!

### Issue: "Response Validation Errors"

**Warnings in console:**
- `Response must end with "Would you like me to..."`
- `Response should not contain section headings`

**Note**: These are warnings, not errors. The analysis still works, but the AI didn't follow Nossie's format guidelines perfectly. This is normal and doesn't affect functionality.

### Issue: "No providers in dropdown"

**Debug Steps:**
1. Open Settings → Nossie AI
2. Check debug section shows "6 providers loaded"
3. Check "Available Providers (Debug)" list shows all 6
4. Open browser console (F12)
5. Look for errors in red
6. Check for logs starting with 🔍 or 📋

**If still broken:**
1. Clear all site data
2. Hard refresh (Ctrl+Shift+R)
3. Check browser compatibility (use modern browser)

## 🧪 Testing Your Configuration

### Step 1: Configure Provider
1. Select provider from dropdown
2. Enter API key (or server URL for self-hosted)
3. Select model
4. Click "Save Settings"

### Step 2: Test Connection
1. Click "Test API" button
2. Wait for response (5-30 seconds)
3. Check for success message

### Step 3: Test on Real Post
1. Find any post on Jumble
2. Click the Sparkles (✨) button
3. Wait for Nossie analysis
4. If it works, you're all set! 🎉

## 📝 Expected Behavior

### Successful Configuration
```
✅ Green checkmark appears
✅ "Configuration test successful" message
✅ Provider name shows in status
✅ Sparkles button enabled on posts
```

### Failed Configuration
```
❌ Red X appears
❌ Error message with details
❌ Test button remains enabled for retry
❌ Sparkles button disabled on posts
```

## 🔧 Debug Checklist

- [ ] Provider shows in dropdown
- [ ] Can select provider
- [ ] Can select model
- [ ] Can enter API key/URL
- [ ] Can save configuration
- [ ] Test API succeeds
- [ ] Sparkles button appears on posts
- [ ] Analysis dialog opens
- [ ] Analysis completes successfully

## 💡 Pro Debugging Tips

### Enable Verbose Logging
Open browser console and look for logs:
- `🔍` - Configuration loading
- `🧪` - Provider validation
- `📋` - Dropdown rendering
- `🔄` - Provider changes
- `✅` - Success operations
- `❌` - Errors
- `🔧` - API endpoint attempts

### Check Network Tab
1. Open DevTools → Network
2. Filter by "Fetch/XHR"
3. Click "Test API"
4. See which URL it calls
5. Check response status

### Inspect localStorage
```javascript
// View current config
JSON.parse(localStorage.getItem('nossie_config'))

// Clear config
localStorage.removeItem('nossie_config')

// Reset to defaults
location.reload()
```

## 🆘 Still Having Issues?

### Self-Hosted Specific

**Problem**: "Failed to connect to self-hosted instance"

**Checklist:**
```bash
# 1. Is server running?
ps aux | grep -E "(ollama|open-webui)"

# 2. Can you access web UI?
curl http://localhost:3000  # Open WebUI
curl http://localhost:11434/api/tags  # Ollama

# 3. Is model downloaded?
ollama list  # For Ollama
# Or check Open WebUI → Models

# 4. Check server logs
docker logs open-webui  # Docker
journalctl -u ollama -f  # Systemd

# 5. Test API directly
curl -X POST http://localhost:3000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"model":"llama3.2","messages":[{"role":"user","content":"test"}]}'
```

### Cloud Provider Specific

**Problem**: "API key rejected"

**Checklist:**
1. Copy API key again (avoid extra spaces)
2. Check key hasn't been deleted in provider dashboard
3. Verify billing is set up (some require payment method)
4. Try regenerating key
5. Check API usage limits/quotas

### Browser Specific

**Problem**: Works on one browser, not another

**Checklist:**
1. Try in incognito/private mode
2. Disable extensions temporarily
3. Check browser console for errors
4. Clear site data and retry
5. Update browser to latest version

## 📞 Getting Help

### Check Console First
Browser console (F12) provides detailed error messages and logs that help diagnose issues.

### Information to Include
When reporting issues:
- Provider selected
- Error message (exact text)
- Console logs (screenshot or copy)
- Browser and version
- Self-hosted setup details (if applicable)

### Resources
- **GitHub Issues**: https://github.com/CodyTseng/jumble/issues
- **Nostr**: Search #jumble or #nossie
- **Documentation**: See OPEN_WEBUI_INTEGRATION.md

## ✨ Success Indicators

You'll know it's working when:
1. ✅ Provider appears in dropdown
2. ✅ Models populate when provider selected
3. ✅ Test API returns success
4. ✅ Green checkmark shows in status
5. ✅ Sparkles button appears on posts
6. ✅ Clicking Sparkles opens analysis dialog
7. ✅ Analysis completes and shows insights

## 🎉 Working? Great!

Once working, you can:
- Analyze any Nostr post with AI
- Ask follow-up questions
- Switch between providers
- Compare different models
- Enjoy free, private AI analysis!

---

**Remember**: Groq and Self-Hosted offer FREE options - no credit card required! 🚀
