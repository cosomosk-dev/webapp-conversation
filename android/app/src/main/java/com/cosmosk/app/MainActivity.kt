package com.cosmosk.app

import android.Manifest
import android.annotation.SuppressLint
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.ActivityNotFoundException
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.util.Log
import android.view.View
import android.webkit.WebChromeClient
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.result.contract.ActivityResultContracts
import androidx.activity.enableEdgeToEdge
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.core.view.WindowCompat
import com.google.android.play.core.review.ReviewManagerFactory
import com.google.firebase.analytics.FirebaseAnalytics
import com.cosmosk.app.databinding.ActivityMainBinding

class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding
    private lateinit var billingManager: BillingManager
    private lateinit var firebaseAnalytics: FirebaseAnalytics
    private var isPageLoaded = false

    private val notificationPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { granted ->
        Log.d(TAG, "Notification permission ${if (granted) "granted" else "denied"}")
    }

    companion object {
        private const val TAG = "MainActivity"
        private const val WEB_APP_URL = "https://webapp-conversation-cosmosk.vercel.app"
        private const val JS_BRIDGE_NAME = "CosmosBilling"

        /** アプリの中ではなく、外のアプリ(またはブラウザ)で開くサイト */
        private val EXTERNAL_HOSTS = listOf(
            "line.me", "twitter.com", "x.com", "instagram.com",
            "play.google.com", "tiktok.com", "linkco.re", "linktr.ee",
        )

        /** 送り先ごとのアプリのパッケージ名 */
        private val SHARE_PACKAGES = mapOf(
            "line" to "jp.naver.line.android",
            "x" to "com.twitter.android",
            "instagram" to "com.instagram.android",
        )
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        enableEdgeToEdge()
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        WindowCompat.getInsetsController(window, window.decorView).apply {
            isAppearanceLightStatusBars = true
            isAppearanceLightNavigationBars = true
        }

        firebaseAnalytics = FirebaseAnalytics.getInstance(this)
        createNotificationChannel()

        initBilling()
        initWebView()
        initSwipeRefresh()
        initRetryButton()

        loadWebApp()
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CosmosMessagingService.CHANNEL_ID,
                CosmosMessagingService.CHANNEL_NAME,
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "コスモスKからのお知らせ"
            }
            val manager = getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(channel)
        }
    }

    private fun requestNotificationPermissionIfNeeded() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) return
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS)
            == PackageManager.PERMISSION_GRANTED
        ) return
        notificationPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
    }

    private fun logGradingCompleteEvent() {
        firebaseAnalytics.logEvent("grading_complete", null)
        Log.d(TAG, "Firebase Analytics: grading_complete event logged")
    }

    private fun initBilling() {
        billingManager = BillingManager(this) { success, message ->
            runOnUiThread {
                if (success) {
                    setPremiumInWebView()
                }
            }
        }
        billingManager.initialize()
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun initWebView() {
        binding.webView.apply {
            settings.javaScriptEnabled = true
            settings.domStorageEnabled = true
            settings.databaseEnabled = true
            settings.allowFileAccess = false
            settings.allowContentAccess = false
            settings.setSupportZoom(false)
            settings.builtInZoomControls = false
            settings.useWideViewPort = true
            settings.loadWithOverviewMode = true
            settings.mediaPlaybackRequiresUserGesture = false
            settings.javaScriptCanOpenWindowsAutomatically = true

            val bridge = WebAppInterface(
                onSubscribeRequested = { runOnUiThread { billingManager.launchPurchaseFlow() } },
                onRestoreRequested = { runOnUiThread { billingManager.queryExistingPurchases() } },
                onReviewRequested = { runOnUiThread { launchInAppReview() } },
                onNotificationPermissionRequested = { runOnUiThread { requestNotificationPermissionIfNeeded() } },
                onGradingComplete = { runOnUiThread { logGradingCompleteEvent() } },
                onShareRequested = { target, text -> runOnUiThread { shareTo(target, text) } },
            )
            addJavascriptInterface(bridge, JS_BRIDGE_NAME)

            webViewClient = AppWebViewClient()
            webChromeClient = WebChromeClient()
        }
    }

    private fun initSwipeRefresh() {
        binding.swipeRefresh.isEnabled = false
    }

    private fun initRetryButton() {
        binding.btnRetry.setOnClickListener {
            loadWebApp()
        }
    }

    private fun loadWebApp() {
        if (isNetworkAvailable()) {
            showLoading()
            binding.webView.loadUrl(WEB_APP_URL)
        } else {
            showError(getString(R.string.error_no_network))
        }
    }

    private fun setPremiumInWebView() {
        val js = """
            localStorage.setItem('cosmosk_premium','1');
            window.dispatchEvent(new Event('cosmosk_premium_changed'));
        """.trimIndent()
        binding.webView.evaluateJavascript(js, null)
    }

    private fun showLoading() {
        binding.loadingOverlay.visibility = View.VISIBLE
        binding.errorOverlay.visibility = View.GONE
    }

    private fun showContent() {
        binding.loadingOverlay.visibility = View.GONE
        binding.errorOverlay.visibility = View.GONE
    }

    private fun showError(message: String) {
        binding.loadingOverlay.visibility = View.GONE
        binding.errorOverlay.visibility = View.VISIBLE
        binding.errorText.text = message
    }

    private fun isNetworkAvailable(): Boolean {
        val cm = getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
        val network = cm.activeNetwork ?: return false
        val capabilities = cm.getNetworkCapabilities(network) ?: return false
        return capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
    }

    private fun launchInAppReview() {
        val reviewManager = ReviewManagerFactory.create(this)
        val request = reviewManager.requestReviewFlow()
        request.addOnCompleteListener { task ->
            if (task.isSuccessful) {
                val reviewInfo = task.result
                reviewManager.launchReviewFlow(this, reviewInfo).addOnCompleteListener {
                    Log.d(TAG, "In-app review flow completed")
                }
            } else {
                Log.e(TAG, "Failed to request review flow: ${task.exception?.message}")
            }
        }
    }

    @Deprecated("Use OnBackPressedCallback instead")
    override fun onBackPressed() {
        if (binding.webView.canGoBack()) {
            binding.webView.goBack()
        } else {
            @Suppress("DEPRECATION")
            super.onBackPressed()
        }
    }

    override fun onResume() {
        super.onResume()
        billingManager.queryExistingPurchases()
    }

    override fun onDestroy() {
        billingManager.destroy()
        binding.webView.destroy()
        super.onDestroy()
    }

    /** LINE / X / インスタのアプリを直接開いて文面を送る。入っていなければ共有画面かWeb版へ */
    private fun shareTo(target: String, text: String) {
        val send = Intent(Intent.ACTION_SEND).apply {
            type = "text/plain"
            putExtra(Intent.EXTRA_TEXT, text)
        }
        val pkg = SHARE_PACKAGES[target]
        if (pkg != null) {
            try {
                startActivity(Intent(send).setPackage(pkg))
                return
            } catch (e: ActivityNotFoundException) {
                Log.d(TAG, "share app not installed: $pkg")
            }
            when (target) {
                "line" -> { openExternal("https://line.me/R/share?text=" + Uri.encode(text)); return }
                "x" -> { openExternal("https://twitter.com/intent/tweet?text=" + Uri.encode(text)); return }
            }
        }
        try {
            startActivity(Intent.createChooser(send, "送り先を選ぶ"))
        } catch (e: Exception) {
            Log.e(TAG, "share failed: ${e.message}")
        }
    }

    /** URLを外のアプリ(なければブラウザ)で開く */
    private fun openExternal(url: String) {
        try {
            startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url)).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
        } catch (e: ActivityNotFoundException) {
            Log.e(TAG, "no app for url: $url")
        }
    }

    /** intent:// のURLを開く。アプリが無いときは用意された代わりのURLか、Google Playのそのアプリのページへ */
    private fun openIntentUrl(url: String) {
        val intent = try {
            Intent.parseUri(url, Intent.URI_INTENT_SCHEME)
        } catch (e: Exception) {
            Log.e(TAG, "bad intent url: ${e.message}")
            return
        }
        intent.addCategory(Intent.CATEGORY_BROWSABLE)
        intent.component = null
        intent.selector = null
        try {
            startActivity(intent)
        } catch (e: ActivityNotFoundException) {
            val fallback = intent.getStringExtra("browser_fallback_url")
            when {
                !fallback.isNullOrEmpty() -> openExternal(fallback)
                !intent.`package`.isNullOrEmpty() -> openExternal("market://details?id=" + intent.`package`)
            }
        }
    }

    private inner class AppWebViewClient : WebViewClient() {

        override fun shouldOverrideUrlLoading(
            view: WebView?,
            request: WebResourceRequest?
        ): Boolean {
            val uri = request?.url ?: return false
            val url = uri.toString()
            if (url.startsWith(WEB_APP_URL) || url.contains("webapp-conversation-cosmosk")) {
                return false
            }
            val scheme = uri.scheme?.lowercase() ?: return false
            // intent://(LINEの共有リンクなどが最後にたどり着く形)は、中身のアプリを直接開く
            if (scheme == "intent") {
                openIntentUrl(url)
                return true
            }
            // line: / market: / mailto: など http 以外は外のアプリへ
            if (scheme != "http" && scheme != "https") {
                openExternal(url)
                return true
            }
            val host = uri.host?.lowercase() ?: return false
            if (EXTERNAL_HOSTS.any { host == it || host.endsWith(".$it") }) {
                openExternal(url)
                return true
            }
            return false
        }

        override fun onPageFinished(view: WebView?, url: String?) {
            super.onPageFinished(view, url)
            isPageLoaded = true
            showContent()
            injectBridgeDetectionScript()
        }

        override fun onReceivedError(
            view: WebView?,
            request: WebResourceRequest?,
            error: WebResourceError?
        ) {
            super.onReceivedError(view, request, error)
            if (request?.isForMainFrame == true) {
                showError(getString(R.string.error_page_load))
            }
        }

        private fun injectBridgeDetectionScript() {
            val js = """
                (function() {
                    window.isNativeApp = true;
                    window.dispatchEvent(new Event('nativeAppReady'));
                    if (!window._cosmosBridgeInterval) {
                        window._cosmosBridgeInterval = setInterval(function() {
                            if (window.CosmosBilling) {
                                window.isNativeApp = true;
                                window.dispatchEvent(new Event('nativeAppReady'));
                            }
                        }, 1000);
                        setTimeout(function() {
                            clearInterval(window._cosmosBridgeInterval);
                            window._cosmosBridgeInterval = null;
                        }, 10000);
                    }
                })();
            """.trimIndent()
            binding.webView.evaluateJavascript(js, null)
        }
    }
}
