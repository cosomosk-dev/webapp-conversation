'use client'
import type { FC } from 'react'
import React from 'react'
import StreamdownMarkdown from '@/app/components/base/streamdown-markdown'

// コスモスK(デザインA: ネイビー×ゴールド)用の表示部品。
// Difyの文章を読み取って見た目だけ整える。読み取れない場合は従来どおりの文章表示に戻す。

export const NAVY = '#13254a'
export const GOLD = '#b8914a'
export const GOLD_LIGHT = '#f1d79a'
export const CREAM = '#f6f3ec'
export const SERIF = '"Hiragino Mincho ProN","Yu Mincho","Noto Serif JP","Noto Serif CJK JP",serif'

type Mark = 'ok' | 'part' | 'ng'
export interface GradeItem { mark: Mark, label: string, max: number, got: number }
export interface Grade { items: GradeItem[], total: number, rest: string }

const NUM = '(\\d+(?:\\.\\d+)?)'
const PT_RE = new RegExp(`配点\\s*${NUM}\\s*点?\\s*[/／]\\s*得点\\s*${NUM}\\s*点`)

export function parseGrade(content: string): Grade | null {
  if (!content || !content.includes('採点結果')) { return null }
  const lines = content.split('\n')
  const used = new Set<number>()
  const items: GradeItem[] = []
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^\s*(?:[-*・]\s*)?(✅|🔺|❌)\s*(.*)$/)
    if (!m) { continue }
    let pt: RegExpMatchArray | null = null
    let ptLine = -1
    for (let j = i; j <= Math.min(i + 2, lines.length - 1); j++) {
      const p = lines[j].match(PT_RE)
      if (p) { pt = p; ptLine = j; break }
    }
    if (!pt) { continue }
    let label = m[2]
    if (ptLine === i) { label = label.replace(PT_RE, '') }
    label = label.replace(/\*\*/g, '').replace(/[→\s　]+$/g, '').replace(/^[\s　]+/, '').replace(/\(部分点\)|（部分点）/g, '').trim()
    items.push({ mark: m[1] === '✅' ? 'ok' : m[1] === '🔺' ? 'part' : 'ng', label, max: Number(pt[1]), got: Number(pt[2]) })
    for (let k = i; k <= ptLine; k++) { used.add(k) }
  }
  if (items.length === 0) { return null }
  let total = -1
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i]
    if (l.includes('📋') || l.includes('🧮')) { used.add(i); continue }
    if (l.includes('採点結果')) {
      const s = l.match(/(\d{1,2}(?:\.\d+)?)\s*[/／]\s*20/)
      if (s) { total = Number(s[1]) }
      used.add(i)
    }
  }
  if (total < 0) { total = items.reduce((a, b) => a + b.got, 0) }
  if (!(total >= 0 && total <= 20)) { return null }
  const rest = lines.filter((_, i) => !used.has(i)).join('\n').replace(/^(\s*-{3,}\s*\n)+/, '').trim()
  return { items, total, rest }
}

const verdictOf = (s: number) => {
  if (s >= 18) { return ['お見事!', '合格答案のレベルです。'] }
  if (s >= 14) { return ['あと一歩!', '要素は押さえられています。足りない1語を足しましょう。'] }
  if (s >= 8) { return ['部分点ゲット', '△の要素を言い切れば一気に伸びます。'] }
  return ['ここから伸ばそう', '下の「満点へのひと言」から1語ずつ足していきましょう。']
}

const MarkIcon: FC<{ mark: Mark }> = ({ mark }) => {
  const bg = mark === 'ok' ? '#2f7d5b' : mark === 'part' ? '#c58a1d' : '#b23b3b'
  const ch = mark === 'ok' ? '✓' : mark === 'part' ? '△' : '✕'
  return <span className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[12px] font-bold text-white" style={{ background: bg }}>{ch}</span>
}

const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1))

