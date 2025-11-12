import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, useCallback } from 'react'
import { NossieAnalysisRequest, NossieAnalysisResponse, NossieConfig, NossieConversation, NossieTestConfigRequest, NossieTestConfigResponse } from '@/types/nossie'
import { NOSSIE_DEFAULT_CONFIG, NOSSIE_SUPPORTED_PROVIDERS, NOSSIE_SYSTEM_PROMPT, NOSSIE_API_TIMEOUT } from '@/config/nossie'
import { buildAnalysisPrompt, buildFollowUpPrompt, formatThreadContext, validateNossieResponse } from '@/config/nossie'
import client from '@/services/client.service'
import { BIG_RELAY_URLS } from '@/constants'
import { Event, kinds } from 'nostr-tools'

const STORAGE_KEYS = {
  CONFIG: 'nossie_config',
  CONVERSATIONS: 'nossie_conversations'
}

export function useNossie() {
  const queryClient = useQueryClient()
  const [config, setConfig] = useState<NossieConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CONFIG)
      return saved ? { ...NOSSIE_DEFAULT_CONFIG, ...JSON.parse(saved) } : NOSSIE_DEFAULT_CONFIG
    } catch {
      return NOSSIE_DEFAULT_CONFIG
    }
  })

  // Save config to localStorage whenever it changes
  const updateConfig = useCallback((newConfig: Partial<NossieConfig>) => {
    const updated = { ...config, ...newConfig }
    setConfig(updated)
    try {
      localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(updated))
    } catch (error) {
      console.error('Failed to save Nossie config:', error)
    }
  }, [config])

  // Load conversations from localStorage
  const { data: conversations = [] } = useQuery({
    queryKey: ['nossie-conversations'],
    queryFn: () => {
      try {
        const saved = localStorage.getItem(STORAGE_KEYS.CONVERSATIONS)
        return saved ? JSON.parse(saved) : []
      } catch {
        return []
      }
    },
    initialData: []
  })

  // Save conversations to localStorage
  const saveConversations = useCallback((updatedConversations: NossieConversation[]) => {
    try {
      localStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(updatedConversations))
      queryClient.setQueryData(['nossie-conversations'], updatedConversations)
    } catch (error) {
      console.error('Failed to save Nossie conversations:', error)
    }
  }, [queryClient])

  // Fetch thread context
  const fetchThreadContext = useCallback(async (eventId: string, authorPubkey: string) => {
    if (!client) throw new Error('Nostr client not available')

    const sevenDaysAgo = Math.floor(Date.now() / 1000) - 7 * 24 * 60 * 60

    try {
      // Get the main event
      const mainEvent = await client.fetchEvent(eventId)
      if (!mainEvent) throw new Error('Event not found')

      // Fetch parent posts using 'e' tags
      const parentPosts: Array<{ id: string; content: string; author: string; timestamp: number }> = []
      const parentTags = mainEvent.tags.filter(tag => tag[0] === 'e' && tag[3] !== 'reply')

      for (const tag of parentTags) {
        try {
          const parentEvent = await client.fetchEvent(tag[1])
          if (parentEvent) {
            parentPosts.push({
              id: parentEvent.id,
              content: parentEvent.content,
              author: parentEvent.pubkey,
              timestamp: parentEvent.created_at
            })
          }
        } catch (error) {
          console.warn('Failed to fetch parent post:', error)
        }
      }

      // Fetch replies using '#e' filter
      const replies: Array<{ id: string; content: string; author: string; timestamp: number }> = []
      try {
        const replyEvents = await client.fetchEvents(BIG_RELAY_URLS, {
          kinds: [kinds.ShortTextNote, kinds.Repost],
          '#e': [eventId],
          since: sevenDaysAgo,
          limit: 20
        })

        replyEvents.forEach(event => {
          replies.push({
            id: event.id,
            content: event.content,
            author: event.pubkey,
            timestamp: event.created_at
          })
        })
      } catch (error) {
        console.warn('Failed to fetch replies:', error)
      }

      // Fetch author's recent posts
      const authorRecentPosts: Array<{ id: string; content: string; timestamp: number }> = []
      try {
        const authorEvents = await client.fetchEvents(BIG_RELAY_URLS, {
          kinds: [kinds.ShortTextNote],
          authors: [authorPubkey],
          since: sevenDaysAgo,
          limit: 10
        })

        authorEvents.forEach(event => {
          if (event.id !== eventId) { // Exclude the main post
            authorRecentPosts.push({
              id: event.id,
              content: event.content,
              timestamp: event.created_at
            })
          }
        })
      } catch (error) {
        console.warn('Failed to fetch author recent posts:', error)
      }

      return {
        parentPosts,
        replies,
        authorRecentPosts
      }
    } catch (error) {
      console.error('Error fetching thread context:', error)
      throw error
    }
  }, [])

  // Test API configuration
  const testConfigMutation = useMutation({
    mutationFn: async (request: NossieTestConfigRequest): Promise<NossieTestConfigResponse> => {
      const { config } = request

      if (!config.apiKey && config.provider !== 'self-hosted') {
        return {
          success: false,
          message: 'API key is required'
        }
      }

      if (config.provider === 'self-hosted' && !config.baseUrl) {
        return {
          success: false,
          message: 'Base URL is required for self-hosted providers'
        }
      }

      try {
        switch (config.provider) {
          case 'openai':
            const openaiResponse = await fetch(`${config.baseUrl || NOSSIE_SUPPORTED_PROVIDERS.openai.baseUrl}/chat/completions`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${config.apiKey}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                model: config.model,
                messages: [{ role: 'user', content: 'test' }],
                max_tokens: 10
              }),
              signal: AbortSignal.timeout(NOSSIE_API_TIMEOUT)
            })

            if (!openaiResponse.ok) {
              const error = await openaiResponse.json()
              return {
                success: false,
                message: error.error?.message || 'Failed to connect to OpenAI'
              }
            }

            return {
              success: true,
              message: 'Configuration test successful',
              models: NOSSIE_SUPPORTED_PROVIDERS.openai.models
            }

          case 'anthropic':
            const anthropicResponse = await fetch(`${config.baseUrl || NOSSIE_SUPPORTED_PROVIDERS.anthropic.baseUrl}/messages`, {
              method: 'POST',
              headers: {
                'x-api-key': config.apiKey,
                'anthropic-version': '2023-06-01',
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                model: config.model,
                max_tokens: 10,
                messages: [{ role: 'user', content: 'test' }]
              }),
              signal: AbortSignal.timeout(NOSSIE_API_TIMEOUT)
            })

            if (!anthropicResponse.ok) {
              const error = await anthropicResponse.json()
              return {
                success: false,
                message: error.error?.message || 'Failed to connect to Anthropic'
              }
            }

            return {
              success: true,
              message: 'Configuration test successful',
              models: NOSSIE_SUPPORTED_PROVIDERS.anthropic.models
            }

          case 'google':
            const googleResponse = await fetch(`${config.baseUrl || NOSSIE_SUPPORTED_PROVIDERS.google.baseUrl}/models/${config.model}:generateContent?key=${config.apiKey}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                contents: [{ parts: [{ text: 'test' }] }],
                generationConfig: {
                  maxOutputTokens: 10
                }
              }),
              signal: AbortSignal.timeout(NOSSIE_API_TIMEOUT)
            })

            if (!googleResponse.ok) {
              const error = await googleResponse.json()
              return {
                success: false,
                message: error.error?.message || 'Failed to connect to Google'
              }
            }

            return {
              success: true,
              message: 'Configuration test successful',
              models: NOSSIE_SUPPORTED_PROVIDERS.google.models
            }

          case 'groq':
            const groqResponse = await fetch(`${config.baseUrl || NOSSIE_SUPPORTED_PROVIDERS.groq.baseUrl}/chat/completions`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${config.apiKey}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                model: config.model,
                messages: [{ role: 'user', content: 'test' }],
                max_tokens: 10
              }),
              signal: AbortSignal.timeout(NOSSIE_API_TIMEOUT)
            })

            if (!groqResponse.ok) {
              const error = await groqResponse.json()
              return {
                success: false,
                message: error.error?.message || 'Failed to connect to Groq'
              }
            }

            return {
              success: true,
              message: 'Configuration test successful',
              models: NOSSIE_SUPPORTED_PROVIDERS.groq.models
            }

          case 'openrouter':
            const openrouterResponse = await fetch(`${config.baseUrl || NOSSIE_SUPPORTED_PROVIDERS.openrouter.baseUrl}/chat/completions`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${config.apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': window.location.origin,
                'X-Title': 'Jumble'
              },
              body: JSON.stringify({
                model: config.model,
                messages: [{ role: 'user', content: 'test' }],
                max_tokens: 10
              }),
              signal: AbortSignal.timeout(NOSSIE_API_TIMEOUT)
            })

            if (!openrouterResponse.ok) {
              const error = await openrouterResponse.json()
              return {
                success: false,
                message: error.error?.message || 'Failed to connect to OpenRouter'
              }
            }

            return {
              success: true,
              message: 'Configuration test successful',
              models: NOSSIE_SUPPORTED_PROVIDERS.openrouter.models
            }

          case 'self-hosted':
            const baseUrl = config.baseUrl.replace(/\/$/, '')
            const testEndpoints = [
              `${baseUrl}/v1/chat/completions`,
              `${baseUrl}/api/chat/completions`,
              `${baseUrl}/api/chat`,
              `${baseUrl}/chat/completions`
            ]

            let testSuccess = false
            let testMessage = ''

            for (const endpoint of testEndpoints) {
              try {
                const selfHostedResponse = await fetch(endpoint, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    ...(config.apiKey && { 'Authorization': `Bearer ${config.apiKey}` })
                  },
                  body: JSON.stringify({
                    model: config.model,
                    messages: [{ role: 'user', content: 'test' }],
                    max_tokens: 10,
                    stream: false
                  }),
                  signal: AbortSignal.timeout(10000) // Shorter timeout for tests
                })

                if (selfHostedResponse.ok) {
                  testSuccess = true
                  testMessage = `Successfully connected to ${endpoint}`
                  break
                }
              } catch (error) {
                console.warn(`Test endpoint ${endpoint} failed:`, error)
                continue
              }
            }

            if (!testSuccess) {
              return {
                success: false,
                message: 'Failed to connect to self-hosted instance. Ensure server is running and CORS is enabled.'
              }
            }

            return {
              success: true,
              message: testMessage,
              models: NOSSIE_SUPPORTED_PROVIDERS['self-hosted'].models
            }

          default:
            return {
              success: false,
              message: `${config.provider} provider not supported`
            }
        }
      } catch (error) {
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Unknown error occurred'
        }
      }
    }
  })

  // Analyze post mutation
  const analyzePostMutation = useMutation({
    mutationFn: async (request: NossieAnalysisRequest): Promise<NossieAnalysisResponse> => {
      if (!config.apiKey && config.provider !== 'self-hosted') {
        throw new Error('AI not configured. Please set up your API key in settings.')
      }

      // Fetch thread context if not provided
      let threadContext = request.threadContext
      if (!threadContext) {
        threadContext = await fetchThreadContext(request.eventId, request.authorPubkey)
      }

      const prompt = await buildAnalysisPrompt({ ...request, threadContext })

      try {
        let response: Response
        let data: any
        let content: string

        switch (config.provider) {
          case 'openai':
            response = await callOpenAIAPI(config, prompt)
            data = await response.json()
            content = data.choices[0]?.message?.content || ''
            break

          case 'anthropic':
            response = await callAnthropicAPI(config, prompt)
            data = await response.json()
            content = data.content[0]?.text || ''
            break

          case 'google':
            response = await callGoogleAPI(config, prompt)
            data = await response.json()
            content = data.candidates[0]?.content?.parts[0]?.text || ''
            break

          case 'groq':
            response = await callGroqAPI(config, prompt)
            data = await response.json()
            content = data.choices[0]?.message?.content || ''
            break

          case 'openrouter':
            response = await callOpenRouterAPI(config, prompt)
            data = await response.json()
            content = data.choices[0]?.message?.content || ''
            break

          case 'self-hosted':
            response = await callSelfHostedAPI(config, prompt)
            data = await response.json()
            content = data.choices[0]?.message?.content || ''
            break

          default:
            throw new Error(`${config.provider} provider not supported`)
        }

        // Validate response
        const validation = validateNossieResponse(content)
        if (!validation.valid) {
          console.warn('Nossie response validation errors:', validation.errors)
        }

        return {
          content,
          usage: data.usage || data.usageMetadata
        }
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          throw new Error('Request timed out. Please try again.')
        }
        throw error
      }
    },
    onSuccess: (data, variables) => {
      // Create or update conversation
      const conversationId = `conv_${variables.eventId}`
      const existingConversation = conversations.find(c => c.id === conversationId)

      const newMessage = {
        id: `msg_${Date.now()}`,
        role: 'assistant' as const,
        content: data.content,
        timestamp: Date.now()
      }

      let updatedConversations: NossieConversation[]

      if (existingConversation) {
        updatedConversations = conversations.map(conv =>
          conv.id === conversationId
            ? {
                ...conv,
                messages: [...conv.messages, newMessage],
                updatedAt: Date.now()
              }
            : conv
        )
      } else {
        const newConversation: NossieConversation = {
          id: conversationId,
          eventId: variables.eventId,
          messages: [newMessage],
          createdAt: Date.now(),
          updatedAt: Date.now()
        }
        updatedConversations = [...conversations, newConversation]
      }

      saveConversations(updatedConversations)
    }
  })

  // Send follow-up message mutation
  const sendFollowUpMutation = useMutation({
    mutationFn: async ({
      conversationId,
      message
    }: {
      conversationId: string
      message: string
    }): Promise<NossieAnalysisResponse> => {
      if (!config.apiKey && config.provider !== 'self-hosted') {
        throw new Error('AI not configured. Please set up your API key in settings.')
      }

      const conversation = conversations.find(c => c.id === conversationId)
      if (!conversation) {
        throw new Error('Conversation not found')
      }

      const previousMessages = conversation.messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }))

      const prompt = buildFollowUpPrompt(previousMessages, message)

      try {
        let response: Response
        let data: any
        let content: string

        switch (config.provider) {
          case 'openai':
            response = await callOpenAIAPI(config, prompt, true)
            data = await response.json()
            content = data.choices[0]?.message?.content || ''
            break

          case 'anthropic':
            response = await callAnthropicAPI(config, prompt, true)
            data = await response.json()
            content = data.content[0]?.text || ''
            break

          case 'google':
            response = await callGoogleAPI(config, prompt, true)
            data = await response.json()
            content = data.candidates[0]?.content?.parts[0]?.text || ''
            break

          case 'groq':
            response = await callGroqAPI(config, prompt, true)
            data = await response.json()
            content = data.choices[0]?.message?.content || ''
            break

          case 'openrouter':
            response = await callOpenRouterAPI(config, prompt, true)
            data = await response.json()
            content = data.choices[0]?.message?.content || ''
            break

          case 'self-hosted':
            response = await callSelfHostedAPI(config, prompt, true)
            data = await response.json()
            content = data.choices[0]?.message?.content || ''
            break

          default:
            throw new Error(`${config.provider} provider not supported`)
        }

        return {
          content,
          usage: data.usage || data.usageMetadata
        }
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          throw new Error('Request timed out. Please try again.')
        }
        throw error
      }
    },
    onSuccess: (data, variables) => {
      const { conversationId, message } = variables

      // Add user message
      const userMessage = {
        id: `msg_${Date.now()}`,
        role: 'user' as const,
        content: message,
        timestamp: Date.now()
      }

      // Add assistant response
      const assistantMessage = {
        id: `msg_${Date.now() + 1}`,
        role: 'assistant' as const,
        content: data.content,
        timestamp: Date.now() + 1
      }

      const updatedConversations = conversations.map(conv =>
        conv.id === conversationId
          ? {
              ...conv,
              messages: [...conv.messages, userMessage, assistantMessage],
              updatedAt: Date.now()
            }
          : conv
      )

      saveConversations(updatedConversations)
    }
  })

  // API implementation functions
  const callOpenAIAPI = async (config: NossieConfig, prompt: string, isFollowUp = false): Promise<Response> => {
    const messages = isFollowUp
      ? [
          { role: 'system', content: NOSSIE_SYSTEM_PROMPT },
          ...JSON.parse(prompt.replace(/CONVERSATION HISTORY:\n\n/, '').replace(/USER:\s*/, '').replace(/\n\nPlease provide a thoughtful follow-up response to continue this conversation./, ''))
        ]
      : [
          { role: 'system', content: NOSSIE_SYSTEM_PROMPT },
          { role: 'user', content: prompt }
        ]

    const response = await fetch(`${config.baseUrl || NOSSIE_SUPPORTED_PROVIDERS.openai.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: config.model,
        messages,
        max_tokens: isFollowUp ? 1500 : 1000,
        temperature: 0.7
      }),
      signal: AbortSignal.timeout(NOSSIE_API_TIMEOUT)
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || 'Failed to get AI response')
    }

    return response
  }

  const callAnthropicAPI = async (config: NossieConfig, prompt: string, isFollowUp = false): Promise<Response> => {
    const messages = isFollowUp
      ? JSON.parse(prompt.replace(/CONVERSATION HISTORY:\n\n/, '').replace(/USER:\s*/, '').replace(/\n\nPlease provide a thoughtful follow-up response to continue this conversation./, ''))
      : [{ role: 'user', content: prompt }]

    const response = await fetch(`${config.baseUrl || NOSSIE_SUPPORTED_PROVIDERS.anthropic.baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'x-api-key': config.apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: config.model,
        max_tokens: isFollowUp ? 1500 : 1000,
        system: NOSSIE_SYSTEM_PROMPT,
        messages
      }),
      signal: AbortSignal.timeout(NOSSIE_API_TIMEOUT)
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || 'Failed to get AI response')
    }

    return response
  }

  const callGoogleAPI = async (config: NossieConfig, prompt: string, isFollowUp = false): Promise<Response> => {
    const text = isFollowUp
      ? `${NOSSIE_SYSTEM_PROMPT}\n\n${prompt.replace(/CONVERSATION HISTORY:\n\n/, '').replace(/USER:\s*/, '').replace(/\n\nPlease provide a thoughtful follow-up response to continue this conversation./, '')}`
      : `${NOSSIE_SYSTEM_PROMPT}\n\n${prompt}`

    const response = await fetch(`${config.baseUrl || NOSSIE_SUPPORTED_PROVIDERS.google.baseUrl}/models/${config.model}:generateContent?key=${config.apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          role: 'user',
          parts: [{ text }]
        }],
        generationConfig: {
          maxOutputTokens: isFollowUp ? 1500 : 1000,
          temperature: 0.7
        }
      }),
      signal: AbortSignal.timeout(NOSSIE_API_TIMEOUT)
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || 'Failed to get AI response')
    }

    return response
  }

  const callGroqAPI = async (config: NossieConfig, prompt: string, isFollowUp = false): Promise<Response> => {
    const messages = isFollowUp
      ? [
          { role: 'system', content: NOSSIE_SYSTEM_PROMPT },
          ...JSON.parse(prompt.replace(/CONVERSATION HISTORY:\n\n/, '').replace(/USER:\s*/, '').replace(/\n\nPlease provide a thoughtful follow-up response to continue this conversation./, ''))
        ]
      : [
          { role: 'system', content: NOSSIE_SYSTEM_PROMPT },
          { role: 'user', content: prompt }
        ]

    const response = await fetch(`${config.baseUrl || NOSSIE_SUPPORTED_PROVIDERS.groq.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: config.model,
        messages,
        max_tokens: isFollowUp ? 1500 : 1000,
        temperature: 0.7
      }),
      signal: AbortSignal.timeout(NOSSIE_API_TIMEOUT)
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || 'Failed to get AI response')
    }

    return response
  }

  const callOpenRouterAPI = async (config: NossieConfig, prompt: string, isFollowUp = false): Promise<Response> => {
    const messages = isFollowUp
      ? [
          { role: 'system', content: NOSSIE_SYSTEM_PROMPT },
          ...JSON.parse(prompt.replace(/CONVERSATION HISTORY:\n\n/, '').replace(/USER:\s*/, '').replace(/\n\nPlease provide a thoughtful follow-up response to continue this conversation./, ''))
        ]
      : [
          { role: 'system', content: NOSSIE_SYSTEM_PROMPT },
          { role: 'user', content: prompt }
        ]

    const response = await fetch(`${config.baseUrl || NOSSIE_SUPPORTED_PROVIDERS.openrouter.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': window.location.origin,
        'X-Title': 'Jumble'
      },
      body: JSON.stringify({
        model: config.model,
        messages,
        max_tokens: isFollowUp ? 1500 : 1000,
        temperature: 0.7
      }),
      signal: AbortSignal.timeout(NOSSIE_API_TIMEOUT)
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || 'Failed to get AI response')
    }

    return response
  }

  const callSelfHostedAPI = async (config: NossieConfig, prompt: string, isFollowUp = false): Promise<Response> => {
    if (!config.baseUrl) {
      throw new Error('Base URL is required for self-hosted AI providers')
    }

    const messages = isFollowUp
      ? [
          { role: 'system', content: NOSSIE_SYSTEM_PROMPT },
          ...JSON.parse(prompt.replace(/CONVERSATION HISTORY:\n\n/, '').replace(/USER:\s*/, '').replace(/\n\nPlease provide a thoughtful follow-up response to continue this conversation./, ''))
        ]
      : [
          { role: 'system', content: NOSSIE_SYSTEM_PROMPT },
          { role: 'user', content: prompt }
        ]

    // Normalize base URL - remove trailing slash
    const baseUrl = config.baseUrl.replace(/\/$/, '')

    // Try multiple possible API endpoints for compatibility
    const endpoints = [
      `${baseUrl}/v1/chat/completions`,  // OpenAI standard
      `${baseUrl}/api/chat/completions`, // Open WebUI
      `${baseUrl}/api/chat`,              // Ollama
      `${baseUrl}/chat/completions`       // Alternative
    ]

    let lastError: Error | null = null

    // Try each endpoint until one works
    for (const endpoint of endpoints) {
      try {
        console.log(`🔧 Trying self-hosted endpoint: ${endpoint}`)

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(config.apiKey && { 'Authorization': `Bearer ${config.apiKey}` })
          },
          body: JSON.stringify({
            model: config.model,
            messages,
            max_tokens: isFollowUp ? 1500 : 1000,
            temperature: 0.7,
            stream: false // Explicitly disable streaming for now
          }),
          signal: AbortSignal.timeout(NOSSIE_API_TIMEOUT)
        })

        if (response.ok) {
          console.log(`✅ Self-hosted API success with endpoint: ${endpoint}`)
          return response
        }

        // Store error for logging but try next endpoint
        const errorData = await response.json().catch(() => ({ error: response.statusText }))
        console.warn(`⚠️ Endpoint ${endpoint} failed:`, errorData)
        lastError = new Error(errorData.error?.message || errorData.error || response.statusText)
      } catch (error) {
        console.warn(`⚠️ Endpoint ${endpoint} error:`, error)
        lastError = error instanceof Error ? error : new Error('Unknown error')
        continue
      }
    }

    // If all endpoints failed, throw the last error
    throw new Error(`Failed to connect to self-hosted API. Tried ${endpoints.length} endpoints. Last error: ${lastError?.message || 'Unknown error'}`)
  }

  // Get conversation by event ID
  const getConversation = useCallback((eventId: string) => {
    return conversations.find(c => c.eventId === eventId)
  }, [conversations])

  // Add user message to conversation (for optimistic updates)
  const addUserMessage = useCallback((conversationId: string, content: string) => {
    const userMessage = {
      id: `msg_${Date.now()}`,
      role: 'user' as const,
      content,
      timestamp: Date.now()
    }

    const updatedConversations = conversations.map(conv =>
      conv.id === conversationId
        ? {
            ...conv,
            messages: [...conv.messages, userMessage],
            updatedAt: Date.now()
          }
        : conv
    )

    saveConversations(updatedConversations)
  }, [conversations, saveConversations])

  return {
    config,
    updateConfig,
    conversations,
    getConversation,
    analyzePost: analyzePostMutation.mutateAsync,
    sendFollowUp: sendFollowUpMutation.mutateAsync,
    testConfig: testConfigMutation.mutateAsync,
    isAnalyzing: analyzePostMutation.isPending,
    isSendingFollowUp: sendFollowUpMutation.isPending,
    isTesting: testConfigMutation.isPending,
    analysisError: analyzePostMutation.error,
    followUpError: sendFollowUpMutation.error,
    testError: testConfigMutation.error,
    addUserMessage
  }
}