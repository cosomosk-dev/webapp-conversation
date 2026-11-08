'use client'
import type { FC } from 'react'
import React from 'react'
import { NAVY, SERIF } from '@/app/components/cosmos/cards'
import { INSTAGRAM_HANDLE } from '@/app/components/cosmos/exam-card'
import { ShareButtons } from '@/app/components/cosmos/share-buttons'

// 「勉強仲間に教える」(拡散)カード — 普段のコスモスK用。
// ・LINE / X / インスタ のアプリを直接開いて、アプリの紹介とストアのリンクを広める
// ・送るのはアプリの紹介と「何問練習したか・平均点」だけ。答案の中身は送らない
// ・文面は短く。リンクは計測用の文字を付けない素のストアURL(長いと怪しく見えるため)

export const STORE_URL = 'https://play.google.com/store/apps/details?id=com.cosmosk.app'

/** 広める文面。freeLimit=無料で採点できる回数(n・avgは今は使わない) */
export const buildSpreadText = (opts: { n?: number, avg?: string, freeLimit: number, channel: 'line' | 'x' | 'instagram' }) => {
  const { freeLimit, channel } = opts
  const head = '行政書士試験の記述式、書いた答案をAIが数秒で採点してくれるアプリ「コスモスK」'
  const proof = `Google Playで5,000ダウンロード突破・${freeLimit}回まで無料`
  // インスタは文中のURLが押せないので、URLの代わりに「Google Playで検索」と案内する
  if (channel === 'instagram') {
    return [head, proof, 'Google Playで「コスモスK」と検索', `リンクは ${INSTAGRAM_HANDLE} のプロフィールに`].join('\n')
  }
  const lines = [head, proof, STORE_URL]
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
