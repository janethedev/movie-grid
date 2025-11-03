import { ImageResponse } from 'next/og'
import type { Locale } from '@/lib/i18n/locales'
import { getMessages } from '@/lib/i18n/getMessages'

export const runtime = 'edge'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default async function Image({
  params,
}: {
  params: { locale: Locale }
}) {
  const { locale } = params
  const messages = await getMessages(locale)
  const title = messages?.meta?.title ?? 'GameGrid'
  const description = messages?.meta?.description ?? 'Create your personal game preference grid'

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: 64,
          color: '#0b1220',
          background:
            'linear-gradient(135deg, #fef3c7 0%, #e9d5ff 50%, #cffafe 100%)',
        }}
      >
        <div
          style={{
            fontSize: 56,
            fontWeight: 800,
            lineHeight: 1.2,
            marginBottom: 20,
          }}
        >
          {title}
        </div>
        <div style={{ fontSize: 28, opacity: 0.85 }}>{description}</div>

        <div
          style={{
            marginTop: 'auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 24,
            color: '#1f2937',
          }}
        >
          <span>moviegrid.dsdev.ink</span>
          <span style={{ opacity: 0.75 }}>Twitter • {locale}</span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}

