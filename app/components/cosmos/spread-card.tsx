'use client'
import type { FC } from 'react'
import React from 'react'
import { NAVY, SERIF } from '@/app/components/cosmos/cards'
import { INSTAGRAM_HANDLE } from '@/app/components/cosmos/exam-card'
import { ShareButtons } from '@/app/components/cosmos/share-buttons'

// 「勉強仲間に教える」(拡散)カード — 普段のコスモスK用。
// ・LINE / X / インスタ のアプリを直接開いて、アプリの紹介とストアのリンクを広める
// ・送るのはアプリの紹介と「何問練習したか・平均点」だけ。答案の中身は送らない
// ・どこから来た人かを分けて数えられるよう、utm_medium を line / x / copy で変える(utm_campaign=spread)

const STORE_URL = 'https://play.google.com/store/apps/details?id=com.cosmosk.app'
export const spreadStoreLink = (medium: 'line' | 'x') =>
  `${STORE_URL}&referrer=utm_source%3Dshare%26utm_medium%3D${medium}%26utm_campaign%3Dspread`

/** 広める文面。n=採点した数, avg=平均点(表示用の文字列), freeLimit=無料で採点できる回数 */
export const buildSpreadText = (opts: { n: number, avg: string, freeLimit: number, channel: 'line' | 'x' | 'instagram' }) => {
  const { n, avg, freeLimit, channel } = opts
  const lead = n > 0
    ? `行政書士試験の記述式、コスモスKで${n}問練習中(平均${avg}点/20)。`
    : '行政書士試験の記述式、コスモスKで練習中。'
  // インスタは文中のURLが押せないので、URLの代わりに「Google Playで検索」と監修者アカウントで案内する
  if (channel === 'instagram') {
    return [lead, `40字で書くと、AIが数秒で20点採点。行政書士監修の92問・採点${freeLimit}回まで無料`, 'Google Playで「コスモスK」と検索', `リンクは ${INSTAGRAM_HANDLE} のプロフィールに`].join('\n')
  }
  const lines = [
    lead,
    `40字で書くと、AIが数秒で20点採点。行政書士監修の92問・部分点つき・採点${freeLimit}回まで無料`,
    spreadStoreLink(channel === 'x' ? 'x' : 'line'),
  ]
  if (channel === 'x') { lines.push('#行政書士試験 #コスモスK') }
  return lines.join('\n')
}

export const SpreadCard: FC<{
  n: number
  avg: string
  freeLimit: number
  className?: string
}> = ({ n, avg, freeLimit, className }) => {
  const texts = {
    line: buildSpreadText({ n, avg, freeLimit, channel: 'line' }),
    x: buildSpreadText({ n, avg, freeLimit, channel: 'x' }),
    instagram: buildSpreadText({ n, avg, freeLimit, channel: 'instagram' }),
  }
  return (
    <div className={`bg-white rounded-2xl px-4 py-3.5 ${className ?? ''}`} style={{ border: '1px solid #e7e0d0' }} data-testid="card-spread">
      <div className="flex items-center gap-2.5">
        <span className="text-[20px] leading-none">📣</span>
        <div className="flex-1 min-w-0">
          <div className="text-[14.5px] font-bold leading-tight" style={{ fontFamily: SERIF, color: NAVY }}>勉強仲間に教える</div>
          <div className="text-[11px] text-gray-500 mt-0.5">記述式で困っている人に、ひとこと添えて送れます</div>
        </div>
      </div>
      <ShareButtons className="mt-3" testIdPrefix="spread" texts={texts} />
    </div>
  )
}
