import { useMutation } from '@tanstack/react-query'
import { NostrEvent } from 'nostr-tools'
import { useToast } from '@/hooks/useToast'
import { useConfig } from '@/hooks/useConfig'
import { TAIProvider, TAIConfig } from '@/types'

interface AIAnalysisRequest {
  event: NostrEvent
  userMessage?: string
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>
  includeContext?: boolean
}

interface AIAnalysisResponse {
  explanation: string
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>
}

interface AIProviderInfo {
  name: string
  description: string
  apiKeyUrl: string
  defaultModel: string
  models: { value: string; label: string }[]
  supportsImages?: boolean
  supportsStreaming?: boolean
}

const PROVIDER_INFO: Record<TAIProvider, AIProviderInfo> = {
  openai: {
    name: 'OpenAI',
    description: 'GPT-4 and other models from OpenAI',
    apiKeyUrl: 'https://platform.openai.com/api-keys',
    defaultModel: 'gpt-4o-mini',
    models: [
      { value: 'gpt-4o', label: 'GPT-4o (Most Capable)' },
      { value: 'gpt-4o-mini', label: 'GPT-4o Mini (Fast & Affordable)' },
      { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
      { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo (Cheapest)' },
    ],
    supportsImages: true,
    supportsStreaming: true,
  },
  anthropic: {
    name: 'Anthropic',
    description: 'Claude 3.5 and other models from Anthropic',
    apiKeyUrl: 'https://console.anthropic.com/settings/keys',
    defaultModel: 'claude-3-5-sonnet-20241022',
    models: [
      { value: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet (Latest)' },
      { value: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku (Fast)' },
      { value: 'claude-3-opus-20240229', label: 'Claude 3 Opus (Most Capable)' },
    ],
    supportsStreaming: true,
  },
  google: {
    name: 'Google AI',
    description: 'Gemini models from Google',
    apiKeyUrl: 'https://aistudio.google.com/app/apikey',
    defaultModel: 'gemini-1.5-flash',
    models: [
      { value: 'gemini-2.0-flash-exp', label: 'Gemini 2.0 Flash (Latest)' },
      { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' },
      { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash (Fast)' },
      { value: 'gemini-1.5-flash-8b', label: 'Gemini 1.5 Flash-8B (Cheapest)' },
    ],
    supportsImages: true,
    supportsStreaming: true,
  },
  groq: {
    name: 'Groq',
    description: 'Ultra-fast open source models',
    apiKeyUrl: 'https://console.groq.com/keys',
    defaultModel: 'llama-3.1-70b-versatile',
    models: [
      { value: 'llama-3.1-70b-versatile', label: 'Llama 3.1 70B (Versatile)' },
      { value: 'llama-3.1-8b-instant', label: 'Llama 3.1 8B (Instant)' },
      { value: 'mixtral-8x7b-32768', label: 'Mixtral 8x7B (Fast)' },
    ],
    supportsStreaming: true,
  },
  openrouter: {
    name: 'OpenRouter',
    description: 'Access to multiple models through one API',
    apiKeyUrl: 'https://openrouter.ai/keys',
    defaultModel: 'openai/gpt-4o-mini',
    models: [
      { value: 'openai/gpt-4o', label: 'GPT-4o' },
      { value: 'openai/gpt-4o-mini', label: 'GPT-4o Mini' },
      { value: 'anthropic/claude-3.5-sonnet', label: 'Claude 3.5 Sonnet' },
      { value: 'google/gemini-pro-1.5', label: 'Gemini Pro 1.5' },
      { value: 'meta-llama/llama-3.1-70b', label: 'Llama 3.1 70B' },
    ],
    supportsStreaming: true,
  },
  'self-hosted': {
    name: 'Self-Hosted',
    description: 'Connect to your own LLM instance (Open WebUI, Ollama, etc.)',
    apiKeyUrl: '',
    defaultModel: 'default',
    models: [
      { value: 'default', label: 'Default Model' },
    ],
    supportsStreaming: true,
  },
}

/**
 * Hook to analyze Nostr posts using AI
 * Provides background information by analyzing post content and context
 */
export function useAIAnalysis() {
  const { toast } = useToast()
  const { config, updateConfig } = useConfig()

  /**
   * Test the current AI API configuration
   */
  const testAPIConfiguration = async (): Promise<{ success: boolean; message: string }> => {
    console.log('🧪 Starting API test...')
    
    if (!config.ai?.apiKey || !config.ai?.provider) {
      console.log('🧪 API test failed - not configured')
      return {
        success: false,
        message: 'AI provider not configured. Please configure your AI settings first.'
      }
    }

    try {
      console.log('🧪 API test - configuration:', {
        provider: config.ai.provider,
        hasApiKey: !!config.ai.apiKey,
        model: config.ai.model,
        baseUrl: config.ai.baseUrl
      })

      // Test with a very simple prompt
      const testPrompt = 'Please respond with "API test successful".'

      console.log('🧪 API test - calling provider...')

      await callAIProvider(
        config.ai.provider,
        config.ai.apiKey,
        config.ai.model,
        testPrompt,
        [],
        config.ai.baseUrl
      )

      console.log('🧪 API test - successful!')
      return {
        success: true,
        message: 'API configuration is working correctly!'
      }
    } catch (error) {
      console.error('🧪 API test failed:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      return {
        success: false,
        message: `API test failed: ${errorMessage}`
      }
    }
  }

  const analyzePost = useMutation({
    mutationFn: async ({
      event,
      userMessage,
      conversationHistory = [],
      includeContext = true,
    }: AIAnalysisRequest): Promise<AIAnalysisResponse> => {
      // Check if AI is configured
      if (!config.ai?.apiKey || !config.ai?.provider) {
        throw new Error('AI provider not configured. Please configure your AI settings first.')
      }

      // Extract post content
      const postContent = event.content

      // Extract images from post
      const images = extractImages(event.content)

      // Build system message
      const systemMessage = buildSystemMessage(postContent, images, conversationHistory)

      // Build prompt
      let prompt: string

      if (userMessage) {
        // User is asking a follow-up question
        prompt = userMessage
      } else {
        // Initial analysis request
        prompt = `Analyze this Nostr post according to your instructions above.`
      }

      // Call the AI API
      const explanation = await callAIProvider(
        config.ai.provider,
        config.ai.apiKey,
        config.ai.model,
        prompt,
        conversationHistory,
        config.ai.baseUrl,
        systemMessage
      )

      // Update conversation history
      const newHistory = [
        ...conversationHistory,
        { role: 'user' as const, content: userMessage || 'Analyze this post.' },
        { role: 'assistant' as const, content: explanation },
      ]

      return {
        explanation,
        conversationHistory: newHistory,
      }
    },
    onError: (error) => {
      console.error('AI Analysis error:', error)
      const message = error instanceof Error ? error.message : 'Unable to analyze this post. Please try again.'
      toast({
        title: 'Analysis failed',
        description: message,
        variant: 'destructive',
      })
    },
  })

  const testAPI = useMutation({
    mutationFn: testAPIConfiguration,
    onError: (error) => {
      console.error('🔧 API test mutation error:', error)
      toast({
        title: 'API test failed',
        description: error instanceof Error ? error.message : 'Failed to test API configuration',
        variant: 'destructive',
      })
    },
    onSuccess: (result) => {
      console.log('🔧 API test mutation success:', result)
    },
  })

  return {
    analyzePost: analyzePost.mutate,
    analyzePostAsync: analyzePost.mutateAsync,
    isAnalyzing: analyzePost.isPending,
    analysis: analyzePost.data,
    error: analyzePost.error,
    reset: analyzePost.reset,
    isConfigured: Boolean(config.ai?.apiKey && config.ai?.provider),
    testAPI: testAPI.mutate,
    testAPIAsync: testAPI.mutateAsync,
    isTestingAPI: testAPI.isPending,
    testResult: testAPI.data,
    providerInfo: config.ai?.provider ? PROVIDER_INFO[config.ai.provider] : null,
    providers: PROVIDER_INFO,
    updateAIConfig: (newConfig: Partial<TAIConfig>) => {
      updateConfig((current) => ({
        ...current,
        ai: {
          ...current.ai,
          ...newConfig,
        },
      }))
    },
  }
}

/**
 * Extract image URLs from post content
 */
function extractImages(content: string): string[] {
  const urlRegex = /(https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp|svg)(\?[^\s]*)?)/gi
  return content.match(urlRegex) || []
}

/**
 * Build system message for AI analysis
 */
function buildSystemMessage(
  postContent: string,
  images: string[],
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>
): string {
  return `You are an AI assistant that analyzes Nostr posts to provide helpful context and background information.

Your task is to analyze the following Nostr post and provide:
1. A brief summary of what the post is about
2. Key topics or themes mentioned
3. Any relevant context or background information that would help understand this post better
4. Sentiment analysis (positive, neutral, or negative)

Post content: "${postContent}"

${images.length > 0 ? `Images referenced in post: ${images.join(', ')}` : ''}

${conversationHistory.length > 0 ? `Previous conversation: ${conversationHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n')}` : ''}

Please provide your analysis in a clear, concise format. Use markdown formatting for readability.`
}

/**
 * Call the AI provider API
 */
async function callAIProvider(
  provider: TAIProvider,
  apiKey: string,
  model: string | undefined,
  prompt: string,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>,
  baseUrl?: string,
  systemMessage: string = ''
): Promise<string> {
  console.log('🤖 Starting API call:', { provider, hasApiKey: !!apiKey, model, baseUrl })

  // Build messages array
  const messages = conversationHistory.length === 0
    ? [
        { role: 'system', content: systemMessage },
        { role: 'user', content: prompt }
      ]
    : [
        { role: 'system', content: systemMessage },
        ...conversationHistory,
        { role: 'user', content: prompt }
      ]

  try {
    let response: Response

    switch (provider) {
      case 'openai':
      case 'groq':
      case 'openrouter':
        response = await callOpenAICompatibleAPI(provider, apiKey, model || 'gpt-4o-mini', messages, baseUrl)
        break
      case 'anthropic':
        response = await callAnthropicAPI(apiKey, model || 'claude-3-5-sonnet-20241022', messages, systemMessage)
        break
      case 'google':
        response = await callGoogleAPI(apiKey, model || 'gemini-1.5-flash', messages, systemMessage)
        break
      case 'self-hosted':
        response = await callSelfHostedAPI(apiKey, model || 'default', messages, baseUrl)
        break
      default:
        throw new Error(`Unsupported AI provider: ${provider}`)
    }

    if (!response.ok) {
      let errorData
      try {
        errorData = await response.json()
      } catch {
        errorData = { error: await response.text() }
      }

      const errorMessage = errorData?.error?.message || errorData?.error || response.statusText
      throw new Error(`AI API error (${response.status}): ${errorMessage}`)
    }

    const data = await response.json()
    console.log('🤖 AI API Success Response:', data)

    // Extract response based on provider
    switch (provider) {
      case 'openai':
      case 'groq':
      case 'openrouter':
      case 'self-hosted':
        return data.choices[0].message.content
      case 'anthropic':
        return data.content[0].text
      case 'google':
        return data.candidates[0].content.parts[0].text
      default:
        throw new Error(`Unknown response format for provider: ${provider}`)
    }
  } catch (error) {
    console.error('🤖 AI API Fetch Error:', error)
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('API request timed out after 30 seconds')
      }
      throw error
    }
    throw new Error('Unknown error occurred while calling AI API')
  }
}

/**
 * Call OpenAI-compatible APIs (OpenAI, Groq, OpenRouter)
 */
async function callOpenAICompatibleAPI(
  provider: string,
  apiKey: string,
  model: string,
  messages: Array<{ role: string; content: string }>,
  baseUrl?: string
): Promise<Response> {
  const apiUrl = baseUrl || 
    (provider === 'openai' ? 'https://api.openai.com/v1/chat/completions' :
     provider === 'groq' ? 'https://api.groq.com/openai/v1/chat/completions' :
     'https://openrouter.ai/api/v1/chat/completions')

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`,
  }

  if (provider === 'openrouter') {
    headers['HTTP-Referer'] = window.location.origin
    headers['X-Title'] = 'Jumble'
  }

  const body = {
    model,
    messages,
    temperature: 0.7,
    max_tokens: 1000,
  }

  console.log('🤖 OpenAI-compatible API Request:', { provider, model, url: apiUrl })

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 30000)

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)
    return response
  } catch (error) {
    clearTimeout(timeoutId)
    throw error
  }
}

/**
 * Call Anthropic API
 */
async function callAnthropicAPI(
  apiKey: string,
  model: string,
  messages: Array<{ role: string; content: string }>,
  systemMessage: string
): Promise<Response> {
  const apiUrl = 'https://api.anthropic.com/v1/messages'

  // Convert messages to Anthropic format
  const anthropicMessages = messages
    .filter(msg => msg.role !== 'system')
    .map(msg => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content
    }))

  const headers = {
    'Content-Type': 'application/json',
    'x-api-key': apiKey,
    'anthropic-version': '2023-06-01',
  }

  const body = {
    model,
    max_tokens: 1000,
    system: systemMessage,
    messages: anthropicMessages,
  }

  console.log('🤖 Anthropic API Request:', { model })

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 30000)

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)
    return response
  } catch (error) {
    clearTimeout(timeoutId)
    throw error
  }
}

