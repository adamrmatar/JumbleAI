import { getEmojiPackInfoFromEvent } from '@/lib/event-metadata'
import { Event } from 'nostr-tools'
import { useMemo } from 'react'
import Image from '../Image'

export default function EmojiPack({ event, className }: { event: Event; className?: string }) {
  const { title, emojis } = useMemo(() => getEmojiPackInfoFromEvent(event), [event])

  return (
    <div className={className}>
      <div className="pl-1 font-semibold">{title}</div>
      <div className="flex flex-wrap gap-1">
        {emojis.map((emoji, index) => (
          <Image
            key={`emoji-${index}`}
            image={{ url: emoji.url, pubkey: event.pubkey }}
            className="w-10 h-10 object-contain"
            classNames={{
              wrapper: 'w-10 h-10 flex items-center justify-center p-1',
              errorPlaceholder: 'w-10 h-10'
            }}
            hideIfError
          />
        ))}
      </div>
    </div>
  )
}
