import type { FC } from 'react'
import React from 'react'
import {
  Bars3Icon,
  HomeIcon,
} from '@heroicons/react/24/solid'
export interface IHeaderProps {
  title: string
  isMobile?: boolean
  onShowSideBar?: () => void
  onCreateNewChat?: () => void
}
const Header: FC<IHeaderProps> = ({
  title,
  isMobile,
  onShowSideBar,
  onCreateNewChat,
}) => {
  return (
    <div className="shrink-0 flex items-center justify-between h-12 px-3" style={{ background: '#0f1d38' }}>
      {isMobile
        ? (
          <div
            className='flex items-center justify-center h-8 w-8 cursor-pointer'
            onClick={() => onShowSideBar?.()}
          >
            <Bars3Icon className="h-5 w-5" style={{ color: '#f1d79a' }} />
          </div>
        )
        : <div></div>}
      <div className='flex items-center space-x-2'>
        <span className="w-7 h-7 rounded-lg flex items-center justify-center text-[14px] font-bold" style={{ background: 'linear-gradient(145deg,#f1d79a,#b8914a)', color: '#13254a', fontFamily: '"Hiragino Mincho ProN","Yu Mincho","Noto Serif JP","Noto Serif CJK JP",serif' }}>K</span>
        <div className="text-[15px] font-bold tracking-wide" style={{ color: '#f4e7c8', fontFamily: '"Hiragino Mincho ProN","Yu Mincho","Noto Serif JP","Noto Serif CJK JP",serif' }}>{title}</div>
      </div>
      {isMobile
        ? (
          <div className='flex items-center justify-center h-8 w-8 cursor-pointer' onClick={() => onCreateNewChat?.()} >
            <HomeIcon className="h-5 w-5" style={{ color: '#f1d79a' }} />
          </div>)
        : <div></div>}
    </div>
  )
}

export default React.memo(Header)
