import { NossieAnalysisRequest } from '@/types/nossie'
import { NOSSIE_MAX_CONTEXT_LENGTH } from '@/config/nossie'
import { BIG_RELAY_URLS } from '@/constants'
import { getProfileFromEvent } from '@/lib/event-metadata'
import { formatPubkey, pubkeyToNpub } from '@/lib/pubkey'
import client from '@/services/client.service'
import { kinds } from 'nostr-tools'

// Simple username cache to avoid repeated fetches
const usernameCache = new Map<string, string>()

// Helper function to safely parse JSON and get username
function safeParseProfile(content: string): string | null {
  try {
    // First, try to validate that it's proper JSON
    const trimmed = content.trim()
    if (!trimmed.startsWith('{') || !trimmed.endsWith('}')) {
      console.log(`[Nossie] Invalid JSON format: ${trimmed.substring(0, 50)}...`)
      return null
    }
    
    const profileObj = JSON.parse(trimmed)
    
    // Extract username safely
    const username = 
      profileObj.display_name?.trim() ||
      profileObj.name?.trim() ||
      profileObj.nip05?.split('@')[0]?.trim()
    
    if (username && typeof username === 'string' && username.length > 0) {
      // Validate that the username doesn't contain weird characters
      if (/^[\p{L}\p{N}\p{M}\p{P}\p{S}\s]+$/u.test(username)) {
        return username
      }
    }
    
    return null
  } catch (error) {
    console.log(`[Nossie] JSON parse error:`, error)
    return null
  }
}

// Helper function to get username from pubkey
async function getUsername(pubkey: string): Promise<string> {
  try {
    // Check cache first
    if (usernameCache.has(pubkey)) {
      const cached = usernameCache.get(pubkey)!
      console.log(`[Nossie] Using cached username for ${pubkey}: ${cached}`)
      return cached
    }

    console.log(`[Nossie] Getting username for pubkey: ${pubkey}`)

    // Try to fetch profile event (kind 0) from relays
    const profileEvents = await client.fetchEvents(BIG_RELAY_URLS, {
      kinds: [kinds.Metadata],
      authors: [pubkey],
      limit: 1
    })

    if (profileEvents.length > 0) {
      const profileEvent = profileEvents[0]
      console.log(`[Nossie] Found profile event for ${pubkey}`)
      
      // Try to parse the profile content safely
      const username = safeParseProfile(profileEvent.content)
      if (username) {
        console.log(`[Nossie] Using username: ${username}`)
        usernameCache.set(pubkey, username)
        return username
      }
    }

    // Fallback to clean formatted pubkey
    const fallback = formatPubkey(pubkey)
    console.log(`[Nossie] Using fallback username: ${fallback}`)
    usernameCache.set(pubkey, fallback)
    return fallback
  } catch (error) {
    console.log(`[Nossie] Error getting username for ${pubkey}:`, error)
    const fallback = formatPubkey(pubkey)
    usernameCache.set(pubkey, fallback)
    return fallback
  }
}

export async function formatThreadContext(request: NossieAnalysisRequest): Promise<string> {
  let context = '### THREAD CONTEXT ###\n\n'

  console.log(`[Nossie] Formatting thread context for main author: ${request.authorPubkey}`)

  // Get usernames for all pubkeys
  const [mainAuthorUsername, ...parentUsernames, ...replyUsernames, ...recentAuthorUsernames] = await Promise.all([
    getUsername(request.authorPubkey),
    ...request.threadContext?.parentPosts.map(post => getUsername(post.author)) || [],
    ...request.threadContext?.replies.map(reply => getUsername(reply.author)) || [],
    ...request.threadContext?.authorRecentPosts.map(post => getUsername(post.author)) || []
  ])

  console.log(`[Nossie] Main author username: ${mainAuthorUsername}`)

  // Add parent posts
  if (request.threadContext?.parentPosts.length) {
    context += 'PARENT POSTS:\n'
    request.threadContext.parentPosts.forEach((post, index) => {
      const username = parentUsernames[index] || formatPubkey(post.author)
      context += `Parent ${index + 1} (by ${username}):\n${post.content}\n\n`
    })
  }

  // Add the main post being analyzed
  context += `MAIN POST (by ${mainAuthorUsername}):\n${request.content}\n\n`

  // Add replies
  if (request.threadContext?.replies.length) {
    context += 'REPLIES:\n'
    request.threadContext.replies.forEach((reply, index) => {
      const username = replyUsernames[index] || formatPubkey(reply.author)
      context += `Reply ${index + 1} (by ${username}):\n${reply.content}\n\n`
    })
  }

  // Add author's recent posts
  if (request.threadContext?.authorRecentPosts.length) {
    context += 'AUTHOR RECENT POSTS (last 7 days):\n'
    request.threadContext.authorRecentPosts.forEach((post, index) => {
      const username = recentAuthorUsernames[index] || formatPubkey(post.author)
      context += `Recent post ${index + 1} (by ${username}):\n${post.content}\n\n`
    })
  }

  // Truncate context if it's too long
  if (context.length > NOSSIE_MAX_CONTEXT_LENGTH) {
    context = context.substring(0, NOSSIE_MAX_CONTEXT_LENGTH) + '...[context truncated]'
  }

  console.log(`[Nossie] Final context length: ${context.length} characters`)
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