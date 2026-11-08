'use client'
import type { FC } from 'react'
import React from 'react'
import { CREAM, GOLD, GOLD_LIGHT, NAVY, SERIF } from '@/app/components/cosmos/cards'

// コスモスK 本試験モード(問44〜46)の結果カードと、Xに投稿する文面の組み立て。
// 問題文は著作権の関係で一切表示しない(問番号と点数だけ)。

export type ExamScores = Record<string, number>

export const PASS_LINE = 180
/** インスタ用の文面に入れる監修者アカウント(メンションにするとタップでプロフィールへ飛べる) */
export const INSTAGRAM_HANDLE = '@taka.gyosei.music0319'
export const WRITTEN_MAX_PER_PROBLEM = 20
export const MC_MAX = 240

const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1))

/** Difyに送る文面。「本試験 問44 採点：<答案>」(全角コロン)。Dify側の分岐はこの先頭文字列で判定する */
export const EXAM_PREFIX_RE = /^本試験\s+(問4[456])\s+採点：/
export const buildExamMessage = (problem: string, answer: string) => `本試験 ${problem} 採点：${answer}`
/** 本試験モードの送信なら問番号(問44など)、そうでなければ null */
export const examProblemOf = (message: string): string | null => {
  const m = (message || '').trim().match(EXAM_PREFIX_RE)
  return m ? m[1] : null
}
/** 送信文面から答案本体だけ取り出す(表示用) */
export const examAnswerOf = (message: string): string => (message || '').trim().replace(EXAM_PREFIX_RE, '').trim()

/** 採点結果の文章から「◯/20」を読む(最後に出てきたものを採用)。読めなければ -1 */
export const lastScoreOf = (text: string): number => {
  const all = [...(text || '').matchAll(/(\d+(?:\.\d+)?)\s*[/／]\s*20/g)]
  return all.length > 0 ? Number(all[all.length - 1][1]) : -1
}

export const writtenTotal = (problems: readonly string[], scores: ExamScores) =>
  problems.reduce((a, p) => a + (typeof scores[p] === 'number' ? scores[p] : 0), 0)

export const hasAnyScore = (problems: readonly string[], scores: ExamScores) =>
  problems.some(p => typeof scores[p] === 'number')

/** Xに投稿する文面(ハッシュタグは2つまで) */
export const buildExamShareText = (opts: {
  problems: readonly string[]
  scores: ExamScores
  mc: number | null
  storeUrl: string
  utm: string
  channel?: 'x' | 'line' | 'insta'
}) => {
  const { problems, scores, mc, storeUrl, utm, channel = 'x' } = opts
  const written = writtenTotal(problems, scores)
  const detail = problems.map(p => `${p} ${typeof scores[p] === 'number' ? fmt(scores[p]) : '—'}`).join('／')
  // インスタはURLが押せない(ストーリーズ・フィードの文中)ので、URLなしの短文。
  // 「Google Playで検索」と、監修者アカウントのメンション(プロフィールのリンクから飛べる)で案内する
  if (channel === 'insta') {
    const ig = ['行政書士試験 自己採点📝', `記述AI予想 ${fmt(written)}点`, `(${detail})`]
    if (mc !== null)
      ig.push(`択一${mc}点＋記述 ＝ 合計${fmt(mc + written)}点`)
    ig.push('採点はアプリ「コスモスK」(無料)', 'Google Playで「コスモスK」と検索', `またはプロフィールから ${INSTAGRAM_HANDLE}`)
    return ig.join('\n')
  }
  // LINEはハッシュタグが効かないので、1行目を普通の見出しにする
  const lines = [channel === 'line' ? '【行政書士試験 自己採点】' : '#行政書士試験 自己採点 #コスモスK']
  if (mc !== null) {
    lines.push(`択一 ${mc}点 ／ 記述AI予想 ${fmt(written)}点(${detail})`)
    lines.push(`合計 ${fmt(mc + written)}点(合格ライン${PASS_LINE})`)
  }
  else {
    lines.push(`記述AI予想 ${fmt(written)}点(${detail})`)
  }
  lines.push(`記述の採点はコスモスK(無料) ${storeUrl}&referrer=${utm}`)
  return lines.join('\n')
}

