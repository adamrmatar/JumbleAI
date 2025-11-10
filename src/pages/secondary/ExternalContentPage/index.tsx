import ExternalContent from '@/components/ExternalContent'
import SecondaryPageLayout from '@/layouts/SecondaryPageLayout'
import { forwardRef, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

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

  return (
    <SecondaryPageLayout
      ref={ref}
      index={index}
      title={t('External Content')}
      displayScrollToTopButton
    >
      <ExternalContent content={id} />
    </SecondaryPageLayout>
  )
})
ExternalContentPage.displayName = 'ExternalContentPage'
export default ExternalContentPage
