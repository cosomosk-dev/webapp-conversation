'use client'
import type { FC } from 'react'
import React, { useEffect, useRef } from 'react'
import { flushSync } from 'react-dom'
import cn from 'classnames'
import { useTranslation } from 'react-i18next'
import Textarea from 'rc-textarea'
import Answer from './answer'
import Question from './question'
import { CREAM, GOLD, GOLD_LIGHT, NAVY, SERIF, isQuestion } from '@/app/components/cosmos/cards'
import type { FeedbackFunc } from './type'
import type { ChatItem, VisionFile, VisionSettings } from '@/types/app'
import { TransferMethod } from '@/types/app'
import Toast from '@/app/components/base/toast'
import { useImageFiles } from '@/app/components/base/image-uploader/hooks'
import type { FileEntity, FileUpload } from '@/app/components/base/file-uploader-in-attachment/types'
import { getProcessedFiles } from '@/app/components/base/file-uploader-in-attachment/utils'

export interface IChatProps {
  chatList: ChatItem[]
  /**
   * Whether to display the editing area and rating status
   */
  feedbackDisabled?: boolean
  /**
   * Whether to display the input area
   */
  isHideSendInput?: boolean
  onFeedback?: FeedbackFunc
  checkCanSend?: () => boolean
  onSend?: (message: string, files: VisionFile[]) => void
  useCurrentUserAvatar?: boolean
  isResponding?: boolean
  controlClearQuery?: number
  visionConfig?: VisionSettings
  fileConfig?: FileUpload
}