export const tweetUrl = (text: string) => `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`
/** LINEの「送る相手を選ぶ」画面を開くURL(スマホではLINEアプリが開く) */
export const lineUrl = (text: string) => `https://line.me/R/share?text=${encodeURIComponent(text)}`
/** 流入元の計測: X用のutm(utm_medium=x)をLINE用(utm_medium=line)に置き換える */
export const toLineUtm = (utm: string) => utm.replace('utm_medium%3Dx', 'utm_medium%3Dline')

/** クリップボードにコピー(古い端末向けのフォールバックつき) */
export const copyText = async (text: string): Promise<boolean> => {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
      return true
    }
  }
  catch { }
  try {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.setAttribute('readonly', '')
    ta.style.position = 'fixed'
    ta.style.top = '-1000px'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    ta.setSelectionRange(0, text.length)
    const ok = document.execCommand('copy')
    document.body.removeChild(ta)
    return ok
  }
  catch {
    return false
  }
}

export const XIcon: FC<{ size?: number }> = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
)

export const LineIcon: FC<{ size?: number }> = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 2.5C6.2 2.5 1.5 6.3 1.5 11c0 4.2 3.7 7.7 8.8 8.4.3.1.8.2.9.5.1.3.1.7 0 1l-.1.9c0 .3-.2 1 .9.6 1.1-.5 6-3.5 8.2-6.1 1.5-1.6 2.3-3.3 2.3-5.3C22.5 6.3 17.8 2.5 12 2.5z" />
  </svg>
)

