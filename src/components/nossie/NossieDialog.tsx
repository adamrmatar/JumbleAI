import { useState, useRef, useEffect, useCallback } from 'react'
import { useNossie } from '@/hooks/useNossie'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ArrowLeft, Send, Sparkles, Loader2, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface NossieDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  eventId: string
  content: string
  authorPubkey: string
}

interface MessageProps {
  message: {
    id: string
    role: 'user' | 'assistant'
    content: string
    timestamp: number
  }
}

function Message({ message }: MessageProps) {
  const isUser = message.role === 'user'

  return (
    <div className={cn(
      'flex gap-3 mb-4',
      isUser ? 'flex-row-reverse' : 'flex-row'
    )}>
      <div className={cn(
        'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
        isUser ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
      )}>
        {isUser ? (
          <span className="text-sm font-medium">You</span>
        ) : (
          <Sparkles className="h-4 w-4" />
        )}
      </div>
      <div className={cn(
        'flex-1 max-w-[80%] rounded-lg px-4 py-3',
        isUser 
          ? 'bg-primary text-primary-foreground' 
          : 'bg-muted text-muted-foreground'
      )}>
        <div className="text-sm whitespace-pre-wrap leading-relaxed">
          {message.content}
        </div>
        <div className={cn(
          'text-xs mt-2',
          isUser ? 'text-primary-foreground/70' : 'text-muted-foreground/70'
        )}>
          {new Date(message.timestamp).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </div>
      </div>
    </div>
  )
}

function LoadingMessage() {
  return (
    <div className="flex gap-3 mb-4">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
        <Sparkles className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex-1 max-w-[80%] rounded-lg px-4 py-3 bg-muted">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Nossie is thinking...</span>
        </div>
      </div>
    </div>
  )
}

function ErrorMessage({ error }: { error: Error }) {
  return (
    <div className="flex gap-3 mb-4">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-destructive flex items-center justify-center">
        <AlertCircle className="h-4 w-4 text-destructive-foreground" />
      </div>
      <div className="flex-1 max-w-[80%] rounded-lg px-4 py-3 bg-destructive/10 border border-destructive/20">
        <div className="text-sm text-destructive">
          <div className="font-medium mb-1">Error</div>
          <div>{error.message}</div>
        </div>
      </div>
    </div>
  )
}

export default function NossieDialog({ 
  open, 
  onOpenChange, 
  eventId, 
  content, 
  authorPubkey 
}: NossieDialogProps) {
  const { 
    getConversation, 
    analyzePost, 
    sendFollowUp, 
    isAnalyzing, 
    isSendingFollowUp, 
    analysisError, 
    followUpError,
    addUserMessage 
  } = useNossie()
  
  const [searchWebContext, setSearchWebContext] = useState(false)
  const [userInput, setUserInput] = useState('')
  const [hasAnalyzed, setHasAnalyzed] = useState(false)
  
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  
  const conversation = getConversation(eventId)
  const isLoading = isAnalyzing || isSendingFollowUp
  const error = analysisError || followUpError

  // Scroll to bottom when new messages are added
  const scrollToBottom = useCallback(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight
      }
    }
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [conversation?.messages, isLoading, error, scrollToBottom])

  useEffect(() => {
    if (open && !hasAnalyzed && !conversation) {
      // Auto-analyze when dialog opens
      handleAnalyze()
    }
  }, [open, hasAnalyzed, conversation])

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus()
    }
  }, [open, isLoading])

  const handleAnalyze = async () => {
    try {
      await analyzePost({
        eventId,
        content,
        authorPubkey,
        searchWebContext
      })
      setHasAnalyzed(true)
    } catch (error) {
      console.error('Analysis failed:', error)
    }
  }

  const handleSend = async () => {
    if (!userInput.trim() || isLoading) return

    const message = userInput.trim()
    setUserInput('')
    
    // Add user message immediately for optimistic UI
    addUserMessage(`conv_${eventId}`, message)
    
    try {
      await sendFollowUp({
        conversationId: `conv_${eventId}`,
        message
      })
    } catch (error) {
      console.error('Failed to send follow-up:', error)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleClose = () => {
    onOpenChange(false)
    setUserInput('')
    setHasAnalyzed(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-[85vw] w-full max-w-2xl p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="h-8 w-8"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Nossie AI
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="flex flex-col h-[calc(85vh-120px)]">
          {/* Messages area */}
          <ScrollArea className="flex-1 p-6" ref={scrollAreaRef}>
            <div className="space-y-4">
              {conversation?.messages.map((message) => (
                <Message key={message.id} message={message} />
              ))}
              
              {isLoading && <LoadingMessage />}
              
              {error && <ErrorMessage error={error} />}
              
              {!conversation && !isLoading && !error && (
                <div className="text-center py-8 text-muted-foreground">
                  <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-sm">
                    Nossie AI is analyzing this Nostr post and its thread context...
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input area */}
          <div className="border-t p-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="space-y-3">
              {!hasAnalyzed && (
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="search-web"
                    checked={searchWebContext}
                    onCheckedChange={(checked) => setSearchWebContext(checked as boolean)}
                  />
                  <label 
                    htmlFor="search-web" 
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Search for related posts and web context
                  </label>
                </div>
              )}
              
              <div className="flex gap-2">
                <textarea
                  ref={inputRef}
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={hasAnalyzed ? "Ask a follow-up question..." : "Nossie is analyzing..."}
                  disabled={isLoading || !hasAnalyzed}
                  className={cn(
                    "flex-1 min-h-[60px] max-h-32 w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  )}
                  rows={2}
                />
                <Button
                  onClick={handleSend}
                  disabled={!userInput.trim() || isLoading || !hasAnalyzed}
                  size="icon"
                  className="h-10 w-10"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}