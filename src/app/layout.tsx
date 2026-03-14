import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '스마트 지출 정리 보드 | 사회혁신학기 2026',
  description: '경포대학교 고성리 프로젝트 - 실시간 공유 예산 관리 시스템',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko">
      <head>
        <link
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
