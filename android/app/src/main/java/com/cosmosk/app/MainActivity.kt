package com.cosmosk.app

import android.annotation.SuppressLint
import android.content.Context
import android.graphics.Color
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.os.Bundle
import android.util.Log
import android.view.View
import android.webkit.WebChromeClient
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.SystemBarStyle
import androidx.activity.enableEdgeToEdge
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import com.google.android.play.core.review.ReviewManagerFactory
import com.cosmosk.app.databinding.ActivityMainBinding

class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding
    private lateinit var billingManager: BillingManager
    private var isPageLoaded = false

    companion object {
        private const val TAG = "MainActivity"
        private const val WEB_APP_URL = "https://webapp-conversation-cosmosk.vercel.app"
        private const val JS_BRIDGE_NAME = "CosmosBilling"
        private const val STATUS_BAR_COLOR = 0xFF1D4ED8.toInt()
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        enableEdgeToEdge(
            statusBarStyle = SystemBarStyle.dark(STATUS_BAR_COLOR),
            navigationBarStyle = SystemBarStyle.light(Color.WHITE, Color.WHITE)
        )
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        applyWindowInsets()
        initBilling()
        initWebView()
        initRetryButton()

        loadWebApp()
    }

    private fun applyWindowInsets() {
        ViewCompat.setOnApplyWindowInsetsListener(binding.rootLayout) { view, windowInsets ->
            val systemBars = windowInsets.getInsets(WindowInsetsCompat.Type.systemBars())
            val ime = windowInsets.getInsets(WindowInsetsCompat.Type.ime())
            val bottomInset = maxOf(systemBars.bottom, ime.bottom)
            view.setPadding(systemBars.left, systemBars.top, systemBars.right, bottomInset)
            WindowInsetsCompat.CONSUMED
        }
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
            overScrollMode = View.OVER_SCROLL_NEVER

            val bridge = WebAppInterface(
                onSubscribeRequested = { runOnUiThread { billingManager.launchPurchaseFlow() } },
                onRestoreRequested = { runOnUiThread { billingManager.queryExistingPurchases() } },
                onReviewRequested = { runOnUiThread { launchInAppReview() } }
            )
            addJavascriptInterface(bridge, JS_BRIDGE_NAME)

            webViewClient = AppWebViewClient()
            webChromeClient = WebChromeClient()
        }
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

    private inner class AppWebViewClient : WebViewClient() {

        override fun shouldOverrideUrlLoading(
            view: WebView?,
            request: WebResourceRequest?
        ): Boolean {
            val url = request?.url?.toString() ?: return false
            if (url.startsWith(WEB_APP_URL) || url.contains("webapp-conversation-cosmosk")) {
                return false
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
