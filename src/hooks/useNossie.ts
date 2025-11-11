import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, useCallback } from 'react'
import { NossieAnalysisRequest, NossieAnalysisResponse, NossieConfig, NossieConversation, NossieTestConfigRequest, NossieTestConfigResponse } from '@/types/nossie'
import { NOSSIE_DEFAULT_CONFIG, NOSSIE_SUPPORTED_PROVIDERS, NOSSIE_SYSTEM_PROMPT, NOSSIE_API_TIMEOUT } from '@/config/nossie'
import { buildAnalysisPrompt, buildFollowUpPrompt, validateNossieResponse } from '@/lib/nossiePrompts'
import { useNostr } from '@/providers/NostrProvider'
import { Event, kinds } from 'nostr-tools'

const STORAGE_KEYS = {
  CONFIG: 'nossie_config',
  CONVERSATIONS: 'nossie_conversations'
}

export function useNossie() {
  const queryClient = useQueryClient()
  const { nostr } = useNostr()
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
    if (!nostr) throw new Error('Nostr client not available')

    const sevenDaysAgo = Math.floor(Date.now() / 1000) - 7 * 24 * 60 * 60

    try {
      // Get the main event
      const mainEvent = await nostr.fetchEvent(eventId)
      if (!mainEvent) throw new Error('Event not found')

      // Fetch parent posts using 'e' tags
      const parentPosts: Array<{ id: string; content: string; author: string; timestamp: number }> = []
      const parentTags = mainEvent.tags.filter(tag => tag[0] === 'e' && tag[3] !== 'reply')

      for (const tag of parentTags) {
        try {
          const parentEvent = await nostr.fetchEvent(tag[1])
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
        const replyEvents = await nostr.fetchEvents({
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
        const authorEvents = await nostr.fetchEvents({
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
  }, [nostr])

  // Test API configuration
  const testConfigMutation = useMutation({
    mutationFn: async (request: NossieTestConfigRequest): Promise<NossieTestConfigResponse> => {
      const { config } = request

      if (!config.apiKey) {
        return {
          success: false,
          message: 'API key is required'
        }
      }

      try {
        if (config.provider === 'openai') {
          const response = await fetch(`${config.baseUrl || NOSSIE_SUPPORTED_PROVIDERS.openai.baseUrl}/chat/completions`, {
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

          if (!response.ok) {
            const error = await response.json()
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
        } else {
          return {
            success: false,
            message: `${config.provider} provider not yet implemented`
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
      if (!config.apiKey) {
        throw new Error('AI not configured. Please set up your API key in settings.')
      }

      // Fetch thread context if not provided
      let threadContext = request.threadContext
      if (!threadContext) {
        threadContext = await fetchThreadContext(request.eventId, request.authorPubkey)
      }

      const prompt = buildAnalysisPrompt({ ...request, threadContext })

      try {
        if (config.provider === 'openai') {
          const response = await fetch(`${config.baseUrl || NOSSIE_SUPPORTED_PROVIDERS.openai.baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${config.apiKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model: config.model,
              messages: [
                { role: 'system', content: NOSSIE_SYSTEM_PROMPT },
                { role: 'user', content: prompt }
              ],
              max_tokens: 1000,
              temperature: 0.7
            }),
            signal: AbortSignal.timeout(NOSSIE_API_TIMEOUT)
          })

          if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error?.message || 'Failed to get AI response')
          }

          const data = await response.json()
          const content = data.choices[0]?.message?.content || ''

          // Validate response
          const validation = validateNossieResponse(content)
          if (!validation.valid) {
            console.warn('Nossie response validation errors:', validation.errors)
          }

          return {
            content,
            usage: data.usage
          }
        } else {
          throw new Error(`${config.provider} provider not yet implemented`)
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
      if (!config.apiKey) {
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
        if (config.provider === 'openai') {
          const response = await fetch(`${config.baseUrl || NOSSIE_SUPPORTED_PROVIDERS.openai.baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${config.apiKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model: config.model,
              messages: [
                { role: 'system', content: NOSSIE_SYSTEM_PROMPT },
                ...previousMessages,
                { role: 'user', content: prompt }
              ],
              max_tokens: 1500,
              temperature: 0.7
            }),
            signal: AbortSignal.timeout(NOSSIE_API_TIMEOUT)
          })

          if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error?.message || 'Failed to get AI response')
          }

          const data = await response.json()
          const content = data.choices[0]?.message?.content || ''

          return {
            content,
            usage: data.usage
          }
        } else {
          throw new Error(`${config.provider} provider not yet implemented`)
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