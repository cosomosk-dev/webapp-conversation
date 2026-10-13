'use client'
import type { FC } from 'react'
import React from 'react'
import type { IChatItem } from '../type'
import s from '../style.module.css'

import StreamdownMarkdown from '@/app/components/base/streamdown-markdown'
import ImageGallery from '@/app/components/base/image-gallery'

type IQuestionProps = Pick<IChatItem, 'id' | 'content' | 'useCurrentUserAvatar'> & {
  imgSrcs?: string[]
}

const Question: FC<IQuestionProps> = ({ id, content, useCurrentUserAvatar, imgSrcs }) => {
  const userName = ''
  // コスモスK: 「出題スタート」は区切り線、答案は「あなたの答案」カードで表示
  if ((content || '').trim() === '出題スタート') {
    return (
      <div className='flex items-center gap-3 text-[11px] font-bold' style={{ color: '#b8914a' }} key={id}>
        <div className='flex-1 h-px' style={{ background: '#e7e0d0' }} />
        新しい問題
        <div className='flex-1 h-px' style={{ background: '#e7e0d0' }} />
      </div>
    )
  }
  if (!imgSrcs || imgSrcs.length === 0) {
    return (
      <div className='flex justify-end' key={id}>
        <div className='max-w-[88%] rounded-2xl px-4 py-3 text-white' style={{ background: 'linear-gradient(160deg,#0f1d38 0%,#1b3160 100%)' }}>
          <div className='text-[10.5px] font-bold mb-1' style={{ color: '#f1d79a' }}>あなたの答案({(content || '').length}字)</div>
          <div className='text-[14px] leading-relaxed whitespace-pre-wrap'>{content}</div>
        </div>
      </div>
    )
  }
  return (
    <div className='flex items-start justify-end' key={id}>
      <div>
        <div className={`${s.question} relative text-sm text-gray-900`}>
          <div
            className={'mr-2 py-3 px-4 bg-blue-500 rounded-tl-2xl rounded-b-2xl'}
          >
            {imgSrcs && imgSrcs.length > 0 && (
              <ImageGallery srcs={imgSrcs} />
            )}
            <StreamdownMarkdown content={content} />
          </div>
        </div>
      </div>
      {useCurrentUserAvatar
        ? (
          <div className='w-10 h-10 shrink-0 leading-10 text-center mr-2 rounded-full bg-primary-600 text-white'>
            {userName?.[0].toLocaleUpperCase()}
          </div>
        )
        : (
          <div className={`${s.questionIcon} w-10 h-10 shrink-0 `}></div>
        )}
    </div>
  )
}

export default React.memo(Question)
