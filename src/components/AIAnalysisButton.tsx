import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Sparkles, Brain, Info, AlertCircle, CheckCircle, Loader2 } from 'lucide-react'
import { useAIAnalysis } from '@/hooks/useAIAnalysis'
import { NostrEvent } from 'nostr-tools'

interface AIAnalysisButtonProps {
  event: NostrEvent
  children?: React.ReactNode
  variant?: 'default' | 'ghost' | 'outline' | 'secondary' | 'destructive' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
  showLabel?: boolean
}

export function AIAnalysisButton({
  event,
  children,
  variant = 'ghost',
  size = 'sm',
  className = '',
  showLabel = false,
}: AIAnalysisButtonProps) {
  const {
    analyzePost,
    isAnalyzing,
    isConfigured,
    analysis,
    error,
  } = useAIAnalysis()

  const [isOpen, setIsOpen] = useState(false)

  const handleAnalyze = () => {
    if (!isConfigured) {
      return
    }
    analyzePost({ event })
  }

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (open && !analysis && !isAnalyzing) {
      handleAnalyze()
    }
  }

  const buttonContent = children || (
    <>
      <Sparkles className="h-4 w-4" />
      {showLabel && <span className="ml-2">AI Info</span>}
    </>
  )

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={className}
          disabled={!isConfigured}
          title={isConfigured ? 'Analyze with AI' : 'AI not configured'}
        >
          {buttonContent}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-500" />
            AI Analysis
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-4">
            {!isConfigured ? (
              <div className="flex flex-col items-center justify-center py-8 space-y-4">
                <AlertCircle className="h-12 w-12 text-amber-500" />
                <div className="text-center space-y-2">
                  <h3 className="text-lg font-medium">AI Analysis Not Configured</h3>
                  <p className="text-sm text-muted-foreground">
                    Please configure an AI provider in settings to use this feature.
                  </p>
                </div>
              </div>
            ) : isAnalyzing ? (
              <div className="flex flex-col items-center justify-center py-8 space-y-4">
                <Loader2 className="h-12 w-12 animate-spin text-purple-500" />
                <div className="text-center space-y-2">
                  <h3 className="text-lg font-medium">Analyzing Post...</h3>
                  <p className="text-sm text-muted-foreground">
                    AI is analyzing this post to provide insights and context.
                  </p>
                </div>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-8 space-y-4">
                <AlertCircle className="h-12 w-12 text-red-500" />
                <div className="text-center space-y-2">
                  <h3 className="text-lg font-medium">Analysis Failed</h3>
                  <p className="text-sm text-muted-foreground">
                    {error.message || 'Unable to analyze this post. Please try again.'}
                  </p>
                  <Button onClick={handleAnalyze} variant="outline" size="sm">
                    Retry Analysis
                  </Button>
                </div>
              </div>
            ) : analysis ? (
              <div className="space-y-6">
                {/* Post Preview */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">Original Post</h4>
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm whitespace-pre-wrap break-words">
                      {event.content}
                    </p>
                  </div>
                </div>

                <Separator />

                {/* AI Analysis */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <h4 className="font-medium">AI Analysis Complete</h4>
                  </div>

                  {/* Analysis Content */}
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <div 
                      className="whitespace-pre-wrap break-words text-sm leading-relaxed"
                      dangerouslySetInnerHTML={{
                        __html: analysis.explanation
                          .replace(/\n/g, '<br>')
                          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                          .replace(/\*(.*?)\*/g, '<em>$1</em>')
                          .replace(/`(.*?)`/g, '<code>$1</code>')
                          .replace(/^### (.*$)/gm, '<h3 class="text-base font-semibold mt-4 mb-2">$1</h3>')
                          .replace(/^## (.*$)/gm, '<h2 class="text-lg font-semibold mt-4 mb-2">$1</h2>')
                          .replace(/^# (.*$)/gm, '<h1 class="text-xl font-semibold mt-4 mb-2">$1</h1>')
                          .replace(/^- (.*$)/gm, '<li class="ml-4">• $1</li>')
                      }}
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-4">
                  <Button onClick={handleAnalyze} variant="outline" size="sm">
                    <Brain className="h-4 w-4 mr-2" />
                    Re-analyze
                  </Button>
                  <Button 
                    onClick={() => setIsOpen(false)} 
                    variant="default" 
                    size="sm"
                  >
                    Close
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

// Simple button version for use in Note components
export function SimpleAIAnalysisButton({ event }: { event: NostrEvent }) {
  const { isConfigured } = useAIAnalysis()

  return (
    <AIAnalysisButton
      event={event}
      variant="ghost"
      size="icon"
      className="h-8 w-8"
    >
      <Sparkles className="h-4 w-4" />
    </AIAnalysisButton>
  )
}