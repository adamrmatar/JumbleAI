import {
  EmbeddedEmojiParser,
  EmbeddedEventParser,
  EmbeddedHashtagParser,
  EmbeddedLNInvoiceParser,
  EmbeddedMentionParser,
  EmbeddedUrlParser,
  EmbeddedWebsocketUrlParser,
  parseContent
} from '@/lib/content-parser'
import { cn } from '@/lib/utils'
import { TImetaInfo } from '@/types'
import { useMemo } from 'react'
import {
  EmbeddedHashtag,
  EmbeddedLNInvoice,
  EmbeddedMention,
  EmbeddedNote,
  EmbeddedWebsocketUrl
} from '../Embedded'
import ExternalLink from '../ExternalLink'
import ImageGallery from '../ImageGallery'
import MediaPlayer from '../MediaPlayer'
import XEmbeddedPost from '../XEmbeddedPost'
import YoutubeEmbeddedPlayer from '../YoutubeEmbeddedPlayer'

export default function ExternalContent({
  content,
  className,
  mustLoadMedia
}: {
  content?: string
  className?: string
  mustLoadMedia?: boolean
}) {
  const { nodes, allImages } = useMemo(() => {
    if (!content) return {}

    const nodes = parseContent(content, [
      EmbeddedEventParser,
      EmbeddedMentionParser,
      EmbeddedUrlParser,
      EmbeddedLNInvoiceParser,
      EmbeddedWebsocketUrlParser,
      EmbeddedHashtagParser,
      EmbeddedEmojiParser
    ])

    const allImages = nodes
      .map((node) => {
        if (node.type === 'image') {
          return { url: node.data }
        }
        if (node.type === 'images') {
          const urls = Array.isArray(node.data) ? node.data : [node.data]
          return urls.map((url) => {
            return { url }
          })
        }
        return null
      })
      .filter(Boolean)
      .flat() as TImetaInfo[]

    return { nodes, allImages }
  }, [content])

  if (!nodes || nodes.length === 0) {
    return null
  }

  let imageIndex = 0
  return (
    <div className={cn('text-wrap break-words whitespace-pre-wrap', className)}>
      {nodes.map((node, index) => {
        if (node.type === 'text') {
          return node.data
        }
        if (node.type === 'image' || node.type === 'images') {
          const start = imageIndex
          const end = imageIndex + (Array.isArray(node.data) ? node.data.length : 1)
          imageIndex = end
          return (
            <ImageGallery
              className="mt-2"
              key={index}
              images={allImages}
              start={start}
              end={end}
              mustLoad={mustLoadMedia}
            />
          )
        }
        if (node.type === 'media') {
          return (
            <MediaPlayer className="mt-2" key={index} src={node.data} mustLoad={mustLoadMedia} />
          )
        }
        if (node.type === 'url') {
          return <ExternalLink url={node.data} key={index} />
        }
        if (node.type === 'invoice') {
          return <EmbeddedLNInvoice invoice={node.data} key={index} className="mt-2" />
        }
        if (node.type === 'websocket-url') {
          return <EmbeddedWebsocketUrl url={node.data} key={index} />
        }
        if (node.type === 'event') {
          const id = node.data.split(':')[1]
          return <EmbeddedNote key={index} noteId={id} className="mt-2" />
        }
        if (node.type === 'mention') {
          return <EmbeddedMention key={index} userId={node.data.split(':')[1]} />
        }
        if (node.type === 'hashtag') {
          return <EmbeddedHashtag hashtag={node.data} key={index} />
        }
        if (node.type === 'youtube') {
          return (
            <YoutubeEmbeddedPlayer
              key={index}
              url={node.data}
              className="mt-2"
              mustLoad={mustLoadMedia}
            />
          )
        }
        if (node.type === 'x-post') {
          return (
            <XEmbeddedPost key={index} url={node.data} className="mt-2" mustLoad={mustLoadMedia} />
          )
        }
        return null
      })}
    </div>
  )
}
