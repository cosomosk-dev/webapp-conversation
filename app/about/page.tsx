export const metadata = {
  title: '企画・監修者について | コスモスK',
}

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-2xl px-5 py-10 text-sm leading-7 text-gray-800">
      <h1 className="mb-8 text-2xl font-bold">企画・監修者について</h1>

      <div className="mb-6 flex items-center gap-5">
        <img
          src="/about-photo.jpg"
          alt="加藤貴大"
          className="h-28 w-28 rounded-full object-cover"
        />
        <div>
          <p className="text-lg font-bold">加藤 貴大</p>
          <p className="text-gray-600">行政書士・社会保険労務士</p>
          <p className="text-gray-600">神奈川県平塚市</p>
        </div>
      </div>

      <h2 className="mb-2 mt-8 text-lg font-bold">このアプリを作った理由</h2>
      <p className="mb-4">
        私自身、行政書士試験でいちばん苦手だったのが記述式でした。
        知識はあるのに、40字にまとめようとすると手が止まる。
        必要なのは「書いて、採点して、直す」の反復ですが、
        独学だと採点してくれる相手がいません。
      </p>
      <p className="mb-4">
        その反復をスマホひとつで、何度でも回せる場所を作りたい——
        それがコスモスKです。全92問の出題と採点基準は、
        行政書士・社会保険労務士としての知見をもとに私が監修しています。
      </p>
      <p className="mb-8">
        神奈川県平塚市を拠点に活動しています。
        アプリの感想や不具合のご報告も、お気軽にどうぞ。
      </p>

      <a
        href="https://www.instagram.com/taka.gyosei.music0319/"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block rounded-lg bg-gray-900 px-5 py-3 font-bold text-white"
      >
        📷 アプリの感想はInstagramのDMへ
      </a>
    </main>
  )
}
