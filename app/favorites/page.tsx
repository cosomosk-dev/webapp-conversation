'use client'
import React, { useEffect, useState } from 'react'
import StreamdownMarkdown from '@/app/components/base/streamdown-markdown'

type Fav = { id: string; content: string; date: string }

export default function FavoritesPage() {
  const [items, setItems] = useState<Fav[]>([])

  useEffect(() => {
    try {
      setItems(JSON.parse(localStorage.getItem('cosmosk_favs') || '[]'))
    }
    catch {
      setItems([])
    }
  }, [])

  const remove = (id: string) => {
    const next = items.filter(i => i.id !== id)
    setItems(next)
    localStorage.setItem('cosmosk_favs', JSON.stringify(next))
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: 16 }}>
      <h1 style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 8 }}>⭐ お気に入り({items.length}件)</h1>
      <a href="/" style={{ color: '#2563eb', fontSize: 14 }}>← 出題にもどる</a>
      {items.length === 0 && (
        <p style={{ marginTop: 24, color: '#6b7280', fontSize: 14 }}>
          保存された問題はまだありません。採点結果の下の「⭐ この問題を保存」を押すとここに残ります。
        </p>
      )}
      {items.map(i => (
        <div key={i.id} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 12, marginTop: 12, fontSize: 14 }}>
          <div style={{ color: '#9ca3af', fontSize: 12, marginBottom: 6 }}>{i.date}</div>
          <StreamdownMarkdown content={i.content} />
          <div style={{ marginTop: 8, textAlign: 'right' }}>
            <button onClick={() => remove(i.id)} style={{ color: '#dc2626', fontSize: 12 }}>削除</button>
          </div>
        </div>
      ))}
    </div>
  )
}
