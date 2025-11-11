import { useNossie } from '@/hooks/useNossie'
import { Button } from '@/components/ui/button'
import { Sparkles } from 'lucide-react'
import { useScreenSize } from '@/providers/ScreenSizeProvider'

interface NossieButtonProps {
  eventId: string
  content: string
  authorPubkey: string
  className?: string
  onClick?: () => void
}

export default function NossieButton({ 
  eventId, 
  content, 
  authorPubkey, 
  className = '',
  onClick 
}: NossieButtonProps) {
  const { config, isAnalyzing } = useNossie()
  const { isSmallScreen } = useScreenSize()

  const isConfigured = config.apiKey && config.apiKey.trim() !== ''

  const handleClick = () => {
    if (isConfigured && !isAnalyzing) {
      onClick?.()
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className={`
        ${className}
        ${!isConfigured ? 'opacity-50 cursor-not-allowed' : 'hover:bg-accent hover:text-accent-foreground'}
        ${isAnalyzing ? 'opacity-70 cursor-wait' : ''}
        transition-colors duration-200
        h-8 px-2
      `}
      onClick={handleClick}
      disabled={!isConfigured || isAnalyzing}
      title={!isConfigured ? 'AI not configured - set up API key in settings' : 'Analyze with Nossie AI'}
    >
      <Sparkles className={`h-4 w-4 ${isAnalyzing ? 'animate-pulse' : ''}`} />
      {!isSmallScreen && (
        <span className="ml-2 text-sm font-medium">
          {isAnalyzing ? 'Analyzing...' : 'Nossie'}
        </span>
      )}
    </Button>
  )
}