export interface NossieConfig {
  provider: 'openai' | 'anthropic' | 'google' | 'groq' | 'openrouter' | 'self-hosted'
  apiKey?: string
  model: string
  baseUrl?: string
}

export interface NossieMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

export interface NossieConversation {
  id: string
  eventId: string
  messages: NossieMessage[]
  createdAt: number
  updatedAt: number
}

export interface NossieAnalysisRequest {
  eventId: string
  content: string
  authorPubkey: string
  threadContext?: {
    parentPosts: Array<{
      id: string
      content: string
      author: string
      timestamp: number
    }>
    replies: Array<{
      id: string
      content: string
      author: string
      timestamp: number
    }>
    authorRecentPosts: Array<{
      id: string
      content: string
      timestamp: number
    }>
  }
  searchWebContext?: boolean
}

export interface NossieAnalysisResponse {
  content: string
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
}

export interface NossieTestConfigRequest {
  config: NossieConfig
}

export interface NossieTestConfigResponse {
  success: boolean
  message: string
  models?: string[]
}