export const GradeCard: FC<{ grade: Grade }> = ({ grade }) => {
  const { items, total, rest } = grade
  const r = 44
  const c = 2 * Math.PI * r
  const ratio = Math.max(0, Math.min(1, total / 20))
  const [v1, v2] = verdictOf(total)
  const okN = items.filter(i => i.mark === 'ok').length
  const partN = items.filter(i => i.mark === 'part').length
  const ngN = items.filter(i => i.mark === 'ng').length
  return (
    <div className="rounded-2xl bg-white border p-4" style={{ borderColor: '#e7e0d0', boxShadow: '0 10px 30px rgba(15,29,56,.10)' }}>
      <div className="flex items-center gap-4">
        <div className="relative shrink-0" style={{ width: 104, height: 104 }}>
          <svg viewBox="0 0 104 104" width={104} height={104} style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="52" cy="52" r={r} fill="none" stroke="#efe7d6" strokeWidth="9" />
            <circle cx="52" cy="52" r={r} fill="none" stroke={GOLD} strokeWidth="9" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - ratio)} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <b className="leading-none" style={{ fontFamily: SERIF, fontSize: 34, color: NAVY }}>{fmt(total)}</b>
            <small className="text-[11px] text-gray-500">/ 20点</small>
          </div>
        </div>
        <div className="min-w-0">
          <div className="text-[18px] font-bold" style={{ fontFamily: SERIF, color: NAVY }}>{v1}</div>
          <div className="text-[12px] text-gray-500 mt-1 leading-relaxed">{v2}</div>
          <div className="flex gap-1.5 mt-2 text-[11px] font-bold">
            <span className="px-2 py-0.5 rounded-full" style={{ background: '#e8f3ed', color: '#2f7d5b' }}>✓ {okN}</span>
            <span className="px-2 py-0.5 rounded-full" style={{ background: '#fbf1dd', color: '#a06d0f' }}>△ 部分点 {partN}</span>
            <span className="px-2 py-0.5 rounded-full" style={{ background: '#f8e6e6', color: '#b23b3b' }}>✕ {ngN}</span>
          </div>
        </div>
      </div>
      <div className="mt-4 text-[11px] text-gray-500 mb-2">採点基準ごとの判定</div>
      <div className="flex flex-col gap-2">
        {items.map((it, i) => (
          <div key={i} className="flex items-start gap-2.5 rounded-xl px-3 py-2.5" style={{ background: CREAM, border: '1px solid #e7e0d0' }}>
            <MarkIcon mark={it.mark} />
            <div className="flex-1 min-w-0 text-[13px] leading-snug text-gray-800">
              {it.label}
              {it.mark === 'part' && <span className="ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: '#fbf1dd', color: '#a06d0f' }}>部分点</span>}
            </div>
            <div className="shrink-0 text-[12.5px] font-bold whitespace-nowrap" style={{ color: it.mark === 'ok' ? '#2f7d5b' : it.mark === 'part' ? '#a06d0f' : '#b23b3b' }}>{fmt(it.got)} / {fmt(it.max)}</div>
          </div>
        ))}
      </div>
      {rest && (
        <div className="mt-4 pt-3 text-sm text-gray-900 [&_h2]:!text-[15px] [&_h3]:!text-[15px] [&_h2]:!mt-4 [&_h3]:!mt-4 [&_h2]:!mb-1 [&_h3]:!mb-1 [&_h3]:font-bold" style={{ borderTop: '1px solid #efe7d6' }}>
          <StreamdownMarkdown content={rest} />
        </div>
      )}
    </div>
  )
}

export const isQuestion = (content: string) => /^\s*【問題】/.test(content || '')

export const QuestionCard: FC<{ content: string }> = ({ content }) => {
  const body = content.replace(/^\s*【問題】\s*/, '')
  return (
    <div className="rounded-2xl bg-white border p-4" style={{ borderColor: '#e7e0d0', boxShadow: '0 10px 30px rgba(15,29,56,.10)' }}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[16px] font-bold" style={{ fontFamily: SERIF, color: NAVY }}>【問題】</span>
        <span className="text-[11px] font-bold px-2.5 py-1 rounded-full" style={{ background: '#f3ead6', color: '#7a5b22' }}>記述式 ・ 40字程度</span>
      </div>
      <div className="text-[14.5px] leading-[1.95] text-gray-800 whitespace-pre-wrap">{body}</div>
    </div>
  )
}
