import { EmbeddedUrlParser, parseContent } from '@/lib/content-parser'
import { cn } from '@/lib/utils'
import { useMemo } from 'react'
import ExternalLink from '../ExternalLink'
import XEmbeddedPost from '../XEmbeddedPost'

export default function ExternalContent({
  content,
  className,
  mustLoadMedia
}: {
  content?: string
  className?: string
  mustLoadMedia?: boolean
}) {
  const nodes = useMemo(() => {
    if (!content) return []

    return parseContent(content, [EmbeddedUrlParser])
  }, [content])

  if (!nodes || nodes.length === 0) {
    return null
  }

  const node = nodes[0]

  if (node.type === 'text' || Array.isArray(node.data)) {
    return (
      <div className={cn('text-wrap break-words whitespace-pre-wrap', className)}>{content}</div>
    )
  }

  if (node.type === 'x-post') {
    return (
      <XEmbeddedPost
        url={node.data}
        className={className}
        mustLoad={mustLoadMedia}
        embedded={false}
      />
    )
  }

  return <ExternalLink className={className} url={node.data} />
}
