'use client'
import type { FC } from 'react'
import React from 'react'
import { CREAM, GOLD, GOLD_LIGHT, NAVY, SERIF } from '@/app/components/cosmos/cards'
import { ShareButtons } from '@/app/components/cosmos/share-buttons'

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
/** 送信文面から答案本体だけ取り出す(表示用)。後ろに付けた採点基準は見せない */
export const examAnswerOf = (message: string): string => {
  const body = (message || '').trim().replace(EXAM_PREFIX_RE, '')
  const cut = body.indexOf(RUBRIC_HEAD)
  return (cut >= 0 ? body.slice(0, cut) : body).trim()
}

// ---- 本試験の採点基準(速報) ----
// 採点基準はアプリの更新なしで差し替えられるよう、GitHubの別ブランチ exam-rubric の
// exam-rubric.json に置く(Claudeの予約タスクが試験当日の夜に予備校の解答例から作って更新する)。
// 送信時にその問の基準を取りに行き、答案の後ろに付けてDifyへ送る。取れなければ答案だけ送る(Dify側が「準備中」と返す)。
export const RUBRIC_HEAD = '【採点基準(速報)】'
export const RUBRIC_URL = 'https://raw.githubusercontent.com/cosomosk-dev/webapp-conversation/exam-rubric/exam-rubric.json'
export const fetchExamRubric = async (problem: string): Promise<string | null> => {
  try {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), 5000)
    const res = await fetch(`${RUBRIC_URL}?t=${Math.floor(Date.now() / 60000)}`, { signal: ctrl.signal, cache: 'no-store' })
    clearTimeout(timer)
    if (!res.ok) { return null }
    const json = await res.json()
    const r = json?.problems?.[problem]
    return (typeof r === 'string' && r.trim()) ? r.trim() : null
  }
  catch {
    return null
  }
}

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
  // インスタはURLが押せない(ストーリーズ・フィードの文中)ので、URLなし・ハッシュタグなしの短文。
  // 「Google Playで検索」と、監修者アカウントのメンション(タップでプロフィールへ)で案内する
  if (channel === 'insta') {
    const ig = ['行政書士試験 自己採点📝', `記述AI予想 ${fmt(written)}点（${detail}）`]
    if (mc !== null)
      ig.push(`択一${mc}点＋記述${fmt(written)}点＝合計${fmt(mc + written)}点`)
    ig.push('採点はアプリ「コスモスK」(無料・登録不要)', 'Google Playで「コスモスK」と検索', `リンクは ${INSTAGRAM_HANDLE} のプロフィールに`)
    return ig.join('\n')
  }
  // 1行目は点数と離した普通の見出し。ハッシュタグはXだけ、最後の行にまとめて置く(点数の行には混ぜない)
  const lines = ['行政書士試験 自己採点📝']
  if (mc !== null) {
    lines.push(`択一 ${mc}点 ／ 記述AI予想 ${fmt(written)}点(${detail})`)
    lines.push(`合計 ${fmt(mc + written)}点(合格ライン${PASS_LINE})`)
  }
  else {
    lines.push(`記述AI予想 ${fmt(written)}点(${detail})`)
  }
  lines.push(`記述の採点はコスモスK(無料・登録不要) ${storeUrl}&referrer=${utm}`)
  if (channel === 'x')
    lines.push('#行政書士試験 #コスモスK')
  return lines.join('\n')
}

/** 流入元の計測: X用のutm(utm_medium=x)をLINE用(utm_medium=line)に置き換える */
export const toLineUtm = (utm: string) => utm.replace('utm_medium%3Dx', 'utm_medium%3Dline')

export { copyText, lineUrl, tweetUrl } from '@/app/components/cosmos/share'
export { InstagramIcon, LineIcon, XIcon } from '@/app/components/cosmos/share-buttons'

/** 本試験の結果カードで★評価のお願いを出す点数(1問20点満点) */
export const REVIEW_MIN_EXAM_SCORE = 15

export const ExamResultCard: FC<{
  problems: readonly string[]
  scores: ExamScores
  mcInput: string
  onMcChange: (v: string) => void
  storeUrl: string
  utm: string
}> = ({ problems, scores, mcInput, onMcChange, storeUrl, utm }) => {
  const written = writtenTotal(problems, scores)
  const writtenMax = problems.length * WRITTEN_MAX_PER_PROBLEM
  const mcNum = mcInput.trim() === '' ? null : Number(mcInput)
  const mc = (mcNum !== null && Number.isFinite(mcNum) && mcNum >= 0 && mcNum <= MC_MAX) ? Math.floor(mcNum) : null
  const total = mc !== null ? mc + written : null
  const shareText = buildExamShareText({ problems, scores, mc, storeUrl, utm })
  const lineText = buildExamShareText({ problems, scores, mc, storeUrl, utm: toLineUtm(utm), channel: 'line' })
  const instaText = buildExamShareText({ problems, scores, mc, storeUrl, utm, channel: 'insta' })
  const unscored = problems.filter(p => typeof scores[p] !== 'number')
  // 評価のお願いは、どれか1問で15点以上を取った人にだけ出す(低い点の直後に頼むと★1になりやすいため。練習モードの15点ルールと同じ)
  const showReview = problems.some(p => typeof scores[p] === 'number' && (scores[p] as number) >= REVIEW_MIN_EXAM_SCORE)

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

      <ShareButtons className="mt-3" testIdPrefix="exam-share" texts={{ line: lineText, x: shareText, instagram: instaText }} />
      {showReview && (
        <div className="mt-3 rounded-xl px-3 py-3 text-center" style={{ background: CREAM, border: `1px solid ${GOLD}` }}>
          <div className="text-[13px] font-bold" style={{ color: NAVY }}>本試験の採点、役に立ちましたか？</div>
          <div className="text-[11.5px] text-gray-600 mt-1 leading-[1.6]">登録不要・無料で使える速報採点です。<br />★で応援してもらえると、来年の受験生にも届きます</div>
          <a
            href={storeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-[14px] font-bold"
            style={{ background: GOLD, color: NAVY }}
          >
            ★ Google Playで評価する
          </a>
        </div>
      )}
      <div className="mt-2 text-[10.5px] leading-[1.7] text-gray-400">※AIによる予想採点のため、実際の得点とは異なる場合があります。注記: 速報版の予想採点です(各予備校の模範解答ベース)。確定版は11/22</div>
    </div>
  )
}
