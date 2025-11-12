import { cn } from '@/lib/utils'
import { useScreenSize } from '@/providers/ScreenSizeProvider'
import { useState } from 'react'
import ReplyButton from './ReplyButton'

export default function ExternalContentStats({
  externalContent,
  className,
  classNames
}: {
  externalContent: string
  className?: string
  classNames?: {
    buttonBar?: string
  }
}) {
  const { isSmallScreen } = useScreenSize()
  const [loading, setLoading] = useState(false)

  if (isSmallScreen) {
    return (
      <div className={cn('select-none', className)}>
        <div
          className={cn(
            'flex justify-between items-center h-5 [&_svg]:size-5',
            loading ? 'animate-pulse' : '',
            classNames?.buttonBar
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <ReplyButton externalContent={externalContent} />
        </div>
      </div>
    )
  }

  return (
    <div className={cn('select-none', className)}>
      <div className="flex justify-between h-5 [&_svg]:size-4">
        <div
          className={cn('flex items-center', loading ? 'animate-pulse' : '')}
          onClick={(e) => e.stopPropagation()}
        >
          <ReplyButton externalContent={externalContent} />
        </div>
      </div>
    </div>
  )
}
