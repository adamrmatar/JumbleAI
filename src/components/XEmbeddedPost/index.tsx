import { useContentPolicy } from '@/providers/ContentPolicyProvider'
import { useTheme } from '@/providers/ThemeProvider'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import ExternalLink from '../ExternalLink'

export default function XEmbeddedPost({
  url,
  className,
  mustLoad = false
}: {
  url: string
  className?: string
  mustLoad?: boolean
}) {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const { autoLoadMedia } = useContentPolicy()
  const [display, setDisplay] = useState(autoLoadMedia)
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)
  const { tweetId } = useMemo(() => parseXUrl(url), [url])
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (autoLoadMedia) {
      setDisplay(true)
    } else {
      setDisplay(false)
    }
  }, [autoLoadMedia])

  useEffect(() => {
    if (!tweetId || !containerRef.current || (!mustLoad && !display)) return

    // Load Twitter widgets script if not already loaded
    if (!window.twttr) {
      const script = document.createElement('script')
      script.src = 'https://platform.twitter.com/widgets.js'
      script.async = true
      script.onload = () => {
        embedTweet()
      }
      script.onerror = () => {
        setError(true)
      }
      document.body.appendChild(script)
    } else {
      embedTweet()
    }

    function embedTweet() {
      if (!containerRef.current || !window.twttr || !tweetId) return

      // Clear container
      containerRef.current.innerHTML = ''

      window.twttr.widgets
        .createTweet(tweetId, containerRef.current, {
          theme: theme === 'light' ? 'light' : 'dark',
          dnt: true, // Do not track
          conversation: 'none' // Hide conversation thread
        })
        .then((element: HTMLElement | undefined) => {
          if (element) {
            setLoaded(true)
          } else {
            setError(true)
          }
        })
        .catch(() => {
          setError(true)
        })
    }
  }, [tweetId, display, mustLoad, loaded, theme])

  if (error || !tweetId) {
    return <ExternalLink url={url} />
  }

  if (!mustLoad && !display) {
    return (
      <div
        className="text-primary hover:underline truncate w-fit cursor-pointer"
        onClick={(e) => {
          e.stopPropagation()
          setDisplay(true)
        }}
      >
        [{t('Click to load X post')}]
      </div>
    )
  }

  return <div ref={containerRef} className={className} />
}

function parseXUrl(url: string): { tweetId: string | null } {
  const pattern = /(?:twitter\.com|x\.com)\/(?:#!\/)?(?:\w+)\/status(?:es)?\/(\d+)/i
  const match = url.match(pattern)
  return {
    tweetId: match ? match[1] : null
  }
}
