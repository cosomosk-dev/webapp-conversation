package com.cosmosk.app

import android.annotation.SuppressLint
import android.content.Context
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.os.Bundle
import android.view.View
import android.webkit.WebChromeClient
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.appcompat.app.AppCompatActivity
import com.cosmosk.app.databinding.ActivityMainBinding

class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding
    private lateinit var billingManager: BillingManager
    private var isPageLoaded = false

    companion object {
        private const val WEB_APP_URL = "https://webapp-conversation-cosmosk.vercel.app"
        private const val JS_BRIDGE_NAME = "CosmosBilling"
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        initBilling()
        initWebView()
        initSwipeRefresh()
        initRetryButton()

        loadWebApp()
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
                onRestoreRequested = { runOnUiThread { billingManager.queryExistingPurchases() } }
            )
            addJavascriptInterface(bridge, JS_BRIDGE_NAME)

            webViewClient = AppWebViewClient()
            webChromeClient = WebChromeClient()
        }
    }

    private fun initSwipeRefresh() {
        binding.swipeRefresh.setOnRefreshListener {
            binding.webView.reload()
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
        binding.swipeRefresh.isRefreshing = false
    }

    private fun showError(message: String) {
        binding.loadingOverlay.visibility = View.GONE
        binding.errorOverlay.visibility = View.VISIBLE
        binding.errorText.text = message
        binding.swipeRefresh.isRefreshing = false
    }

    private fun isNetworkAvailable(): Boolean {
        val cm = getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
        val network = cm.activeNetwork ?: return false
        val capabilities = cm.getNetworkCapabilities(network) ?: return false
        return capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
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