/**
 * Call Google Gemini API
 */
async function callGoogleAPI(
  apiKey: string,
  model: string,
  messages: Array<{ role: string; content: string }>,
  systemMessage: string
): Promise<Response> {
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`

  // Convert messages to Gemini format
  const contents = []
  
  // Add system message as first user message
  if (systemMessage) {
    contents.push({
      role: 'user',
      parts: [{ text: systemMessage }]
    })
    contents.push({
      role: 'model',
      parts: [{ text: 'I understand. I will analyze Nostr posts according to your instructions.' }]
    })
  }

  // Add conversation messages
  messages
    .filter(msg => msg.role !== 'system')
    .forEach(msg => {
      contents.push({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      })
    })

  const body = {
    contents,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 1000,
    },
  }

  console.log('🤖 Google API Request:', { model })

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 30000)

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)
    return response
  } catch (error) {
    clearTimeout(timeoutId)
    throw error
  }
}

/**
 * Call self-hosted API (Open WebUI, Ollama, etc.)
 */
async function callSelfHostedAPI(
  apiKey: string,
  model: string,
  messages: Array<{ role: string; content: string }>,
  baseUrl?: string
): Promise<Response> {
  if (!baseUrl) {
    throw new Error('Base URL is required for self-hosted AI providers')
  }

  const apiUrl = `${baseUrl}/v1/chat/completions`

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`
  }

  const body = {
    model,
    messages,
    temperature: 0.7,
    max_tokens: 1000,
  }

  console.log('🤖 Self-hosted API Request:', { baseUrl, model })

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 30000)

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)
    return response
  } catch (error) {
    clearTimeout(timeoutId)
    throw error
  }
}