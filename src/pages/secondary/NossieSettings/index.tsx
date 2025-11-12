import { forwardRef } from 'react'
import SecondaryPageLayout from '@/layouts/SecondaryPageLayout'
import { useNossie } from '@/hooks/useNossie'
import { NOSSIE_SUPPORTED_PROVIDERS } from '@/config/nossie'

// Debug: Verify providers are loaded
console.log('🔍 Nossie Settings - Available Providers:', Object.keys(NOSSIE_SUPPORTED_PROVIDERS))
console.log('🔍 Nossie Settings - Provider Config:', NOSSIE_SUPPORTED_PROVIDERS)
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CheckCircle, AlertCircle, Loader2, Sparkles, ExternalLink, Eye, EyeOff, Server, Info } from 'lucide-react'
import { useState } from 'react'

export default forwardRef(function NossieSettings({ index }: { index?: number }, ref) {
  const {
    config,
    updateConfig,
    testConfig,
    isTesting,
    testError
  } = useNossie()

  const [apiKey, setApiKey] = useState(config.apiKey || '')
  const [selectedProvider, setSelectedProvider] = useState(config.provider)
  const [selectedModel, setSelectedModel] = useState(config.model)
  const [baseUrl, setBaseUrl] = useState(config.baseUrl || '')
  const [showApiKey, setShowApiKey] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)

  const provider = NOSSIE_SUPPORTED_PROVIDERS[selectedProvider]

  // Debug logging
  console.log('🔧 Nossie Settings Debug:', {
    selectedProvider,
    provider,
    allProviders: Object.keys(NOSSIE_SUPPORTED_PROVIDERS),
    providerConfig: NOSSIE_SUPPORTED_PROVIDERS
  })

  const handleProviderChange = (newProvider: string) => {
    console.log('🔄 Provider changed to:', newProvider)
    setSelectedProvider(newProvider as any)
    const newProviderData = NOSSIE_SUPPORTED_PROVIDERS[newProvider as keyof typeof NOSSIE_SUPPORTED_PROVIDERS]

    if (newProviderData) {
      setSelectedModel(newProviderData.defaultModel)
      console.log('✅ Provider data loaded:', {
        name: newProviderData.name,
        models: newProviderData.models,
        defaultModel: newProviderData.defaultModel
      })
    } else {
      console.error('❌ Provider data not found for:', newProvider)
    }

    if (newProvider !== 'self-hosted') {
      setBaseUrl('')
    } else {
      // Pre-populate common Open WebUI URL
      setBaseUrl('http://localhost:3000')
    }
  }

  const handleSave = () => {
    updateConfig({
      apiKey: apiKey.trim() || undefined,
      provider: selectedProvider,
      model: selectedModel,
      baseUrl: baseUrl.trim() || undefined
    })
  }

  const handleTest = async () => {
    try {
      setTestResult(null)
      const result = await testConfig({
        config: {
          provider: selectedProvider,
          apiKey: apiKey.trim() || undefined,
          model: selectedModel,
          baseUrl: baseUrl.trim() || undefined
        }
      })
      setTestResult(result)
    } catch (error) {
      setTestResult({
        success: false,
        message: error instanceof Error ? error.message : 'Test failed'
      })
    }
  }

  // Form validation - API key optional for self-hosted
  const isFormValid = selectedProvider === 'self-hosted'
    ? baseUrl.trim() !== '' && selectedModel !== ''
    : apiKey.trim() !== '' && selectedModel !== ''

  // Debug: Test provider loading
  const providerList = Object.entries(NOSSIE_SUPPORTED_PROVIDERS)
  console.log('🧪 Provider List Test:', providerList)

  return (
    <SecondaryPageLayout ref={ref} index={index} title="Nossie AI Settings">
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Nossie AI</h1>
            <p className="text-muted-foreground">
              Configure AI provider for analyzing Nostr posts
            </p>
          </div>
        </div>

        {/* Debug: Show provider count and list */}
        <div className="text-sm text-muted-foreground space-y-2">
          <div>Debug: {providerList.length} providers loaded</div>
          <div className="font-mono text-xs bg-muted p-2 rounded">
            Provider keys: {Object.keys(NOSSIE_SUPPORTED_PROVIDERS).join(', ')}
          </div>
        </div>

        <Tabs defaultValue="configure" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="configure">Configure AI</TabsTrigger>
            <TabsTrigger value="providers">Available Providers</TabsTrigger>
          </TabsList>

          <TabsContent value="configure" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Provider Configuration</CardTitle>
                <CardDescription>
                  Set up your AI provider to enable Nossie AI analysis
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="provider">AI Provider</Label>

                  {/* Debug: Show providers as simple list first */}
                  <div className="mb-4 p-3 bg-muted rounded-lg">
                    <p className="text-sm font-medium mb-2">Available Providers (Debug):</p>
                    <div className="space-y-1">
                      {Object.entries(NOSSIE_SUPPORTED_PROVIDERS).map(([key, provider]) => (
                        <div key={key} className="text-xs flex items-center gap-2">
                          <span className="font-mono">{key}:</span>
                          <span>{provider.name}</span>
                          <span className="text-muted-foreground">({provider.models.length} models)</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Select value={selectedProvider} onValueChange={handleProviderChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select provider">
                        <div className="flex items-center gap-2">
                          {selectedProvider === 'self-hosted' ? (
                            <Server className="h-4 w-4 text-orange-500" />
                          ) : (
                            <Sparkles className="h-4 w-4 text-purple-500" />
                          )}
                          <span>{provider?.name || 'Select provider'}</span>
                        </div>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(NOSSIE_SUPPORTED_PROVIDERS).map(([key, providerData]) => {
                        console.log(`📋 Rendering provider option: ${key} - ${providerData.name}`)
                        const isConfigured = config.provider === key && (key === 'self-hosted' ? !!config.baseUrl : !!config.apiKey)
                        return (
                          <SelectItem key={key} value={key}>
                            <div className="flex items-center gap-2 w-full">
                              {key === 'self-hosted' ? (
                                <Server className="h-4 w-4 text-orange-500" />
                              ) : (
                                <Sparkles className="h-4 w-4 text-purple-500" />
                              )}
                              <span className="flex-1">{providerData.name}</span>
                              {isConfigured && (
                                <CheckCircle className="h-3 w-3 text-green-500" />
                              )}
                              {key === 'self-hosted' && (
                                <span className="text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-1.5 py-0.5 rounded">
                                  FREE
                                </span>
                              )}
                              {key === 'groq' && (
                                <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded">
                                  FAST
                                </span>
                              )}
                            </div>
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="model">Model</Label>
                  <Select value={selectedModel} onValueChange={setSelectedModel}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select model" />
                    </SelectTrigger>
                    <SelectContent>
                      {provider.models.map((model) => (
                        <SelectItem key={model} value={model}>
                          {model}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* API Key Input */}
                {selectedProvider !== 'self-hosted' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="apiKey">API Key</Label>
                      {provider.apiKeyUrl && (
                        <a
                          href={provider.apiKeyUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                        >
                          Get API Key
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                    <div className="relative">
                      <Input
                        id="apiKey"
                        type={showApiKey ? 'text' : 'password'}
                        placeholder={`Enter your ${provider.name} API key`}
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowApiKey(!showApiKey)}
                      >
                        {showApiKey ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Your API key is stored locally in your browser and never sent to our servers
                    </p>
                  </div>
                )}

                {/* Self-Hosted Configuration */}
                {selectedProvider === 'self-hosted' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="baseUrl">Server URL</Label>
                      <Input
                        id="baseUrl"
                        placeholder="http://localhost:3000"
                        value={baseUrl}
                        onChange={(e) => setBaseUrl(e.target.value)}
                      />
                      <div className="text-xs text-muted-foreground space-y-1">
                        <p>Examples:</p>
                        <ul className="list-disc list-inside ml-2 space-y-0.5">
                          <li><code className="bg-muted px-1 py-0.5 rounded">http://localhost:3000</code> - Open WebUI</li>
                          <li><code className="bg-muted px-1 py-0.5 rounded">http://localhost:11434</code> - Ollama</li>
                          <li><code className="bg-muted px-1 py-0.5 rounded">http://your-server:8080</code> - Custom server</li>
                        </ul>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="selfHostedApiKey">API Key (Optional)</Label>
                      <div className="relative">
                        <Input
                          id="selfHostedApiKey"
                          type={showApiKey ? 'text' : 'password'}
                          placeholder="API key (leave blank if not required)"
                          value={apiKey}
                          onChange={(e) => setApiKey(e.target.value)}
                          className="pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                          onClick={() => setShowApiKey(!showApiKey)}
                        >
                          {showApiKey ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Most self-hosted instances don't require an API key. Leave blank if not needed.
                      </p>
                    </div>

                    {/* Model name input for self-hosted */}
                    <div className="space-y-2">
                      <Label htmlFor="selfHostedModel">Model Name</Label>
                      <Input
                        id="selfHostedModel"
                        placeholder="llama3.2, mistral, mixtral, etc."
                        value={selectedModel === 'default' ? '' : selectedModel}
                        onChange={(e) => setSelectedModel(e.target.value || 'default')}
                      />
                      <p className="text-xs text-muted-foreground">
                        Enter the exact model name as configured in your LLM server (e.g., "llama3.2", "mistral")
                      </p>
                    </div>

                    {/* Info box for Open WebUI */}
                    <div className="rounded-lg bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-4 border border-blue-200 dark:border-blue-800">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-blue-500 rounded-lg">
                          <Server className="h-5 w-5 text-white" />
                        </div>
                        <div className="space-y-3 flex-1">
                          <div>
                            <p className="text-sm font-bold text-blue-900 dark:text-blue-100 mb-1">
                              🚀 Free AI with Open WebUI
                            </p>
                            <p className="text-xs text-blue-700 dark:text-blue-300">
                              Run AI models locally on your computer, Umbrel node, or server - completely free with full privacy!
                            </p>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {/* Open WebUI Column */}
                            <div className="bg-white/50 dark:bg-black/20 p-3 rounded-lg">
                              <p className="text-xs font-bold text-blue-900 dark:text-blue-100 mb-2">
                                🌐 Open WebUI (Recommended)
                              </p>
                              <div className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                                <p className="font-mono">http://localhost:3000</p>
                                <ol className="list-decimal list-inside space-y-0.5">
                                  <li>Install via Docker or pip</li>
                                  <li>Create account at localhost:3000</li>
                                  <li>Download models (llama3.2, mistral, etc.)</li>
                                  <li>Enter exact model name above</li>
                                  <li>No API key needed! 🎉</li>
                                </ol>
                                <a
                                  href="https://docs.openwebui.com/"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline mt-1"
                                >
                                  Setup Guide
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              </div>
                            </div>

                            {/* Ollama Column */}
                            <div className="bg-white/50 dark:bg-black/20 p-3 rounded-lg">
                              <p className="text-xs font-bold text-blue-900 dark:text-blue-100 mb-2">
                                🦙 Ollama (Advanced)
                              </p>
                              <div className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                                <p className="font-mono">http://localhost:11434</p>
                                <ol className="list-decimal list-inside space-y-0.5">
                                  <li>Install from ollama.com</li>
                                  <li>Pull model: <code className="bg-muted px-1">ollama pull llama3.2</code></li>
                                  <li>Enable CORS: <code className="bg-muted px-1">export OLLAMA_ORIGINS="*"</code></li>
                                  <li>Restart: <code className="bg-muted px-1">ollama serve</code></li>
                                  <li>Use model name from <code className="bg-muted px-1">ollama list</code></li>
                                </ol>
                                <a
                                  href="https://ollama.com/download"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline mt-1"
                                >
                                  Download Ollama
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              </div>
                            </div>
                          </div>

                          {/* Benefits banner */}
                          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-2">
                            <div className="flex items-center gap-2 text-xs">
                              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                              <div className="text-green-700 dark:text-green-300">
                                <strong>$0 cost</strong> · <strong>100% private</strong> · <strong>Unlimited usage</strong> · <strong>Works offline</strong>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* Status */}
                {config.apiKey && config.provider === selectedProvider && (
                  <div className="rounded-lg bg-green-50 dark:bg-green-900/20 p-3 border border-green-200 dark:border-green-800">
                    <p className="text-sm text-green-800 dark:text-green-300">
                      ✓ {provider.name} is configured and ready to use
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button
                    onClick={handleSave}
                    disabled={!isFormValid}
                    className="flex-1"
                  >
                    Save Settings
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleTest}
                    disabled={!isFormValid || isTesting}
                  >
                    {isTesting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Testing...
                      </>
                    ) : (
                      'Test API'
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* API Test Result */}
            {testResult && (
              <div className={`rounded-lg p-3 border ${
                testResult.success
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                  : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
              }`}>
                <div className="flex items-start gap-2">
                  {testResult.success ? (
                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                  )}
                  <p className={`text-sm ${
                    testResult.success
                      ? 'text-green-800 dark:text-green-300'
                      : 'text-red-800 dark:text-red-300'
                  }`}>
                    {testResult.message}
                  </p>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="providers" className="space-y-4">
            <div className="grid gap-4">
              {Object.entries(NOSSIE_SUPPORTED_PROVIDERS).map(([key, provider]) => (
                <Card key={key}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {key === 'self-hosted' ? (
                        <Server className="h-5 w-5 text-orange-500" />
                      ) : (
                        <Sparkles className="h-5 w-5 text-purple-500" />
                      )}
                      {provider.name}
                    </CardTitle>
                    <CardDescription>{provider.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-2">
                        {provider.supportsImages && (
                          <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                            Supports Images
                          </span>
                        )}
                        {provider.supportsStreaming && (
                          <span className="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded">
                            Streaming
                          </span>
                        )}
                        {key === 'self-hosted' && (
                          <span className="text-xs bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 px-2 py-1 rounded flex items-center gap-1">
                            <Server className="h-3 w-3" />
                            Free & Private
                          </span>
                        )}
                      </div>

                      <div>
                        <p className="text-sm font-medium mb-1">Available Models:</p>
                        <div className="flex flex-wrap gap-1">
                          {provider.models.slice(0, 6).map((model) => (
                            <span key={model} className="text-xs bg-muted px-2 py-1 rounded">
                              {model}
                            </span>
                          ))}
                          {provider.models.length > 6 && (
                            <span className="text-xs text-muted-foreground px-2 py-1">
                              +{provider.models.length - 6} more
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Special instructions for self-hosted */}
                      {key === 'self-hosted' && (
                        <div className="rounded-lg bg-muted p-3">
                          <p className="text-sm font-medium mb-2">Setup Instructions:</p>
                          <ol className="text-xs space-y-1 list-decimal list-inside">
                            <li>Install Open WebUI or Ollama on your machine/Umbrel</li>
                            <li>Start the server (usually on port 3000 or 11434)</li>
                            <li>Download models (e.g., llama3.2, mistral)</li>
                            <li>Enter server URL above (e.g., http://localhost:3000)</li>
                            <li>Enter exact model name (check server for available models)</li>
                          </ol>
                          <div className="mt-2 space-y-1">
                            <a
                              href="https://docs.openwebui.com/"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
                            >
                              Open WebUI Docs
                              <ExternalLink className="h-3 w-3" />
                            </a>
                            <br />
                            <a
                              href="https://ollama.com/download"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
                            >
                              Download Ollama
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        </div>
                      )}

                      {provider.apiKeyUrl && key !== 'self-hosted' && (
                        <div>
                          <a
                            href={provider.apiKeyUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
                          >
                            Get API Key
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Error Display */}
        {testError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {testError instanceof Error ? testError.message : 'Configuration test failed'}
            </AlertDescription>
          </Alert>
        )}

        {/* Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              About Nossie AI
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Nossie is a helpful, maximally truthful, and slightly wise-ass AI that analyzes Nostr posts
              with full thread context. It reads parent posts, replies, and author's recent activity
              to provide insightful analysis.
            </p>
            <div className="space-y-2 text-sm">
              <h4 className="font-medium">Features:</h4>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Analyzes posts with full thread context</li>
                <li>Provides wise-ass but generally positive insights</li>
                <li>Bitcoin-positive, crypto-negative perspective</li>
                <li>Supports follow-up conversations</li>
                <li>Includes "Submerged Observations" insights</li>
                <li>Works with multiple AI providers including self-hosted</li>
              </ul>
            </div>
            <div className="space-y-2 text-sm">
              <h4 className="font-medium">Getting API Keys:</h4>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>
                  <strong>OpenAI:</strong> Visit{" "}
                  <a
                    href="https://platform.openai.com/api-keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    platform.openai.com/api-keys
                  </a>
                </li>
                <li>
                  <strong>Anthropic:</strong> Visit{" "}
                  <a
                    href="https://console.anthropic.com/settings/keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    console.anthropic.com/settings/keys
                  </a>
                </li>
                <li>
                  <strong>Google AI:</strong> Visit{" "}
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    aistudio.google.com/app/apikey
                  </a>
                </li>
                <li>
                  <strong>Groq:</strong> Visit{" "}
                  <a
                    href="https://console.groq.com/keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    console.groq.com/keys
                  </a>
                </li>
                <li>
                  <strong>OpenRouter:</strong> Visit{" "}
                  <a
                    href="https://openrouter.ai/keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    openrouter.ai/keys
                  </a>
                </li>
                <li>
                  <strong>Self-Hosted:</strong> Set up Open WebUI, Ollama, or other compatible LLM servers
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </SecondaryPageLayout>
  )
})