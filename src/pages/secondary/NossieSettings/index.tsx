import { forwardRef } from 'react'
import SecondaryPageLayout from '@/layouts/SecondaryPageLayout'
import { useNossie } from '@/hooks/useNossie'
import { NOSSIE_SUPPORTED_PROVIDERS } from '@/config/nossie'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, AlertCircle, Loader2, Sparkles } from 'lucide-react'
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
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)

  const provider = NOSSIE_SUPPORTED_PROVIDERS[selectedProvider]

  const handleSave = () => {
    updateConfig({
      apiKey,
      provider: selectedProvider,
      model: selectedModel
    })
  }

  const handleTest = async () => {
    try {
      setTestResult(null)
      const result = await testConfig({
        config: {
          provider: selectedProvider,
          apiKey,
          model: selectedModel
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

  const isFormValid = apiKey.trim() !== '' && selectedModel !== ''

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
              <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                <SelectTrigger>
                  <SelectValue placeholder="Select provider" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(NOSSIE_SUPPORTED_PROVIDERS).map(([key, provider]) => (
                    <SelectItem key={key} value={key}>
                      {provider.name}
                    </SelectItem>
                  ))}
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

            <div className="space-y-2">
              <Label htmlFor="apiKey">API Key</Label>
              <Input
                id="apiKey"
                type="password"
                placeholder="Enter your API key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                Your API key is stored locally and never sent to any server except the AI provider.
              </p>
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={handleSave}
                disabled={!isFormValid}
                className="flex-1"
              >
                Save Configuration
              </Button>
              <Button 
                variant="outline" 
                onClick={handleTest}
                disabled={!isFormValid || isTesting}
              >
                {isTesting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Testing
                  </>
                ) : (
                  'Test Configuration'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {testResult && (
          <Alert variant={testResult.success ? "default" : "destructive"}>
            {testResult.success ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <AlertDescription>
              {testResult.message}
            </AlertDescription>
          </Alert>
        )}

        {testError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {testError instanceof Error ? testError.message : 'Configuration test failed'}
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>About Nossie AI</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Nossie is a helpful, maximally truthful, and slightly wise-ass AI that analyzes Nostr posts 
              with full thread context. It reads parent posts, replies, and the author's recent activity 
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
                  <strong>Environment Variable:</strong> You can also set{" "}
                  <code className="bg-muted px-1 py-0.5 rounded">NEXT_PUBLIC_OPENAI_API_KEY</code>
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </SecondaryPageLayout>
  )
})