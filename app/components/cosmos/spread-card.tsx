'use client'
import type { FC } from 'react'
import React from 'react'
import { NAVY, SERIF } from '@/app/components/cosmos/cards'
import { LineIcon, XIcon, copyText, lineUrl, tweetUrl } from '@/app/components/cosmos/exam-card'

// 「勉強仲間に教える」(拡散)カード — 普段のコスモスK用。
// ・LINE / X / 文面コピー で、アプリの紹介とストアのリンクを広める
// ・送るのはアプリの紹介と「何問練習したか・平均点」だけ。答案の中身は送らない
// ・どこから来た人かを分けて数えられるよう、utm_medium を line / x / copy で変える(utm_campaign=spread)

const STORE_URL = 'https://play.google.com/store/apps/details?id=com.cosmosk.app'
export const spreadStoreLink = (medium: 'line' | 'x' | 'copy') =>
  `${STORE_URL}&referrer=utm_source%3Dshare%26utm_medium%3D${medium}%26utm_campaign%3Dspread`

/** 広める文面。n=採点した数, avg=平均点(表示用の文字列), freeLimit=無料で採点できる回数 */
export const buildSpreadText = (opts: { n: number, avg: string, freeLimit: number, channel: 'line' | 'x' | 'copy' }) => {
  const { n, avg, freeLimit, channel } = opts
  const lead = n > 0
    ? `行政書士試験の記述式、コスモスKで${n}問練習中(平均${avg}点/20)。`
    : '行政書士試験の記述式、コスモスKで練習中。'
  const lines = [
    lead,
    `40字で書くと、AIが数秒で20点採点。行政書士監修の92問・部分点つき・採点${freeLimit}回まで無料`,
    spreadStoreLink(channel),
  ]
  if (channel === 'x') { lines.push('#行政書士試験 #コスモスK') }
  return lines.join('\n')
}

export const SpreadCard: FC<{
  n: number
  avg: string
  freeLimit: number
  onCopied?: (ok: boolean) => void
  className?: string
}> = ({ n, avg, freeLimit, onCopied, className }) => {
  const xText = buildSpreadText({ n, avg, freeLimit, channel: 'x' })
  const lineText = buildSpreadText({ n, avg, freeLimit, channel: 'line' })
  const copyBody = buildSpreadText({ n, avg, freeLimit, channel: 'copy' })
  return (
    <div className={`bg-white rounded-2xl px-4 py-3.5 ${className ?? ''}`} style={{ border: '1px solid #e7e0d0' }} data-testid="card-spread">
      <div className="flex items-center gap-2.5">
        <span className="text-[20px] leading-none">📣</span>
        <div className="flex-1 min-w-0">
          <div className="text-[14.5px] font-bold leading-tight" style={{ fontFamily: SERIF, color: NAVY }}>勉強仲間に教える</div>
          <div className="text-[11px] text-gray-500 mt-0.5">記述式で困っている人に、ひとこと添えて送れます</div>
        </div>
      </div>
      <div className="flex gap-2 mt-3">
        <a
          href={lineUrl(lineText)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-[13.5px] font-bold text-white"
          style={{ background: '#06C755' }}
          data-testid="link-spread-line"
        >
          <LineIcon size={15} /> LINEで送る
        </a>
        <a
          href={tweetUrl(xText)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-[13.5px] font-bold text-white"
          style={{ background: '#000' }}
          data-testid="link-spread-x"
        >
          <XIcon size={14} /> Xに投稿
        </a>
      </div>
      <button
        type="button"
        onClick={async () => { const ok = await copyText(copyBody); onCopied?.(ok) }}
        className="w-full mt-2 rounded-xl px-3 py-2.5 text-[12.5px] font-bold bg-white"
        style={{ color: NAVY, border: '1px solid #e7e0d0' }}
        data-testid="button-spread-copy"
      >
        文面をコピー(インスタ・メール等に)
      </button>
    </div>
  )
}
