import ExternalContent from '@/components/ExternalContent'
import ReplyNoteList from '@/components/ReplyNoteList'
import { Separator } from '@/components/ui/separator'
import SecondaryPageLayout from '@/layouts/SecondaryPageLayout'
import { forwardRef, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import NotFoundPage from '../NotFoundPage'

const ExternalContentPage = forwardRef(({ index }: { index?: number }, ref) => {
  const { t } = useTranslation()
  const [id, setId] = useState<string | undefined>()

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search)
    const id = searchParams.get('id')
    if (id) {
      setId(id)
    }
  }, [])

  if (!id) return <NotFoundPage index={index} />

  return (
    <SecondaryPageLayout
      ref={ref}
      index={index}
      title={t('External Content')}
      displayScrollToTopButton
    >
      <div className="px-4 mt-4">
        <ExternalContent content={id} />
      </div>
      <Separator className="mt-4" />
      <ReplyNoteList index={index} externalContent={id} />
    </SecondaryPageLayout>
  )
})
ExternalContentPage.displayName = 'ExternalContentPage'
export default ExternalContentPage