export const ExamResultCard: FC<{
  problems: readonly string[]
  scores: ExamScores
  mcInput: string
  onMcChange: (v: string) => void
  storeUrl: string
  utm: string
  onCopied?: (ok: boolean) => void
}> = ({ problems, scores, mcInput, onMcChange, storeUrl, utm, onCopied }) => {
  const written = writtenTotal(problems, scores)
  const writtenMax = problems.length * WRITTEN_MAX_PER_PROBLEM
  const mcNum = mcInput.trim() === '' ? null : Number(mcInput)
  const mc = (mcNum !== null && Number.isFinite(mcNum) && mcNum >= 0 && mcNum <= MC_MAX) ? Math.floor(mcNum) : null
  const total = mc !== null ? mc + written : null
  const shareText = buildExamShareText({ problems, scores, mc, storeUrl, utm })
  const lineText = buildExamShareText({ problems, scores, mc, storeUrl, utm: toLineUtm(utm), channel: 'line' })
  const instaText = buildExamShareText({ problems, scores, mc, storeUrl, utm, channel: 'insta' })
  const unscored = problems.filter(p => typeof scores[p] !== 'number')

  return (
    <div className="mt-3 rounded-2xl bg-white border p-4" style={{ borderColor: GOLD, boxShadow: '0 10px 30px rgba(15,29,56,.10)' }}>
      <div className="flex items-center justify-between">
        <div className="text-[15px] font-bold" style={{ fontFamily: SERIF, color: NAVY }}>📝 本試験 記述式の予想</div>
        <span className="text-[10.5px] font-bold px-2 py-0.5 rounded-full" style={{ background: '#f3ead6', color: '#7a5b22' }}>速報版</span>
      </div>

      <div className="grid grid-cols-3 gap-2 mt-3">
        {problems.map((p) => {
          const s = scores[p]
          const has = typeof s === 'number'
          return (
            <div key={p} className="rounded-xl py-2.5 text-center" style={{ background: CREAM, border: '1px solid #e7e0d0' }}>
              <div className="text-[11px] text-gray-500">{p}</div>
              <div className="leading-tight" style={{ fontFamily: SERIF, color: has ? NAVY : '#9a9a9a', fontSize: 22, fontWeight: 700 }}>{has ? fmt(s) : '—'}</div>
              <div className="text-[10px] text-gray-400">{has ? `/ ${WRITTEN_MAX_PER_PROBLEM}` : '未採点'}</div>
            </div>
          )
        })}
      </div>

      <div className="flex items-baseline justify-between mt-3 px-1">
        <span className="text-[12.5px] text-gray-600">記述 予想合計</span>
        <span style={{ fontFamily: SERIF, color: NAVY }}><b className="text-[24px]">{fmt(written)}</b><span className="text-[12px] text-gray-500"> / {writtenMax}点</span></span>
      </div>
      {unscored.length > 0 && (
        <div className="text-[10.5px] text-gray-400 px-1">{unscored.join('・')}は未採点(0点として合計しています)</div>
      )}

      <div className="mt-3 rounded-xl px-3 py-2.5" style={{ background: CREAM, border: '1px solid #e7e0d0' }}>
        <label className="block text-[12px] text-gray-600 mb-1">択一(マーク)の自己採点 <span className="text-gray-400">(0〜{MC_MAX}点・任意)</span></label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            inputMode="numeric"
            min={0}
            max={MC_MAX}
            step={1}
            value={mcInput}
            onChange={e => onMcChange(e.target.value)}
            placeholder="例: 150"
            className="w-28 rounded-lg px-3 py-2 text-[16px] text-gray-800 bg-white outline-none"
            style={{ border: `1.5px solid ${GOLD}` }}
          />
          <span className="text-[13px] text-gray-600">点</span>
          {mcInput.trim() !== '' && mc === null && <span className="text-[11px] text-red-600 font-bold">0〜{MC_MAX}で入力</span>}
        </div>
      </div>

      {total !== null
        ? (
          <div className="mt-3 rounded-xl px-3 py-3 text-center" style={{ background: 'linear-gradient(160deg,#0f1d38 0%,#1b3160 100%)' }}>
            <div className="text-[11px]" style={{ color: 'rgba(244,231,200,.8)' }}>合計(択一 {mc} + 記述予想 {fmt(written)})</div>
            <div style={{ fontFamily: SERIF, color: GOLD_LIGHT }}><b className="text-[30px] leading-tight">{fmt(total)}</b><span className="text-[13px]"> / 300点</span></div>
            <div className="mt-1 text-[13px] font-bold" style={{ color: '#f4e7c8' }}>
              {total >= PASS_LINE ? `合格ライン${PASS_LINE}点 超え🌸` : `合格ライン${PASS_LINE}点まで あと${fmt(PASS_LINE - total)}点`}
            </div>
          </div>
        )
        : (
          <div className="mt-2 text-[11px] text-gray-400 px-1">択一の点を入れると、合計と合格ライン({PASS_LINE}点)までの差が出ます</div>
        )}

      <div className="flex gap-2 mt-3">
        <a
          href={tweetUrl(shareText)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-1.5 rounded-xl px-3 py-3 text-[14px] font-bold text-white"
          style={{ background: '#000' }}
        >
          <XIcon size={15} /> Xに投稿
        </a>
        <a
          href={lineUrl(lineText)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-1.5 rounded-xl px-3 py-3 text-[14px] font-bold text-white"
          style={{ background: '#06C755' }}
        >
          <LineIcon size={16} /> LINEで送る
        </a>
      </div>
      <button
        type="button"
        onClick={async () => { const ok = await copyText(instaText); onCopied?.(ok) }}
        className="w-full mt-2 rounded-xl px-3.5 py-2.5 text-[13px] font-bold bg-white"
        style={{ color: NAVY, border: '1px solid #e7e0d0' }}
      >
        インスタ用の短い文をコピー
      </button>
      <div className="mt-2 text-[10.5px] leading-[1.7] text-gray-400">※AIによる予想採点のため、実際の得点とは異なる場合があります。注記: 速報版の予想採点です(各予備校の模範解答ベース)。確定版は11/22</div>
    </div>
  )
}
