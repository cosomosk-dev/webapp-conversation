package com.cosmosk.app

import android.webkit.JavascriptInterface

class WebAppInterface(
    private val onSubscribeRequested: () -> Unit,
    private val onRestoreRequested: () -> Unit
) {
    @JavascriptInterface
    fun subscribe() {
        onSubscribeRequested()
    }

    @JavascriptInterface
    fun restorePurchase() {
        onRestoreRequested()
    }

    @JavascriptInterface
    fun isNativeApp(): Boolean = true
}
