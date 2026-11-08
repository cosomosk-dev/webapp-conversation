// LINE・X・インスタへ「直接」送るための共通処理。
//
// アプリ(Android版)の中では、ふつうのリンク(line.me など)を押しても画面の中で開こうとして
// 「ウェブページへのアクセス不可(ERR_UNKNOWN_URL_SCHEME)」になる。
// そこで、アプリ側に用意した CosmosBilling.shareTo(送り先, 文面) を呼んで、LINE・X・インスタのアプリを直接開く。
//
// ・新しいアプリ(shareToあり): LINE / X / インスタのアプリが直接開く
// ・古いアプリ(shareToなし): 外のアプリを開けないので、文面をコピーして「LINEを開いて貼り付けてね」と案内する
// ・ブラウザ(Chromeなど): LINEとXは今までどおりのリンク。インスタはスマホの共有画面(なければコピー)

export const tweetUrl = (text: string) => `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`
/** LINEの「送る相手を選ぶ」画面を開くURL(スマホではLINEアプリが開く) */
export const lineUrl = (text: string) => `https://line.me/R/share?text=${encodeURIComponent(text)}`
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

export type ShareTarget = 'line' | 'x' | 'instagram'
/** opened=アプリや共有画面を開いた / copied=文面をコピーしただけ(手で貼ってもらう) / failed=どちらもできなかった */
export type ShareResult = 'opened' | 'copied' | 'failed'

interface Bridge { shareTo?: (target: string, text: string) => void }
const bridge = (): Bridge | undefined => {
  if (typeof window === 'undefined') { return undefined }
  return (window as unknown as { CosmosBilling?: Bridge }).CosmosBilling
}
/** Android版アプリの中で開かれているか */
export const inNativeApp = () => {
  if (typeof window === 'undefined') { return false }
  return !!bridge() || !!(window as unknown as { isNativeApp?: boolean }).isNativeApp
}
/** アプリ側に「直接送る」機能があるか(アプリの新しい版) */
export const canNativeShare = () => typeof bridge()?.shareTo === 'function'

const LABEL: Record<ShareTarget, string> = { line: 'LINE', x: 'X', instagram: 'インスタ' }

export const shareTo = async (target: ShareTarget, text: string): Promise<ShareResult> => {
  // インスタは文面を入れて開く仕組みがないので、先にコピーしておく(ストーリーズや投稿にそのまま貼れる)
  if (target === 'instagram') { await copyText(text) }

  if (canNativeShare()) {
    try {
      bridge()!.shareTo!(target, text)
      return 'opened'
    }
    catch { }
  }
  if (inNativeApp()) {
    if (target === 'instagram') { return 'copied' }
    return (await copyText(text)) ? 'copied' : 'failed'
  }

  // ここから下はブラウザ
  if (target === 'line') {
    window.location.href = lineUrl(text)
    return 'opened'
  }
  if (target === 'x') {
    window.open(tweetUrl(text), '_blank', 'noopener,noreferrer')
    return 'opened'
  }
  const nav = navigator as Navigator & { share?: (d: { text?: string }) => Promise<void> }
  if (typeof nav.share === 'function') {
    try {
      await nav.share({ text })
      return 'opened'
    }
    catch (e) {
      if ((e as { name?: string })?.name === 'AbortError') { return 'opened' }
    }
  }
  return 'copied'
}

/** 結果に合わせたお知らせ文(開けたときは何も出さない) */
export const shareToastMessage = (target: ShareTarget, result: ShareResult): { type: 'success' | 'error' | 'info', message: string } | null => {
  if (result === 'failed') { return { type: 'error', message: 'うまく開けませんでした。もう一度押してください' } }
  if (result === 'copied') { return { type: 'success', message: `文面をコピーしました。${LABEL[target]}を開いて貼り付けてね` } }
  if (target === 'instagram') { return { type: 'success', message: '文面はコピー済み。ストーリーズや投稿にはそのまま貼り付けOK' } }
  return null
}
