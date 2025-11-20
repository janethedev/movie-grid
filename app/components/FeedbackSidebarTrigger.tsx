'use client'

import { useI18n } from '@/lib/i18n/provider'

export function FeedbackSidebarTrigger() {
  const { t, locale } = useI18n()
  const formId = locale === 'en' ? 'kddrW1' : 'VLLNra'

  return (
    <button
      type="button"
      data-tally-open={formId}
      data-tally-layout="modal"
      data-tally-width="576"
      data-tally-hide-title="1"
      className="fixed right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-700 shadow-lg shadow-black/15 transition-transform transition-colors duration-200 hover:-translate-y-0.5 hover:bg-gray-50 hover:shadow-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
      style={{ bottom: 'calc(1.5rem + env(safe-area-inset-bottom, 0px))' }}
      aria-label={t('footer.feedback_button') as string}
    >
      ?
    </button>
  )
}
