import { NossieAnalysisRequest } from '@/types/nossie'
import { NOSSIE_MAX_CONTEXT_LENGTH } from '@/config/nossie'

export function formatThreadContext(request: NossieAnalysisRequest): string {
  let context = '### THREAD CONTEXT ###\n\n'
  
  // Add parent posts
  if (request.threadContext?.parentPosts.length) {
    context += 'PARENT POSTS:\n'
    request.threadContext.parentPosts.forEach((post, index) => {
      context += `Parent ${index + 1} (by ${post.author}):\n${post.content}\n\n`
    })
  }
  
  // Add the main post being analyzed
  context += `MAIN POST (by ${request.authorPubkey}):\n${request.content}\n\n`
  
  // Add replies
  if (request.threadContext?.replies.length) {
    context += 'REPLIES:\n'
    request.threadContext.replies.forEach((reply, index) => {
      context += `Reply ${index + 1} (by ${reply.author}):\n${reply.content}\n\n`
    })
  }
  
  // Add author's recent posts
  if (request.threadContext?.authorRecentPosts.length) {
    context += 'AUTHOR RECENT POSTS (last 7 days):\n'
    request.threadContext.authorRecentPosts.forEach((post, index) => {
      context += `Recent post ${index + 1}:\n${post.content}\n\n`
    })
  }
  
  // Truncate context if it's too long
  if (context.length > NOSSIE_MAX_CONTEXT_LENGTH) {
    context = context.substring(0, NOSSIE_MAX_CONTEXT_LENGTH) + '...[context truncated]'
  }
  
  return context
}

export function buildAnalysisPrompt(request: NossieAnalysisRequest): string {
  const threadContext = formatThreadContext(request)
  
  let prompt = `${threadContext}`
  
  if (request.searchWebContext) {
    prompt += '\n\nPlease also search for relevant web context to provide additional insights.'
  }
  
  prompt += '\n\nPlease analyze this Nostr post and its thread context thoroughly.'
  
  return prompt
}

export function buildFollowUpPrompt(
  previousMessages: Array<{ role: string; content: string }>,
  userMessage: string
): string {
  const conversationHistory = previousMessages
    .slice(-6) // Keep last 6 messages for context
    .map(msg => `${msg.role === 'user' ? 'User' : 'Nossie'}: ${msg.content}`)
    .join('\n\n')
  
  return `CONVERSATION HISTORY:\n${conversationHistory}\n\nUSER: ${userMessage}\n\nPlease provide a thoughtful follow-up response to continue this conversation.`
}

export function validateNossieResponse(content: string): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  // Check if response ends with the required phrase
  if (!content.trim().endsWith('Would you like me to...')) {
    errors.push('Response must end with "Would you like me to..."')
  }
  
  // Check for section headings (should not exist)
  const headingPattern = /^(#{1,6}\s+.*|^[A-Z][A-Z\s]+:)$/gm
  if (headingPattern.test(content)) {
    errors.push('Response should not contain section headings or titles')
  }
  
  // Check for Bitcoin/crypto terminology
  if (content.toLowerCase().includes('bitcoin is crypto') || content.toLowerCase().includes('bitcoin as crypto')) {
    errors.push('Response should not refer to Bitcoin as crypto')
  }
  
  // Check length (100-200 words for initial response)
  const wordCount = content.split(/\s+/).length
  if (wordCount > 400) {
    errors.push('Response should be concise (100-200 words for initial, 200-400 for follow-ups)')
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}