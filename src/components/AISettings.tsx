import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ExternalLink, Eye, EyeOff, CheckCircle, XCircle, Loader2, Info, Sparkles, Settings, Server } from 'lucide-react'
import { useAIAnalysis } from '@/hooks/useAIAnalysis'
import { TAIProvider } from '@/types'

export function AISettings() {
  const {
    providerInfo,
    providers,
    isConfigured,
    testAPI,
    isTestingAPI,
    testResult,
    updateAIConfig,
  } = useAIAnalysis()

  const [showApiKey, setShowApiKey] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<TAIProvider>('openai')
  const [apiKey, setApiKey] = useState('')
  const [selectedModel, setSelectedModel] = useState('')
  const [baseUrl, setBaseUrl] = useState('')

  const handleProviderChange = (provider: TAIProvider) => {
    setSelectedProvider(provider)
    const providerData = providers[provider]
    setSelectedModel(providerData.defaultModel)
    setApiKey('')
    setBaseUrl('')
  }

  const handleSave = () => {
    const config = {
      provider: selectedProvider,
      apiKey: apiKey.trim() || undefined,
      model: selectedModel,
      baseUrl: baseUrl.trim() || undefined,
    }

    updateAIConfig(config)
  }

  const handleTestAPI = () => {
    // First save the current settings
    const config = {
      provider: selectedProvider,
      apiKey: apiKey.trim() || undefined,
      model: selectedModel,
      baseUrl: baseUrl.trim() || undefined,
    }

    updateAIConfig(config)

    // Test after a small delay to ensure config is updated
    setTimeout(() => {
      testAPI()
    }, 100)
  }

  const handleClear = () => {
    setApiKey('')
    setBaseUrl('')
    updateAIConfig({ provider: 'openai', apiKey: undefined, model: undefined, baseUrl: undefined })
  }

  const currentProviderData = providers[selectedProvider]

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Sparkles className="h-6 w-6 text-purple-500" />
        <h2 className="text-2xl font-bold">AI Analysis Settings</h2>
      </div>

      <Tabs defaultValue="configure" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="configure">Configure AI</TabsTrigger>
          <TabsTrigger value="providers">Available Providers</TabsTrigger>
        </TabsList>

        <TabsContent value="configure" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                AI Configuration
              </CardTitle>
              <CardDescription>
                Configure AI providers to analyze Nostr posts and provide context
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Provider Selection */}
              <div className="space-y-2">
                <Label>AI Provider</Label>
                <Select value={selectedProvider} onValueChange={handleProviderChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(providers).map(([key, provider]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-purple-500" />
                          {provider.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Provider Info */}
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <Sparkles className="h-5 w-5 text-purple-500" />
                <div>
                  <p className="font-medium">{currentProviderData.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {currentProviderData.description}
                  </p>
                </div>
              </div>

              {/* Model Selection */}
              <div className="space-y-2">
                <Label>Model</Label>
                <Select value={selectedModel} onValueChange={setSelectedModel}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a model" />
                  </SelectTrigger>
                  <SelectContent>
                    {currentProviderData.models.map((model) => (
                      <SelectItem key={model.value} value={model.value}>
                        {model.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* API Key Input */}
              {selectedProvider !== 'self-hosted' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>API Key</Label>
                    {currentProviderData.apiKeyUrl && (
                      <a
                        href={currentProviderData.apiKeyUrl}
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
                      type={showApiKey ? 'text' : 'password'}
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder={`Enter your ${currentProviderData.name} API key`}
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

              {/* Base URL for Self-Hosted */}
              {selectedProvider === 'self-hosted' && (
                <div className="space-y-2">
                  <Label>Server URL</Label>
                  <Input
                    value={baseUrl}
                    onChange={(e) => setBaseUrl(e.target.value)}
                    placeholder="http://localhost:8080"
                  />
                  <p className="text-xs text-muted-foreground">
                    URL for your self-hosted AI instance (Open WebUI, Ollama, etc.)
                  </p>
                </div>
              )}

              {/* Status */}
              {isConfigured && providerInfo && (
                <div className="rounded-lg bg-green-50 dark:bg-green-900/20 p-3 border border-green-200 dark:border-green-800">
                  <p className="text-sm text-green-800 dark:text-green-300">
                    ✓ {providerInfo.name} is configured and ready to use
                  </p>
                </div>
              )}

              {/* API Test */}
              {(apiKey || selectedProvider === 'self-hosted') && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Test API Connection</Label>
                    <Button
                      onClick={handleTestAPI}
                      disabled={isTestingAPI}
                      variant="outline"
                      size="sm"
                    >
                      {isTestingAPI ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Testing...
                        </>
                      ) : (
                        'Test API'
                      )}
                    </Button>
                  </div>

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
                          <XCircle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
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
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button 
                  onClick={handleSave} 
                  disabled={!apiKey && selectedProvider !== 'self-hosted'}
                >
                  Save Settings
                </Button>
                {isConfigured && (
                  <Button onClick={handleClear} variant="outline">
                    Clear Settings
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Info Box */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  How AI Analysis Works
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Analyzes post content to identify key topics and sentiment</li>
                  <li>Provides background context and summary</li>
                  <li>Works with multiple AI providers including self-hosted instances</li>
                  <li>All API calls are made directly from your browser</li>
                  <li>Your data and API keys never pass through our servers</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="providers" className="space-y-4">
          <div className="grid gap-4">
            {Object.entries(providers).map(([key, provider]) => (
              <Card key={key}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-purple-500" />
                    {provider.name}
                  </CardTitle>
                  <CardDescription>{provider.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {provider.supportsImages && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          Supports Images
                        </span>
                      )}
                      {provider.supportsStreaming && (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                          Streaming
                        </span>
                      )}
                      {key === 'self-hosted' && (
                        <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
                          <Server className="h-3 w-3 inline mr-1" />
                          Self-Hosted
                        </span>
                      )}
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium mb-1">Available Models:</p>
                      <div className="flex flex-wrap gap-1">
                        {provider.models.map((model) => (
                          <span key={model.value} className="text-xs bg-muted px-2 py-1 rounded">
                            {model.label}
                          </span>
                        ))}
                      </div>
                    </div>

                    {provider.apiKeyUrl && (
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
    </div>
  )
}