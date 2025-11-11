import { cn } from '@/lib/utils'
import { useNostr } from '@/providers/NostrProvider'
import { useScreenSize } from '@/providers/ScreenSizeProvider'
import noteStatsService from '@/services/note-stats.service'
import { useEffect, useState } from 'react'
import LikeButton from './LikeButton'
import Likes from './Likes'
import ReplyButton from './ReplyButton'
import RepostButton from './RepostButton'

export default function ExternalContentStats({
  externalContentId,
  className,
  classNames
}: {
  externalContentId: string
  className?: string
  classNames?: {
    buttonBar?: string
  }
}) {
  const { isSmallScreen } = useScreenSize()
  const { pubkey } = useNostr()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    noteStatsService.fetchNoteStats(event, pubkey).finally(() => setLoading(false))
  }, [externalContentId])

  if (isSmallScreen) {
    return (
      <div className={cn('select-none', className)}>
        <Likes event={event} />
        <div
          className={cn(
            'flex justify-between items-center h-5 [&_svg]:size-5',
            loading ? 'animate-pulse' : '',
            classNames?.buttonBar
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <ReplyButton event={event} />
          <RepostButton event={event} />
          <LikeButton event={event} />
        </div>
      </div>
    )
  }

  return (
    <div className={cn('select-none', className)}>
      <Likes event={event} />
      <div className="flex justify-between h-5 [&_svg]:size-4">
        <div
          className={cn('flex items-center', loading ? 'animate-pulse' : '')}
          onClick={(e) => e.stopPropagation()}
        >
          <ReplyButton event={event} />
          <RepostButton event={event} />
          <LikeButton event={event} />
        </div>
        <div className="flex items-center" onClick={(e) => e.stopPropagation()}></div>
      </div>
    </div>
  )
}
