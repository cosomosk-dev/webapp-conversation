'use client'
import type { FC } from 'react'
import React, { useEffect, useRef } from 'react'
import cn from 'classnames'
import { useTranslation } from 'react-i18next'
import Textarea from 'rc-textarea'
import s from './style.module.css'
import Answer from './answer'
import Question from './question'
import type { FeedbackFunc } from './type'
import type { ChatItem, VisionFile, VisionSettings } from '@/types/app'
import { TransferMethod } from '@/types/app'
import Tooltip from '@/app/components/base/tooltip'
import Toast from '@/app/components/base/toast'
import ChatImageUploader from '@/app/components/base/image-uploader/chat-image-uploader'
import ImageList from '@/app/components/base/image-uploader/image-list'
import { useImageFiles } from '@/app/components/base/image-uploader/hooks'
import FileUploaderInAttachmentWrapper from '@/app/components/base/file-uploader-in-attachment'
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
  visionConfig,
  fileConfig,
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
  const {
    files,
    onUpload,
    onRemove,
    onReUpload,
    onImageLinkLoadError,
    onImageLinkLoadSuccess,
    onClear,
  } = useImageFiles()

  const [attachmentFiles, setAttachmentFiles] = React.useState<FileEntity[]>([])

  // ---- 無料枠(累計5回)のカウンター ----
  const FREE_LIMIT = 50
  const QUOTA_KEY = 'cosmosk_free_used'
  const readUsed = (): number => {
    try { return Number(localStorage.getItem(QUOTA_KEY)) || 0 }
    catch { return 0 }
  }
  const [usedToday, setUsedToday] = React.useState(0)
  const [premium, setPremium] = React.useState(false)
  const [showPaywall, setShowPaywall] = React.useState(false)
  useEffect(() => {
    setUsedToday(readUsed())
    try { setPremium(localStorage.getItem('cosmosk_premium') === '1') }
    catch { }
  }, [])
  const remaining = Math.max(0, FREE_LIMIT - usedToday)

  const handleSend = () => {
    if (!valid() || (checkCanSend && !checkCanSend())) { return }
    const hasPendingImageUploads = files.some(file => file.progress !== -1 && file.progress < 100)
    const hasPendingAttachmentUploads = attachmentFiles.some(file => file.progress !== -1 && file.progress < 100)
    if (hasPendingImageUploads || hasPendingAttachmentUploads) {
      logError(t('app.errorMessage.waitForFileUpload'))
      return
    }
    // 答案の送信だけ無料枠を消費する(「出題スタート」はノーカウント・累計制)
    const isAnswerSend = queryRef.current.trim() !== '出題スタート'
    if (isAnswerSend && !premium) {
      const used = readUsed()
      if (used >= FREE_LIMIT) {
        setUsedToday(used)
        setShowPaywall(true)
        return
      }
      try { localStorage.setItem(QUOTA_KEY, String(used + 1)) }
      catch { }
      setUsedToday(used + 1)
    }
    const imageFiles: VisionFile[] = files.filter(file => file.progress !== -1).map(fileItem => ({
      type: 'image',
      transfer_method: fileItem.type,
      url: fileItem.url,
      upload_file_id: fileItem.fileId,
    }))
    const docAndOtherFiles: VisionFile[] = getProcessedFiles(attachmentFiles)
    const combinedFiles: VisionFile[] = [...imageFiles, ...docAndOtherFiles]
    onSend(queryRef.current, combinedFiles)
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
      // prevent send message when using input method enter
      if (!e.shiftKey && !isUseInputMethod.current) { handleSend() }
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

  return (
    <div className={cn(!feedbackDisabled && 'px-3.5', 'h-full')}>
    <a href="/favorites" className="fixed z-20 top-[46px] right-3 text-xs text-gray-600 bg-white border border-gray-200 rounded-full px-3 py-1 shadow-sm">⭐ お気に入り</a>
     <a href="/privacy" className="fixed z-20 top-[46px] left-3 text-xs text-gray-600 bg-white border border-gray-200 rounded-full px-3 py-1 shadow-sm">プライバシーポリシー</a>
      {showPaywall && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 px-6" onClick={() => setShowPaywall(false)}>
          <div className="w-full max-w-sm bg-white rounded-2xl p-5 shadow-lg text-center" onClick={e => e.stopPropagation()}>
            <div className="text-2xl mb-2">🌸</div>
            <div className="text-base font-bold text-gray-800 mb-2">無料の採点（{FREE_LIMIT}回分）は終了しました</div>
            <div className="text-sm text-gray-600 mb-4">採点し放題プラン（月500円）で、92問すべてを何度でも採点できます。<br />新しい問題を見るのは、このまま無料で続けられます。</div>
            <div className="text-xs text-gray-400 mb-4">採点し放題プランは近日提供予定です</div>
            <button onClick={() => setShowPaywall(false)} className="w-full py-2 rounded-full bg-blue-600 text-white text-sm font-bold">閉じる</button>
          </div>
        </div>
      )}
      {/* Chat List */}
      <div className="h-full space-y-[30px]">
                {chatList.map((item, idx) => {
          if (item.isAnswer) {
            const isLast = item.id === chatList[chatList.length - 1].id
            const prevUser = chatList[idx - 1]
            const prevQ = chatList[idx - 2]
                       const isDone = !item.isOpeningStatement && !(isResponding && isLast) && !!item.content && !!prevUser && !prevUser.isAnswer
            const canSave = isDone && prevUser.content.trim() !== '出題スタート'
            const saveFav = () => {
              try {
                const favs: { id: string; content: string; date: string }[] = JSON.parse(localStorage.getItem('cosmosk_favs') || '[]')
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
            return (
              <div key={item.id}>
                <Answer
                  item={item}
                  feedbackDisabled={feedbackDisabled}
                  onFeedback={onFeedback}
                  isResponding={isResponding && isLast}
                  suggestionClick={suggestionClick}
                />
                                {isDone && (
                  <div className="mt-2 ml-12 flex gap-2">
                    {canSave && <button onClick={saveFav} className="text-xs text-gray-600 bg-white border border-gray-200 rounded-full px-3 py-1 shadow-sm">⭐ この問題を保存</button>}
                    <button onClick={() => suggestionClick('出題スタート')} className="text-xs text-white bg-blue-600 border border-blue-600 rounded-full px-3 py-1 shadow-sm">▶ 次の問題</button>
                  </div>
                
                )}
              </div>
            )
          }
          return (
            <Question
              key={item.id}
              id={item.id}
              content={item.content}
              useCurrentUserAvatar={useCurrentUserAvatar}
              imgSrcs={(item.message_files && item.message_files?.length > 0) ? item.message_files.map(item => item.url) : []}
            />
          )
        })}
      </div>
      {
        !isHideSendInput && (
          <div className='fixed z-10 bottom-0 left-1/2 transform -translate-x-1/2 pc:ml-[122px] tablet:ml-[96px] mobile:ml-0 pc:w-[794px] tablet:w-[794px] max-w-full mobile:w-full px-3.5'>
            {!premium && (
              <div className="text-[11px] text-right text-gray-500 mb-1 pr-1">無料採点 あと{remaining}回</div>
            )}
            <div className='p-[5.5px] max-h-[150px] bg-white border-[1.5px] border-gray-200 rounded-xl overflow-y-auto'>
              {
                visionConfig?.enabled && (
                  <>
                    <div className='absolute bottom-2 left-2 flex items-center'>
                      <ChatImageUploader
                        settings={visionConfig}
                        onUpload={onUpload}
                        disabled={files.length >= visionConfig.number_limits}
                      />
                      <div className='mx-1 w-[1px] h-4 bg-black/5' />
                    </div>
                    <div className='pl-[52px]'>
                      <ImageList
                        list={files}
                        onRemove={onRemove}
                        onReUpload={onReUpload}
                        onImageLinkLoadSuccess={onImageLinkLoadSuccess}
                        onImageLinkLoadError={onImageLinkLoadError}
                      />
                    </div>
                  </>
                )
              }
              {
                fileConfig?.enabled && (
                  <div className={`${visionConfig?.enabled ? 'pl-[52px]' : ''} mb-1`}>
                    <FileUploaderInAttachmentWrapper
                      fileConfig={fileConfig}
                      value={attachmentFiles}
                      onChange={setAttachmentFiles}
                    />
                  </div>
                )
              }
              <Textarea
                className={`
                  block w-full px-2 pr-[118px] py-[7px] leading-5 max-h-none text-base text-gray-700 outline-none appearance-none resize-none
                  ${visionConfig?.enabled && 'pl-12'}
                `}
                value={query}
                onChange={handleContentChange}
                onKeyUp={handleKeyUp}
                onKeyDown={handleKeyDown}
                autoSize
              />
              <div className="absolute bottom-2 right-6 flex items-center h-8">
<div className={`${s.count} mr-3 h-5 leading-5 text-sm px-2 rounded-md ${query.length > 40 ? 'bg-red-50 text-red-600 font-bold' : 'bg-gray-50 text-gray-500'}`}>{query.length > 40 ? `${query.length}/40 +${query.length - 40}` : `${query.length}/40`}</div>                <Tooltip
                  selector='send-tip'
                  htmlContent={
                    <div>
                      <div>{t('common.operation.send')} Enter</div>
                      <div>{t('common.operation.lineBreak')} Shift Enter</div>
                    </div>
                  }
                >
                  <div className={`${s.sendBtn} ${query.trim() ? s.sendBtnActive : ''} w-8 h-8 cursor-pointer rounded-md`} onClick={handleSend}></div>
                </Tooltip>
              </div>
            </div>
          </div>
        )
      }
    </div>
  )
}

export default React.memo(Chat)
