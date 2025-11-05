import { Button } from '@/components/ui/button'
import { getReplaceableCoordinateFromEvent } from '@/lib/event'
import { getEmojiPackInfoFromEvent } from '@/lib/event-metadata'
import { useEmojiPack } from '@/providers/EmojiPackProvider'
import { useNostr } from '@/providers/NostrProvider'
import { CheckIcon, Loader, PlusIcon } from 'lucide-react'
import { Event } from 'nostr-tools'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import Image from '../Image'

export default function EmojiPack({ event, className }: { event: Event; className?: string }) {
  const { t } = useTranslation()
  const { pubkey: accountPubkey, userEmojiListEvent, checkLogin } = useNostr()
  const { addEmojiPack, removeEmojiPack } = useEmojiPack()
  const [updating, setUpdating] = useState(false)
  const { title, emojis } = useMemo(() => getEmojiPackInfoFromEvent(event), [event])

  const isCollected = useMemo(() => {
    const coordinate = getReplaceableCoordinateFromEvent(event)
    return userEmojiListEvent?.tags.some((tag) => tag[0] === 'a' && tag[1] === coordinate)
  }, [userEmojiListEvent, event])

  const handleCollect = async (e: React.MouseEvent) => {
    e.stopPropagation()
    checkLogin(async () => {
      if (isCollected) return

      setUpdating(true)
      try {
        await addEmojiPack(event)
        toast.success(t('Emoji pack added'))
      } catch (error) {
        toast.error(t('Add emoji pack failed') + ': ' + (error as Error).message)
      } finally {
        setUpdating(false)
      }
    })
  }

  const handleRemoveCollect = async (e: React.MouseEvent) => {
    e.stopPropagation()
    checkLogin(async () => {
      if (!isCollected) return

      setUpdating(true)
      try {
        await removeEmojiPack(event)
        toast.success(t('Emoji pack removed'))
      } catch (error) {
        toast.error(t('Remove emoji pack failed') + ': ' + (error as Error).message)
      } finally {
        setUpdating(false)
      }
    })
  }

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-2xl font-semibold">{title}</h3>
        {accountPubkey && (
          <Button
            variant={isCollected ? 'secondary' : 'outline'}
            size="sm"
            onClick={isCollected ? handleRemoveCollect : handleCollect}
            disabled={updating}
            className="shrink-0"
          >
            {updating ? (
              <Loader className="animate-spin mr-1" />
            ) : isCollected ? (
              <CheckIcon />
            ) : (
              <PlusIcon />
            )}
            {updating
              ? isCollected
                ? t('Removing...')
                : t('Adding...')
              : isCollected
                ? t('Added')
                : t('Add')}
          </Button>
        )}
      </div>
      <div className="flex flex-wrap gap-1">
        {emojis.map((emoji, index) => (
          <Image
            key={`emoji-${index}`}
            image={{ url: emoji.url, pubkey: event.pubkey }}
            className="size-14 object-contain"
            classNames={{
              wrapper: 'size-14 flex items-center justify-center p-1',
              errorPlaceholder: 'size-14'
            }}
            hideIfError
          />
        ))}
      </div>
    </div>
  )
}
