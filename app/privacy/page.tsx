export const metadata = {
  title: 'プライバシーポリシー | コスモスK',
}

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-2xl px-5 py-10 text-sm leading-7 text-gray-800">
      <h1 className="mb-6 text-2xl font-bold">プライバシーポリシー</h1>

      <p className="mb-6">
        コスモスK（以下「本アプリ」）は、行政書士試験の記述式問題の出題と採点を行う学習アプリです。
        本アプリの提供者（以下「当方」）は、利用者の情報を以下のとおり取り扱います。
      </p>

      <h2 className="mb-2 mt-8 text-lg font-bold">1. 取得する情報</h2>
      <p className="mb-2">本アプリは、利用者の氏名・メールアドレス・電話番号などの個人を特定する情報を、アプリ内で入力させたり取得したりしません。</p>
      <p className="mb-2">本アプリが取り扱う情報は次のとおりです。</p>
      <ul className="mb-4 list-disc pl-6">
        <li>利用者が入力した答案の文章と、それに対する採点結果（採点処理のために必要です）</li>
        <li>お気に入りとして保存した問題・答案・採点結果（利用者の端末内にのみ保存され、当方のサーバーには送信されません）</li>
        <li>アクセス日時、端末の種類、IPアドレスなどの技術的な情報（サービスの安定運用と不正利用防止のため、配信基盤において自動的に記録されることがあります）</li>
      </ul>

      <h2 className="mb-2 mt-8 text-lg font-bold">2. 利用目的</h2>
      <ul className="mb-4 list-disc pl-6">
        <li>出題・採点などの本アプリの機能を提供するため</li>
        <li>本アプリの品質向上、不具合の調査、不正利用の防止のため</li>
      </ul>

      <h2 className="mb-2 mt-8 text-lg font-bold">3. 外部サービスへの送信</h2>
      <p className="mb-2">
        採点を行うため、利用者が入力した答案の文章は、AI処理基盤（Dify）および大規模言語モデル提供事業者（OpenAI）に送信されます。
        送信される情報は答案の文章と採点に必要な問題データのみで、個人を特定する情報は含まれません。
      </p>
      <p className="mb-4">
        答案には、氏名や住所などの個人情報を入力しないようお願いいたします。
      </p>

      <h2 className="mb-2 mt-8 text-lg font-bold">4. 第三者への提供</h2>
      <p className="mb-4">
        当方は、法令に基づく場合を除き、取得した情報を第三者に提供しません。前項の外部サービスへの送信は、採点機能の提供のために必要な範囲で行うものです。
      </p>

      <h2 className="mb-2 mt-8 text-lg font-bold">5. 広告・トラッキング</h2>
      <p className="mb-4">本アプリは、広告を表示せず、広告目的のトラッキングを行いません。</p>

      <h2 className="mb-2 mt-8 text-lg font-bold">6. 端末内データの削除</h2>
      <p className="mb-4">
        お気に入りとして保存したデータは利用者の端末内に保存されています。アプリのデータ消去またはアンインストールにより削除できます。
      </p>

      <h2 className="mb-2 mt-8 text-lg font-bold">7. 未成年の利用</h2>
      <p className="mb-4">本アプリは、行政書士試験の受験者を対象としており、13歳未満の方の利用を想定していません。</p>

      <h2 className="mb-2 mt-8 text-lg font-bold">8. 本ポリシーの変更</h2>
      <p className="mb-4">当方は、必要に応じて本ポリシーを変更することがあります。変更後の内容は本ページに掲載した時点で効力を生じます。</p>

      <h2 className="mb-2 mt-8 text-lg font-bold">9. お問い合わせ</h2>
      <p className="mb-1">本ポリシーに関するお問い合わせは、以下までご連絡ください。</p>
      <p className="mb-1">提供者：加藤 貴大</p>
      <p className="mb-4">メール：taka.sr01@gmail.com</p>

      <p className="mt-10 text-xs text-gray-500">制定日：2026年8月26日</p>
    </main>
  )
}
