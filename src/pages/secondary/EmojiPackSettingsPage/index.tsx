import EmojiPackList from '@/components/EmojiPackList'
import SecondaryPageLayout from '@/layouts/SecondaryPageLayout'
import { forwardRef } from 'react'
import { useTranslation } from 'react-i18next'

const EmojiPackSettingsPage = forwardRef(({ index }: { index?: number }, ref) => {
  const { t } = useTranslation()

  return (
    <SecondaryPageLayout ref={ref} index={index} title={t('Emoji Packs')}>
      <EmojiPackList />
    </SecondaryPageLayout>
  )
})
EmojiPackSettingsPage.displayName = 'EmojiPackSettingsPage'
export default EmojiPackSettingsPage
