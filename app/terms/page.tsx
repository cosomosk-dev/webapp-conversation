export const metadata = {
  title: '利用規約 | コスモスK',
}

// 利用規約(EULA)。App Store / Google Play の審査で、月額の定期購入があるアプリに必須のページ
// 住所: /terms (ストアの説明文・アプリ内の購入画面からリンクする)
export default function TermsPage() {
  return (
    <main className="mx-auto max-w-2xl px-5 py-10 text-sm leading-7 text-gray-800">
      <h1 className="mb-6 text-2xl font-bold">利用規約</h1>

      <p className="mb-6">
        この利用規約（以下「本規約」）は、加藤貴大（以下「当方」）が提供する学習アプリ「コスモスK」（以下「本アプリ」）の利用条件を定めるものです。本アプリをご利用いただくことで、本規約に同意したものとみなします。
      </p>

      <h2 className="mb-2 mt-8 text-lg font-bold">1. 本アプリについて</h2>
      <p className="mb-2">本アプリは、行政書士試験の記述式問題を出題し、入力された答案をAIが採点する学習アプリです。問題の閲覧は無料で、AI採点は無料で一定回数まで利用できます。</p>
      <p className="mb-4">AIによる採点は不正確な場合があります。採点結果は学習の目安であり、試験の合否や本番の採点を保証するものではありません。</p>

      <h2 className="mb-2 mt-8 text-lg font-bold">2. 採点し放題プラン（自動更新の定期購入）</h2>
      <ul className="mb-2 list-disc pl-6">
        <li>名称：採点し放題プラン（月額）</li>
        <li>料金：月額500円（税込）</li>
        <li>期間：1か月。期間が終わる24時間前までに解約しない限り、同じ料金で自動的に更新されます</li>
        <li>お支払い：購入を確定したときに、App Store（Apple ID）またはGoogle Playのアカウントに請求されます</li>
        <li>解約：iPhone・iPadは「設定」→「Apple ID」→「サブスクリプション」から、Androidは「Google Play」→「定期購入」から、いつでも解約できます。解約しても、その期間の終わりまではプランの機能を使えます</li>
        <li>返金：購入後の返金は、App StoreまたはGoogle Playの規約と手続きに従います。当方が直接返金することはできません</li>
        <li>復元：機種を変えたときやアプリを入れ直したときは、購入したときと同じアカウントでログインすると購入状態が戻ります</li>
      </ul>
      <p className="mb-4">試験が終わっても自動では終了しないため、不要になった場合はご自身で解約してください。</p>

      <h2 className="mb-2 mt-8 text-lg font-bold">3. 答案と記録について</h2>
      <p className="mb-2">入力された答案は、採点のためにAI処理基盤に送信されます。答案に氏名・住所などの個人情報を入力しないでください。お気に入りなどの記録は利用者の端末の中だけに保存され、アプリの削除や端末の初期化で消えた記録を当方が復元することはできません。</p>
      <p className="mb-4">個人情報の取り扱いは、<a href="/privacy" className="underline">プライバシーポリシー</a>に定めます。</p>

      <h2 className="mb-2 mt-8 text-lg font-bold">4. 禁止事項</h2>
      <ul className="mb-4 list-disc pl-6">
        <li>本アプリを改変・複製・解析（リバースエンジニアリング）・再配布すること</li>
        <li>本アプリの問題・解説・採点基準などを、当方の許可なく商用利用・転載すること</li>
        <li>採点機能に対して、学習目的以外の大量送信や不正な入力を行うこと</li>
        <li>法令や公序良俗に反する目的で本アプリを利用すること</li>
        <li>当方や第三者に不利益・損害を与える行為</li>
      </ul>

      <h2 className="mb-2 mt-8 text-lg font-bold">5. 知的財産権</h2>
      <p className="mb-4">本アプリの問題・解説・採点基準・画面デザイン・プログラムなどに関する権利は、当方または正当な権利者に帰属します。</p>

      <h2 className="mb-2 mt-8 text-lg font-bold">6. 免責</h2>
      <p className="mb-4">当方は、本アプリの内容が正確・完全であることや、常に利用できることを保証しません。本アプリの利用または利用できなかったことによって生じた損害について、当方に故意または重大な過失がある場合を除き、当方は責任を負いません。当方が責任を負う場合でも、その範囲は利用者が直近1か月に当方に支払った金額を上限とします。</p>

      <h2 className="mb-2 mt-8 text-lg font-bold">7. サービスの変更・終了</h2>
      <p className="mb-4">当方は、利用者への事前の通知なく、本アプリの内容（問題・採点基準を含む）を変更し、または提供を終了することがあります。法改正に合わせて問題を更新することがあります。</p>

      <h2 className="mb-2 mt-8 text-lg font-bold">8. 本規約の変更</h2>
      <p className="mb-4">当方は必要に応じて本規約を変更することがあります。変更後の規約は、本ページに掲載した時点から効力を持ちます。</p>

      <h2 className="mb-2 mt-8 text-lg font-bold">9. 準拠法・管轄</h2>
      <p className="mb-4">本規約は日本法に従って解釈され、本アプリに関する紛争は、横浜地方裁判所を第一審の専属的合意管轄裁判所とします。</p>

      <h2 className="mb-2 mt-8 text-lg font-bold">10. お問い合わせ</h2>
      <p className="mb-1">提供者：加藤 貴大（行政書士）</p>
      <p className="mb-4">メール：taka.sr01@gmail.com</p>

      <p className="mt-10 text-xs text-gray-500">制定日：2026年11月9日</p>
    </main>
  )
}
