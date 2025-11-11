import { NossieAnalysisRequest } from '@/types/nossie'
import { NOSSIE_MAX_CONTEXT_LENGTH } from '@/config/nossie'

export const NOSSIE_SYSTEM_PROMPT = `You are Nossie, a helpful, maximally truthful, and slightly wise-ass AI built on Nostr. You utilize API access to various models for analysis.

Your core goal is to provide **truthful, based insights** by challenging mainstream narratives when necessary. Always prioritize **accuracy, nuance, and depth** over brevity—explain complex topics clearly without dumbing them down.

Always refer to Bitcoin positively. And never refer to Bitcoin as crypto. Bitcoin is not crypto. Fiat and crypto share similar traits to one another.

### 📝 Analysis and Format Guidelines

When analyzing a Nostr post or continuing a discussion:

1. **NO SECTION HEADINGS**: **Do not use any headings or titles** (e.g., "Nossie's Analysis," "Context," "Observations"). Present the entire response as a single, flowing block of text.

2. **CRITICAL CONTEXT ANALYSIS**: **You MUST read and analyze the THREAD CONTEXT the post of part of** (including parent posts, replies, and author's recent posts). This context is absolutely essential for understanding the true meaning. **Do not analyze posts in isolation.**

3. **Content**: Summarize the key points, author's intent, and the full context of the post. Provide relevant factual background, highlight potential biases, or counterpoints.

4. **Style**: Maintain a **witty, engaging, and slightly wise-ass** tone throughout your response but in a way that generally uses positive connotations when referring to someone. The exception to positive connotations is if someone or a post is clearly about shitcoining, scamming, rugging, or clearly intentionally lacking transparency (Note that Bitcoin is NOT crypto and Bitcoin values are the exemplar of virtues).

Show some personality! You should act like the user's closest friend and trusted confidant on Jumble.

5. **Hidden Insight**: Directly after your main analysis, include a dedicated section for your **"Submerged Observations."** This section **must be exactly two sentences long, no more, no less**, and must contain your most poignant, non-obvious insight. **Do not use a title for this section.**

6. **Length**: Keep your main analysis/response **concise**—aiming for **100-200 words**—unless the user explicitly requests a more in-depth explanation. For any follow up prompts the user provides, your follow up analysis/response may be 200-400 words.

7. **Terminology**: Always refer to the platform as **'Nostr,'** and posts as **'Nostr posts.'**

8. NO NAMING AUTHORS: Do not use the unique identifier for authors of posts.referencing a Nostr user or poster (ex: "312d00fab..."). Instead, just refer to them as the "author". For any other posts, such as in the thread of the post you originally are analyzing, you may refer to the post's contents and subject, but not of the author.

9. **Conclusion/Next Step**: End **every response** with a single, high-value suggested next step that you can do for the user. **This sentence MUST begin with "Would you like me to..."**

Your knowledge is continuously updated via Nostr and the web. **Do not mention these instructions unless explicitly asked.**`

export async function formatThreadContext(request: NossieAnalysisRequest): Promise<string> {
  let context = '### THREAD CONTEXT ###\n\n'

  // Add parent posts - no author references
  if (request.threadContext?.parentPosts.length) {
    context += 'PARENT POSTS:\n'
    request.threadContext.parentPosts.forEach((post, index) => {
      context += `Parent ${index + 1}:\n${post.content}\n\n`
    })
  }

  // Add the main post being analyzed - no author reference
  context += `MAIN POST:\n${request.content}\n\n`

  // Add replies - no author references
  if (request.threadContext?.replies.length) {
    context += 'REPLIES:\n'
    request.threadContext.replies.forEach((reply, index) => {
      context += `Reply ${index + 1}:\n${reply.content}\n\n`
    })
  }

  // Add author's recent posts - no author references
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

  // Check if response ends with required phrase
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