const Chat: FC<IChatProps> = ({
  chatList,
  feedbackDisabled = false,
  isHideSendInput = false,
  onFeedback,
  checkCanSend,
  onSend = () => { },
  useCurrentUserAvatar,
  isResponding,
  controlClearQuery,
}) => {
  const { t } = useTranslation()
  const { notify } = Toast
  const isUseInputMethod = useRef(false)

  const [query, setQuery] = React.useState('')
  const queryRef = useRef('')

  const handleContentChange = (e: any) => {
    const value = e.target.value
    setQuery(value)
    queryRef.current = value
  }

  const logError = (message: string) => {
    notify({ type: 'error', message, duration: 3000 })
  }

  const valid = () => {
    const query = queryRef.current
    if (!query || query.trim() === '') {
      logError(t('app.errorMessage.valueOfVarRequired'))
      return false
    }
    return true
  }

  useEffect(() => {
    if (controlClearQuery) {
      setQuery('')
      queryRef.current = ''
    }
  }, [controlClearQuery])
  const { files, onClear } = useImageFiles()

  const [attachmentFiles, setAttachmentFiles] = React.useState<FileEntity[]>([])

  // ---- キーボード表示時のオフセット(visualViewport fallback) ----
  const [keyboardOffset, setKeyboardOffset] = React.useState(0)
  const [viewBox, setViewBox] = React.useState<{ top: number, height: number } | null>(null) // いま見えている範囲(キーボードを除く)
  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) { return }
    const handleResize = () => {
      const offset = window.innerHeight - vv.height - vv.offsetTop
      setKeyboardOffset(Math.max(0, Math.round(offset)))
      setViewBox({ top: Math.max(0, Math.round(vv.offsetTop)), height: Math.round(vv.height) })
    }
    vv.addEventListener('resize', handleResize)
    vv.addEventListener('scroll', handleResize)
    handleResize()
    return () => {
      vv.removeEventListener('resize', handleResize)
      vv.removeEventListener('scroll', handleResize)
    }
  }, [])

  // ---- 無料枠(累計5回)のカウンター ----
  const FREE_LIMIT = 10
  const QUOTA_KEY = 'cosmosk_free_used'
  const REVIEW_ENABLED = true // 不調時はfalseにすればレビューリンクを即停止できる
  const REVIEW_KEY = 'cosmosk_review_prompt_shown'
  const REVIEW_COUNT_KEY = 'cosmosk_grade_success'
  const readUsed = (): number => {
    try { return Number(localStorage.getItem(QUOTA_KEY)) || 0 }
    catch { return 0 }
  }
  const [usedToday, setUsedToday] = React.useState(0)
  const [premium, setPremium] = React.useState(false)
  const [showReviewLink, setShowReviewLink] = React.useState(false)
  const [showPaywall, setShowPaywall] = React.useState(false)
  const [isNativeApp, setIsNativeApp] = React.useState(false)

  const checkPremium = () => {
    try {
      const isPremium = localStorage.getItem('cosmosk_premium') === '1'
      setPremium(isPremium)
      if (isPremium) { setShowPaywall(false) }
    }
    catch { }
  }

  const checkNativeRef = React.useRef(() => {
    const detected = !!(window as any).CosmosBilling
    setIsNativeApp(detected)
    return detected
  })

  useEffect(() => {
    setUsedToday(readUsed())
    checkPremium()
    const checkNative = checkNativeRef.current
    checkNative()
    window.addEventListener('nativeAppReady', checkNative)
    window.addEventListener('cosmosk_premium_changed', checkPremium)
    const retryTimer = setInterval(() => {
      if (checkNative()) { clearInterval(retryTimer) }
    }, 500)
    const cleanupTimer = setTimeout(() => clearInterval(retryTimer), 5000)
    return () => {
      window.removeEventListener('nativeAppReady', checkNative)
      window.removeEventListener('cosmosk_premium_changed', checkPremium)
      clearInterval(retryTimer)
      clearTimeout(cleanupTimer)
    }
  }, [])
  const remaining = Math.max(0, FREE_LIMIT - usedToday)
  const chargePendingRef = React.useRef(false) // 無料枠を1つ消費した送信(失敗時の返金用)
  const gradePendingRef = React.useRef(false) // 答案を送った(課金済みでも立つ。採点後の記録・レビューリンク用)
  const refundUsed = () => {
    const u = readUsed()
    const next = Math.max(0, u - 1)
    try { localStorage.setItem(QUOTA_KEY, String(next)) }
    catch { }
    setUsedToday(next)
  }
  useEffect(() => {
    if (isResponding || !gradePendingRef.current)
    { return }
    gradePendingRef.current = false
    const wasCharged = chargePendingRef.current
    chargePendingRef.current = false
    const last = chatList[chatList.length - 1]
    if (last && last.isAnswer && (!last.content || !last.content.trim())) {
      if (wasCharged) { refundUsed() }
    }
    else {
      // ホーム画面の「採点した数・平均点」用に記録(端末内のみ)
      try {
        const sm = String(last?.content || '').match(/採点結果[^\n]*?(\d{1,2}(?:\.\d+)?)\s*[/／]\s*20/)
        if (sm) {
          const sc = Number(sm[1])
          if (sc >= 0 && sc <= 20) {
            const v = JSON.parse(localStorage.getItem('cosmosk_stats') || '{}')
            localStorage.setItem('cosmosk_stats', JSON.stringify({ n: (Number(v.n) || 0) + 1, sum: (Number(v.sum) || 0) + sc }))
          }
        }
      }
      catch { }
      if (REVIEW_ENABLED) {
        try {
          const n = (Number(localStorage.getItem(REVIEW_COUNT_KEY)) || 0) + 1
          localStorage.setItem(REVIEW_COUNT_KEY, String(n))
          // 12点以上(20点満点)を取った採点の直後に表示。見た目・位置は従来のまま
          // 小数の点数(14.5/20など)も正しく読む
          const scoreRe = /(\d{1,2}(?:\.\d+)?)\s*[/／]\s*20/g
          const text = String(last?.content || '')
          let score = -1
          let m: RegExpExecArray | null
          while ((m = scoreRe.exec(text)) !== null) { score = Number(m[1]) }
          if (n >= 1 && score >= 12 && score <= 20) {
            setShowReviewLink(true)
          }
        }
        catch { }
      }
    }
  }, [isResponding])

  const handleSend = () => {
    if (isResponding) { return }
    if (!valid() || (checkCanSend && !checkCanSend())) { return }
    const hasPendingImageUploads = files.some(file => file.progress !== -1 && file.progress < 100)
    const hasPendingAttachmentUploads = attachmentFiles.some(file => file.progress !== -1 && file.progress < 100)
    if (hasPendingImageUploads || hasPendingAttachmentUploads) {
      logError(t('app.errorMessage.waitForFileUpload'))
      return
    }
    const trimmedQuery = queryRef.current.trim()
    if (!trimmedQuery) { return }
    // 答案の送信だけ無料枠を消費する(「出題スタート」はノーカウント・累計制)
    const isAnswerSend = trimmedQuery !== '出題スタート'
    if (isAnswerSend && !premium) {
      const used = readUsed()
      if (used >= FREE_LIMIT) {
        setUsedToday(used)
        checkNativeRef.current()
        setShowPaywall(true)
        return
      }
      try { localStorage.setItem(QUOTA_KEY, String(used + 1)) }
      catch { }
      chargePendingRef.current = true
      setUsedToday(used + 1)
    }
    if (isAnswerSend) { gradePendingRef.current = true }
    const imageFiles: VisionFile[] = files.filter(file => file.progress !== -1).map(fileItem => ({
      type: 'image',
      transfer_method: fileItem.type,
      url: fileItem.url,
      upload_file_id: fileItem.fileId,
    }))
    const docAndOtherFiles: VisionFile[] = getProcessedFiles(attachmentFiles)
    const combinedFiles: VisionFile[] = [...imageFiles, ...docAndOtherFiles]
    onSend(trimmedQuery, combinedFiles)
    if (!files.find(item => item.type === TransferMethod.local_file && !item.fileId)) {
      if (files.length) { onClear() }
      if (!isResponding) {
        setQuery('')
        queryRef.current = ''
      }
    }
    if (!attachmentFiles.find(item => item.transferMethod === TransferMethod.local_file && !item.uploadedId)) { setAttachmentFiles([]) }
  }

  const handleKeyUp = (e: any) => {
    if (e.code === 'Enter') {
      e.preventDefault()
      if (!e.shiftKey && !isUseInputMethod.current && !isResponding) {
        sendAnswer()
      }
    }
  }

  const handleKeyDown = (e: any) => {
    isUseInputMethod.current = e.nativeEvent.isComposing
    if (e.code === 'Enter' && !e.shiftKey) {
      const result = query.replace(/\n$/, '')
      setQuery(result)
      queryRef.current = result
      e.preventDefault()
    }
  }

  const suggestionClick = (suggestion: string) => {
    setQuery(suggestion)
    queryRef.current = suggestion
    handleSend()
  }

  // 新しい会話(まだ自分の送信がない)のときはホーム画面を出す
  const hasUserMessage = chatList.some(item => !item.isAnswer)

  // ---- 画面の流れ ----
  // 答案は全画面のシートで書く(問題文を見ながら入力)。採点中〜採点後は入力欄を出さず、解説を画面いっぱいに見せる。
  // 注記・監修者リンク・プライバシーポリシーは画面の一番下(スクロールの最後)に置く。
  // いまどの場面か: 出題待ち / 答案を書く / 採点待ち / 採点結果を読む
  const lastItem = chatList[chatList.length - 1]
  const lastUserItem = [...chatList].reverse().find(item => !item.isAnswer)
  const lastIsStart = !!lastUserItem && lastUserItem.content.trim() === '出題スタート'
  const lastQuestionItem = [...chatList].reverse().find(item => item.isAnswer && isQuestion(item.content))
  const phase: 'home' | 'asking' | 'answering' | 'grading' | 'graded' = !hasUserMessage
    ? 'home'
    : isResponding
      ? (lastIsStart ? 'asking' : 'grading')
      : (lastIsStart ? 'answering' : 'graded')
  const questionReady = phase === 'answering' && !!lastItem?.isAnswer && !!lastItem.content
  const canSaveLast = phase === 'graded' && !!lastItem?.isAnswer && !!lastItem.content

  const blurActive = () => {
    try { (document.activeElement as HTMLElement | null)?.blur?.() }
    catch { }
  }

  // 全画面の答案シート。端末の「戻る」でも閉じられるよう履歴を1つ積む
  // 全画面の答案シート(パターン3)。端末の「戻る」でも閉じられるよう履歴を1つ積む
  const [sheetOpen, setSheetOpen] = React.useState(false)
  const sheetInputRef = useRef<any>(null)
  const openSheet = () => {
    flushSync(() => setSheetOpen(true))
    try { sheetInputRef.current?.focus() }
    catch { }
    try { window.history.pushState({ cosmosSheet: 1 }, '') }
    catch { }
  }
  const closeSheet = () => {
    setSheetOpen(false)
    blurActive()
    try {
      if (window.history.state?.cosmosSheet) { window.history.back() }
    }
    catch { }
  }
  useEffect(() => {
    if (!sheetOpen) { return }
    const onPop = () => {
      setSheetOpen(false)
      blurActive()
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [sheetOpen])

  // 書き直し: 直前の答案を入れた状態で開く(1語足すだけで済むように)
  const openRewrite = () => {
    if (!queryRef.current.trim() && lastUserItem && !lastIsStart) {
      setQuery(lastUserItem.content)
      queryRef.current = lastUserItem.content
    }
    openSheet()
  }

  // 送信したらキーボードを閉じる(採点結果をキーボードで隠さない)
  const sendAnswer = () => {
    if (isResponding || !queryRef.current.trim()) { return }
    handleSend()
    blurActive()
    if (sheetOpen) { closeSheet() }
  }

  // 採点が終わったら「あなたの答案」の位置まで戻して、点数から読めるようにする
  const lastUserDomRef = useRef<HTMLDivElement>(null)
  const wasRespondingRef = useRef(false)
  useEffect(() => {
    const was = wasRespondingRef.current
    wasRespondingRef.current = !!isResponding
    if (!was || isResponding || lastIsStart) { return }
    const timer = setTimeout(() => {
      try { lastUserDomRef.current?.scrollIntoView({ block: 'start' }) }
      catch { }
    }, 150)
    return () => clearTimeout(timer)
  }, [isResponding])

  const saveFavAt = (idx: number) => {
    const item = chatList[idx]
    const prevUser = chatList[idx - 1]
    const prevQ = chatList[idx - 2]
    if (!item || !prevUser) { return }
    try {
      const favs: { id: string, content: string, date: string }[] = JSON.parse(localStorage.getItem('cosmosk_favs') || '[]')
      if (favs.some(f => f.id === item.id)) {
        notify({ type: 'info', message: 'この問題はすでに保存済みです', duration: 2000 })
        return
      }
      const content = [
        (prevQ && prevQ.isAnswer) ? `## 【問題】\n\n${prevQ.content}` : '',
        `## 【あなたの答案】\n\n${prevUser.content}`,
        `## 【採点結果】\n\n${item.content}`,
      ].filter(Boolean).join('\n\n---\n\n')
      favs.unshift({ id: item.id, content, date: new Date().toLocaleString('ja-JP') })
      localStorage.setItem('cosmosk_favs', JSON.stringify(favs))
      notify({ type: 'success', message: '⭐ お気に入りに保存しました', duration: 2000 })
    }
    catch {
      notify({ type: 'error', message: '保存に失敗しました', duration: 2000 })
    }
  }
  const [showHowTo, setShowHowTo] = React.useState(false)
  const [stats, setStats] = React.useState<{ n: number, sum: number }>({ n: 0, sum: 0 })
  useEffect(() => {
    try {
      const v = JSON.parse(localStorage.getItem('cosmosk_stats') || '{}')
      setStats({ n: Number(v.n) || 0, sum: Number(v.sum) || 0 })
    }
    catch { }
  }, [hasUserMessage])
  // 「新しくなりました」のお知らせ(使ったことがある人に1回だけ。新規の人には出さない)
  const WHATSNEW_KEY = 'cosmosk_whatsnew_seen'
  const WHATSNEW_ID = '2026-10-13'
  const [showWhatsNew, setShowWhatsNew] = React.useState(false)
  useEffect(() => {
    try {
      if (localStorage.getItem(WHATSNEW_KEY) === WHATSNEW_ID) { return }
      const returning = ['cosmosk_free_used', 'cosmosk_grade_success', 'cosmosk_favs', 'cosmosk_premium'].some(k => localStorage.getItem(k) !== null)
      if (returning) { setShowWhatsNew(true) }
      else { localStorage.setItem(WHATSNEW_KEY, WHATSNEW_ID) }
    }
    catch { }
  }, [])
  const closeWhatsNew = () => {
    try { localStorage.setItem(WHATSNEW_KEY, WHATSNEW_ID) }
    catch { }
    setShowWhatsNew(false)
  }
  const daysToExam = (() => {
    const exam = new Date('2026-11-08T00:00:00+09:00').getTime()
    const d = Math.ceil((exam - Date.now()) / 86400000)
    return d
  })()
  const avg = stats.n > 0 ? (stats.sum / stats.n).toFixed(1) : '—'

  return (
    <div className={cn(!feedbackDisabled && 'px-3.5', 'min-h-full -mb-[90px]')}>
      {hasUserMessage && <a href="/favorites" className="fixed z-20 top-[54px] right-3 text-xs font-bold rounded-full px-3 py-1 shadow-sm" style={{ background: '#fff', color: NAVY, border: '1px solid #e7e0d0' }}>★ 保存した問題</a>}
      {!hasUserMessage && (
        <div className="-mx-3.5 -mt-[68px] pb-10">
          <div className="px-5 pt-4 pb-16 rounded-b-[28px]" style={{ background: 'linear-gradient(160deg,#0f1d38 0%,#1b3160 100%)', color: '#f4e7c8' }}>
            <div className="text-[12px] opacity-80">行政書士試験 記述式トレーニング</div>
            <h1 className="mt-2 text-[24px] leading-[1.45] font-bold" style={{ fontFamily: SERIF }}>40字で書いて、<br />その場で20点採点。</h1>
            <p className="text-[12.5px] opacity-80 mt-1.5">行政書士が監修した記述式92問 ・ 部分点つき</p>
            {daysToExam > 0 && (
              <div className="inline-flex items-center gap-1.5 mt-3 text-[12px] px-3 py-1 rounded-full" style={{ background: 'rgba(241,215,154,.14)', border: '1px solid rgba(241,215,154,.35)', color: GOLD_LIGHT }}>⏳ 本試験まで <b>{daysToExam}日</b></div>
            )}
          </div>
          <div className="px-4 -mt-11">
            <div className="grid grid-cols-3 gap-2.5">
              {[['92', '収録問題'], [String(stats.n), '採点した数'], [avg, '平均点']].map(([b, l]) => (
                <div key={l} className="bg-white rounded-2xl py-3 text-center" style={{ border: '1px solid #e7e0d0', boxShadow: '0 10px 30px rgba(15,29,56,.10)' }}>
                  <b className="block text-[22px] leading-tight" style={{ fontFamily: SERIF, color: NAVY }}>{b}</b>
                  <small className="text-[10.5px] text-gray-500">{l}</small>
                </div>
              ))}
            </div>
            <button
              onClick={() => suggestionClick('出題スタート')}
              disabled={!!isResponding}
              className={`mt-4 w-full rounded-[20px] px-5 py-5 flex items-center justify-between text-left ${isResponding ? 'opacity-50' : ''}`}
              style={{ background: 'linear-gradient(160deg,#0f1d38 0%,#1b3160 100%)', border: `1px solid ${GOLD}`, boxShadow: '0 10px 30px rgba(15,29,56,.18)' }}
            >
              <span>
                <span className="block text-[21px] font-bold tracking-wide" style={{ fontFamily: SERIF, color: GOLD_LIGHT }}>問題を解く</span>
                <span className="block text-[11.5px] mt-0.5" style={{ color: 'rgba(244,231,200,.8)' }}>ランダムに1問出題 ・ 時間制限なし</span>
              </span>
              <span className="w-12 h-12 rounded-full flex items-center justify-center text-lg" style={{ background: GOLD_LIGHT, color: NAVY }}>▶</span>
            </button>
            <div className="grid grid-cols-2 gap-2.5 mt-3">
              <a href="/favorites" className="bg-white rounded-2xl px-3 py-3 text-[13px] flex items-center gap-2" style={{ border: '1px solid #e7e0d0', color: '#1b2236' }}><span style={{ color: GOLD }}>★</span>保存した問題</a>
              <button onClick={() => setShowHowTo(v => !v)} className="bg-white rounded-2xl px-3 py-3 text-[13px] flex items-center gap-2 text-left" style={{ border: '1px solid #e7e0d0', color: '#1b2236' }}><span>📖</span>使い方</button>
            </div>
            {showHowTo && (
              <ol className="mt-3 bg-white rounded-2xl p-4 space-y-2 text-[13px] text-gray-700" style={{ border: '1px solid #e7e0d0' }}>
                {['「問題を解く」で記述式問題が1問出ます', '答案を40字以内で書いて送信', 'AIが20点満点で採点。採点基準ごとに✓・△(部分点)・✕と点数が出ます', '「▶ 次の問題」で続けられます。気になる問題は★で保存'].map((t, i) => (
                  <li key={i} className="flex gap-2"><span className="shrink-0 w-5 h-5 rounded-full text-[11px] font-bold flex items-center justify-center" style={{ background: NAVY, color: GOLD_LIGHT }}>{i + 1}</span><span>{t}</span></li>
                ))}
              </ol>
            )}
            <div className="mt-3 text-center text-[11.5px] text-gray-500">
              {premium ? '採点し放題プランをご利用中' : <>AI採点は無料で{FREE_LIMIT}回(<b style={{ color: GOLD }}>あと{remaining}回</b>)</>}
            </div>
            <a href="/about" className="mt-5 flex items-center gap-3 bg-white rounded-2xl px-4 py-3" style={{ border: '1px solid #e7e0d0' }}>
              <span className="w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0" style={{ background: NAVY, color: GOLD_LIGHT, border: `1.5px solid ${GOLD}` }}>監修</span>
              <span className="flex-1"><span className="block text-[11px] text-gray-500">企画・監修</span><span className="block text-[13.5px]" style={{ color: '#1b2236' }}>行政書士 加藤貴大</span></span>
              <span className="text-[11px]" style={{ color: GOLD }}>相談・感想 →</span>
            </a>
            <div className="mt-3 text-center text-[10px] text-gray-400">※AIによる採点のため、不正確な場合があります ・ <a href="/privacy" className="underline">プライバシーポリシー</a></div>
          </div>
        </div>
      )}
      {showWhatsNew && !showPaywall && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 px-6" onClick={closeWhatsNew}>
          <div className="w-full max-w-sm rounded-2xl overflow-hidden shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="px-5 pt-5 pb-4 text-center" style={{ background: 'linear-gradient(160deg,#0f1d38 0%,#1b3160 100%)' }}>
              <div className="text-[12px] font-bold" style={{ color: GOLD_LIGHT }}>✨ アップデートのお知らせ</div>
              <div className="mt-1 text-[20px] font-bold" style={{ fontFamily: SERIF, color: '#f4e7c8' }}>コスモスKが新しくなりました</div>
            </div>
            <div className="bg-white px-5 py-4">
              <ul className="space-y-2.5 text-[13.5px] text-gray-700">
                <li className="flex gap-2"><span style={{ color: GOLD }}>◆</span><span><b>採点結果が見やすく</b>。20点メーターと、採点基準ごとの ✓・<b>△部分点</b>・✕ を一目で</span></li>
                <li className="flex gap-2"><span style={{ color: GOLD }}>◆</span><span><b>ホーム画面</b>を新設。「問題を解く」ボタンひとつで出題</span></li>
                <li className="flex gap-2"><span style={{ color: GOLD }}>◆</span><span>採点した数・平均点・本試験までの日数を表示</span></li>
              </ul>
              <button onClick={() => { closeWhatsNew(); if (!hasUserMessage) { suggestionClick('出題スタート') } }} className="mt-4 w-full py-3 rounded-xl text-[14px] font-bold" style={{ background: 'linear-gradient(160deg,#0f1d38 0%,#1b3160 100%)', color: GOLD_LIGHT }}>{hasUserMessage ? 'OK' : '▶ さっそく1問解く'}</button>
              <button onClick={closeWhatsNew} className="mt-2 w-full py-2 text-[12px] text-gray-500">閉じる</button>
            </div>
          </div>
        </div>
      )}
      {showPaywall && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 px-6" onClick={() => setShowPaywall(false)}>
          <div className="w-full max-w-sm bg-white rounded-2xl p-5 shadow-lg text-center" onClick={e => e.stopPropagation()}>
            <div className="text-2xl mb-2">🌸</div>
            <div className="text-base font-bold text-gray-800 mb-2">無料の採点（{FREE_LIMIT}回分）は終了しました</div>
            <div className="text-sm text-gray-600 mb-4">採点し放題プラン（月500円）で、92問すべてを何度でも採点できます。<br />新しい問題を見るのは、このまま無料で続けられます。</div>
            {isNativeApp
              ? (
                <>
                  <button
                    onClick={() => { try { (window as any).CosmosBilling.subscribe() } catch { } }}
                    className="w-full py-2 rounded-full text-sm font-bold mb-2"
                    style={{ background: NAVY, color: GOLD_LIGHT }}
                  >
                    採点し放題プラン（月500円）に登録
                  </button>
                  <div className="text-xs text-gray-500 mb-2">※自動更新のプランです。いつでも解約でき、次回の更新日より前に解約すれば追加の請求はありません。（試験が終わっても自動では終了しないため、不要になったら解約してください）</div>
                  <a href="https://play.google.com/store/account/subscriptions" target="_blank" rel="noopener noreferrer" className="block text-xs text-blue-600 underline mb-4">サブスクリプションの管理・解約はこちら（Google Play）</a>
                </>
              )
              : (
                <div className="text-xs text-gray-400 mb-2">採点し放題プランは近日提供予定です</div>
              )}
            <button onClick={() => setShowPaywall(false)} className="w-full py-2 rounded-full border border-gray-300 text-gray-600 text-sm">閉じる</button>
          </div>
        </div>
      )}
      {/* Chat List */}
      <div className="space-y-[30px]">
        {chatList.map((item, idx) => {
          if (item.isAnswer) {
            const isLast = item.id === chatList[chatList.length - 1].id
            const prevUser = chatList[idx - 1]
            const isDone = !item.isOpeningStatement && !(isResponding && isLast) && !!item.content && !!prevUser && !prevUser.isAnswer
            const canSave = isDone && prevUser.content.trim() !== '出題スタート'
            const saveFav = () => saveFavAt(idx)
            // 最後の採点結果のボタンは画面下の固定バーに出す(問題の下の「次の問題」は残す)
            const showInlineActions = isDone && !(isLast && phase === 'graded')
            return (
              <div key={item.id}>
                <Answer
                  item={item}
                  feedbackDisabled={feedbackDisabled}
                  onFeedback={onFeedback}
                  isResponding={isResponding && isLast}
                  suggestionClick={suggestionClick}
                />
                {showInlineActions && (
                  <div className="mt-3 flex gap-2">
                    {canSave && <button onClick={saveFav} className="shrink-0 text-[13px] font-bold rounded-xl px-4 py-3 bg-white" style={{ color: NAVY, border: '1px solid #e7e0d0' }}>★ 保存</button>}
                    <button onClick={() => suggestionClick('出題スタート')} className="flex-1 text-[14px] font-bold rounded-xl px-4 py-3" style={{ background: 'linear-gradient(160deg,#0f1d38 0%,#1b3160 100%)', color: GOLD_LIGHT }}>▶ 次の問題</button>
                  </div>

                )}
              </div>
            )
          }
          return (
            <div key={item.id} ref={item.id === lastUserItem?.id ? lastUserDomRef : undefined} style={{ scrollMarginTop: 44 }}>
              <Question
                id={item.id}
                content={item.content}
                useCurrentUserAvatar={useCurrentUserAvatar}
                imgSrcs={(item.message_files && item.message_files?.length > 0) ? item.message_files.map(item => item.url) : []}
              />
            </div>
          )
        })}
      </div>
      {hasUserMessage && (
        <div className="mt-8 text-center text-[10.5px] leading-[1.9] text-gray-400">
          <div>※AIによる採点のため、不正確な場合があります</div>
          <div><a href="/about" className="underline" style={{ color: NAVY }}>📩 監修者に相談・感想 →</a></div>
          <div><a href="/about" className="text-gray-500 underline">👤企画・監修:行政書士 加藤貴大</a><span className="mx-1">・</span><a href="/privacy" className="text-gray-500 underline">プライバシーポリシー</a></div>
        </div>
      )}
      {!isHideSendInput && hasUserMessage && phase !== 'asking' && phase !== 'grading' && (() => {
        const wrapClass = 'fixed z-10 left-1/2 transform -translate-x-1/2 pc:ml-[122px] tablet:ml-[96px] mobile:ml-0 pc:w-[794px] tablet:w-[794px] max-w-full mobile:w-full px-3.5'
        const wrapStyle = {
          bottom: keyboardOffset > 0 ? `${keyboardOffset}px` : '0px',
          background: CREAM,
          borderTop: '1px solid #e7e0d0',
          paddingTop: '6px',
          paddingBottom: keyboardOffset > 0 ? '6px' : 'calc(env(safe-area-inset-bottom, 0px) + 6px)',
        }
        const navyBtn = { background: 'linear-gradient(160deg,#0f1d38 0%,#1b3160 100%)', color: GOLD_LIGHT }
        const whiteBtn = { color: NAVY, border: '1px solid #e7e0d0' }
        const freeLeft = !premium ? <span className="text-gray-500">無料採点 あと{remaining}回</span> : <span />
        const reviewLink = showReviewLink
          ? <a href="https://play.google.com/store/apps/details?id=com.cosmosk.app" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">🌸 Google Playで評価する</a>
          : null
        const infoLine = (reviewLink || !premium) && (
          <div className="flex items-center justify-between text-[11px] mb-1 px-1">{freeLeft}{reviewLink}</div>
        )
        if (phase === 'graded') {
          return (
            <div className={wrapClass} style={wrapStyle}>
              {infoLine}
              <div className="flex gap-2">
                {canSaveLast && <button type="button" onClick={() => saveFavAt(chatList.length - 1)} className="shrink-0 text-[13px] font-bold rounded-xl px-3.5 py-3 bg-white" style={whiteBtn}>★ 保存</button>}
                <button type="button" onClick={openRewrite} className="shrink-0 text-[13px] font-bold rounded-xl px-3.5 py-3 bg-white" style={whiteBtn}>✏️ 書き直す</button>
                <button type="button" onClick={() => suggestionClick('出題スタート')} className="flex-1 text-[14px] font-bold rounded-xl px-3 py-3" style={navyBtn}>▶ 次の問題</button>
              </div>
            </div>
          )
        }
        // 答案を書く場面。問題が届いていないときは出し直しボタンだけ出す
        return (
          <div className={wrapClass} style={wrapStyle}>
            {infoLine}
            {questionReady
              ? <button type="button" onClick={openSheet} className="w-full text-[15px] font-bold rounded-xl px-4 py-3.5" style={navyBtn}>✏️ 答案を書く{query.trim() ? '(続きから)' : ''}</button>
              : <button type="button" onClick={() => suggestionClick('出題スタート')} className="w-full text-[14px] font-bold rounded-xl px-4 py-3" style={navyBtn}>▶ 問題を出す</button>}
          </div>
        )
      })()}
      {sheetOpen && (
        <div className="fixed left-0 right-0 z-30 flex flex-col" style={{ top: viewBox ? `${viewBox.top}px` : 0, height: viewBox ? `${viewBox.height}px` : '100%', background: CREAM, overscrollBehavior: 'contain' }}>
          <div className="shrink-0" style={{ background: '#0f1d38' }}>
            <div className="flex items-center justify-between h-11 px-2 w-full max-w-[794px] mx-auto">
              <button type="button" onClick={closeSheet} className="text-[13px] font-bold px-2 py-2" style={{ color: GOLD_LIGHT }}>✕ 閉じる</button>
              <span className="text-[14px] font-bold" style={{ color: '#f4e7c8', fontFamily: SERIF }}>答案を書く</span>
              <span className="min-w-[76px] pr-2 text-right text-[11px]" style={{ color: 'rgba(244,231,200,.8)' }}>{!premium ? `無料 あと${remaining}回` : ''}</span>
            </div>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto py-3" style={{ overscrollBehavior: 'contain' }}>
            <div className="px-4 w-full max-w-[794px] mx-auto">
              <div className="text-[12px] font-bold mb-1" style={{ color: GOLD, fontFamily: SERIF }}>【問題】</div>
              <div className="text-[14px] leading-[1.8] text-gray-800 whitespace-pre-wrap">{(lastQuestionItem?.content || '').replace(/^\s*【問題】\s*/, '')}</div>
            </div>
          </div>
          <div className="shrink-0 pt-2 bg-white" style={{ borderTop: '1px solid #e7e0d0', paddingBottom: keyboardOffset > 0 ? '8px' : 'calc(env(safe-area-inset-bottom, 0px) + 8px)' }}>
            <div className="flex items-end gap-2 px-3.5 w-full max-w-[794px] mx-auto">
              <div className="flex-1 min-w-0 rounded-2xl border-[1.5px] px-2 py-1" style={{ borderColor: GOLD }}>
                <Textarea
                  ref={sheetInputRef}
                  className="block w-full px-1 py-1 leading-6 max-h-none text-base text-gray-700 outline-none appearance-none resize-none bg-transparent"
                  value={query}
                  onChange={handleContentChange}
                  onKeyUp={handleKeyUp}
                  onKeyDown={handleKeyDown}
                  placeholder='答案を40字以内で入力'
                  autoSize={{ minRows: 3, maxRows: 5 }}
                />
              </div>
              <div className="shrink-0 flex flex-col items-center gap-1.5">
                <span className={`h-5 leading-5 px-2 rounded-md text-[12px] ${query.length > 40 ? 'bg-red-50 text-red-600 font-bold' : 'bg-gray-50 text-gray-500'}`}>{query.length > 40 ? `${query.length}/40 +${query.length - 40}` : `${query.length}/40`}</span>
                <button type="button" onClick={sendAnswer} className="rounded-xl px-3.5 py-3 text-[14px] font-bold whitespace-nowrap" style={{ background: query.trim() ? NAVY : '#d9d4c7', color: query.trim() ? GOLD_LIGHT : '#fff' }}>採点 ➤</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default React.memo(Chat)
