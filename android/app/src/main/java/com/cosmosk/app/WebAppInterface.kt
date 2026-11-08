package com.cosmosk.app

import android.webkit.JavascriptInterface

class WebAppInterface(
    private val onSubscribeRequested: () -> Unit,
    private val onRestoreRequested: () -> Unit,
    private val onReviewRequested: () -> Unit,
    private val onNotificationPermissionRequested: () -> Unit,
    private val onGradingComplete: () -> Unit,
    private val onShareRequested: (target: String, text: String) -> Unit,
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

    @JavascriptInterface
    fun requestInAppReview() {
        onReviewRequested()
    }

    @JavascriptInterface
    fun requestNotificationPermission() {
        onNotificationPermissionRequested()
    }

    @JavascriptInterface
    fun logGradingComplete() {
        onGradingComplete()
    }

    /** LINE / X / インスタのアプリを直接開いて文面を送る。target は "line" / "x" / "instagram" */
    @JavascriptInterface
    fun shareTo(target: String, text: String) {
        onShareRequested(target, text)
    }
}
