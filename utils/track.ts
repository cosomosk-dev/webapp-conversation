import { track } from '@vercel/analytics'

/**
 * Vercel Web Analytics にカスタムイベントを送る(失敗しても画面には影響させない)。
 * ページ表示(pageview)は layout.tsx の <Analytics /> が自動で数える。
 *
 * 送っているイベント:
 *   start_clicked … 「▶ 問題を出す」「▶ 次の問題」など、Difyへ「出題スタート」を送った回数
 *
 * プロパティ:
 *   native … true = Androidアプリ(WebView)内、false = ブラウザで開いている
 */
export const trackEvent = (name: string, props?: Record<string, string | number | boolean>) => {
  try {
    const w = window as any
    const native = !!w.CosmosBilling
    track(name, { native, ...props })
  }
  catch { }
}
