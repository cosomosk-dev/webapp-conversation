'use client'
import type { FC } from 'react'
import React from 'react'
import Toast from '@/app/components/base/toast'
import { shareTo, shareToastMessage } from '@/app/components/cosmos/share'
import type { ShareTarget } from '@/app/components/cosmos/share'

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
export const InstagramIcon: FC<{ size?: number }> = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} aria-hidden="true">
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4.2" />
    <circle cx="17.4" cy="6.6" r="1.1" fill="currentColor" stroke="none" />
  </svg>
)

const BTN = 'flex-1 min-w-0 flex items-center justify-center gap-1 rounded-xl px-2 py-2.5 text-[13px] font-bold text-white whitespace-nowrap'
const STYLE: Record<ShareTarget, React.CSSProperties> = {
  line: { background: '#06C755' },
  x: { background: '#000' },
  instagram: { background: 'linear-gradient(45deg,#f58529 0%,#dd2a7b 50%,#8134af 100%)' },
}

/** 押した瞬間に送り先を開く。結果に合わせて「コピーしました」等を出す */
export const doShare = async (target: ShareTarget, text: string) => {
  const result = await shareTo(target, text)
  const msg = shareToastMessage(target, result)
  if (msg) { Toast.notify({ ...msg, duration: 3500 }) }
}

/** LINE・X・インスタの3つのボタン(横並び)。文面は送り先ごとに渡す */
export const ShareButtons: FC<{
  texts: Record<ShareTarget, string>
  className?: string
  testIdPrefix?: string
}> = ({ texts, className, testIdPrefix = 'share' }) => (
  <div className={`flex gap-1.5 ${className ?? ''}`}>
    <button type="button" className={BTN} style={STYLE.line} onClick={() => doShare('line', texts.line)} data-testid={`${testIdPrefix}-line`}>
      <LineIcon size={15} />LINE
    </button>
    <button type="button" className={BTN} style={STYLE.x} onClick={() => doShare('x', texts.x)} data-testid={`${testIdPrefix}-x`}>
      <XIcon size={13} />X
    </button>
    <button type="button" className={BTN} style={STYLE.instagram} onClick={() => doShare('instagram', texts.instagram)} data-testid={`${testIdPrefix}-instagram`}>
      <InstagramIcon size={14} />インスタ
    </button>
  </div>
)
