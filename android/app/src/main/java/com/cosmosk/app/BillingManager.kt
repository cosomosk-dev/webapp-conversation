package com.cosmosk.app

import android.app.Activity
import android.util.Log
import com.android.billingclient.api.AcknowledgePurchaseParams
import com.android.billingclient.api.BillingClient
import com.android.billingclient.api.BillingClientStateListener
import com.android.billingclient.api.BillingFlowParams
import com.android.billingclient.api.BillingResult
import com.android.billingclient.api.PendingPurchasesParams
import com.android.billingclient.api.ProductDetails
import com.android.billingclient.api.Purchase
import com.android.billingclient.api.PurchasesUpdatedListener
import com.android.billingclient.api.QueryProductDetailsParams
import com.android.billingclient.api.QueryPurchasesParams
import com.android.billingclient.api.QueryProductDetailsResult
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

class BillingManager(
    private val activity: Activity,
    private val onPurchaseResult: (success: Boolean, message: String) -> Unit
) : PurchasesUpdatedListener {

    companion object {
        private const val TAG = "BillingManager"
        const val PRODUCT_ID = "cosmosk_monthly_500"
    }

    private var billingClient: BillingClient? = null
    private var productDetails: ProductDetails? = null
    private val coroutineScope = CoroutineScope(Dispatchers.Main)

    fun initialize() {
        billingClient = BillingClient.newBuilder(activity)
            .setListener(this)
            .enablePendingPurchases(
                PendingPurchasesParams.newBuilder()
                    .enableOneTimeProducts()
                    .enablePrepaidPlans()
                    .build()
            )
            .build()

        startConnection()
    }

    private fun startConnection() {
        billingClient?.startConnection(object : BillingClientStateListener {
            override fun onBillingSetupFinished(billingResult: BillingResult) {
                if (billingResult.responseCode == BillingClient.BillingResponseCode.OK) {
                    Log.d(TAG, "Billing client connected")
                    queryProductDetails()
                    queryExistingPurchases()
                } else {
                    Log.e(TAG, "Billing setup failed: ${billingResult.debugMessage}")
                }
            }

            override fun onBillingServiceDisconnected() {
                Log.w(TAG, "Billing service disconnected, retrying...")
                startConnection()
            }
        })
    }

    private fun queryProductDetails() {
        val productList = listOf(
            QueryProductDetailsParams.Product.newBuilder()
                .setProductId(PRODUCT_ID)
                .setProductType(BillingClient.ProductType.SUBS)
                .build()
        )

        val params = QueryProductDetailsParams.newBuilder()
            .setProductList(productList)
            .build()

        billingClient?.queryProductDetailsAsync(params) { billingResult, result ->
            if (billingResult.responseCode == BillingClient.BillingResponseCode.OK) {
                productDetails = result.productDetailsList.firstOrNull()
                if (productDetails == null) {
                    Log.w(TAG, "Product $PRODUCT_ID not found in Play Console")
                }
            } else {
                Log.e(TAG, "Failed to query product details: ${billingResult.debugMessage}")
            }
        }
    }

    fun queryExistingPurchases() {
        val params = QueryPurchasesParams.newBuilder()
            .setProductType(BillingClient.ProductType.SUBS)
            .build()

        billingClient?.queryPurchasesAsync(params) { billingResult, purchases ->
            if (billingResult.responseCode == BillingClient.BillingResponseCode.OK) {
                val activeSub = purchases.firstOrNull { purchase ->
                    purchase.products.contains(PRODUCT_ID) &&
                        purchase.purchaseState == Purchase.PurchaseState.PURCHASED
                }
                if (activeSub != null) {
                    Log.d(TAG, "Active subscription found")
                    handlePurchase(activeSub)
                }
            }
        }
    }

    fun launchPurchaseFlow() {
        val details = productDetails
        if (details == null) {
            onPurchaseResult(false, "商品情報を取得できません。しばらくしてから再度お試しください。")
            return
        }

        val offerToken = details.subscriptionOfferDetails?.firstOrNull()?.offerToken
        if (offerToken == null) {
            onPurchaseResult(false, "サブスクリプション情報を取得できません。")
            return
        }

        val productDetailsParamsList = listOf(
            BillingFlowParams.ProductDetailsParams.newBuilder()
                .setProductDetails(details)
                .setOfferToken(offerToken)
                .build()
        )

        val billingFlowParams = BillingFlowParams.newBuilder()
            .setProductDetailsParamsList(productDetailsParamsList)
            .build()

        val result = billingClient?.launchBillingFlow(activity, billingFlowParams)
        if (result?.responseCode != BillingClient.BillingResponseCode.OK) {
            Log.e(TAG, "Launch billing flow failed: ${result?.debugMessage}")
            onPurchaseResult(false, "購入画面を表示できません。")
        }
    }

    override fun onPurchasesUpdated(
        billingResult: BillingResult,
        purchases: MutableList<Purchase>?
    ) {
        when (billingResult.responseCode) {
            BillingClient.BillingResponseCode.OK -> {
                purchases?.forEach { purchase ->
                    handlePurchase(purchase)
                }
            }
            BillingClient.BillingResponseCode.USER_CANCELED -> {
                Log.d(TAG, "Purchase cancelled by user")
                onPurchaseResult(false, "購入がキャンセルされました。")
            }
            else -> {
                Log.e(TAG, "Purchase error: ${billingResult.debugMessage}")
                onPurchaseResult(false, "購入処理中にエラーが発生しました。")
            }
        }
    }

    private fun handlePurchase(purchase: Purchase) {
        if (purchase.purchaseState == Purchase.PurchaseState.PURCHASED) {
            if (!purchase.isAcknowledged) {
                acknowledgePurchase(purchase)
            } else {
                onPurchaseResult(true, "サブスクリプションが有効です。")
            }
        } else if (purchase.purchaseState == Purchase.PurchaseState.PENDING) {
            onPurchaseResult(false, "購入処理が保留中です。完了までお待ちください。")
        }
    }

    private fun acknowledgePurchase(purchase: Purchase) {
        val params = AcknowledgePurchaseParams.newBuilder()
            .setPurchaseToken(purchase.purchaseToken)
            .build()

        coroutineScope.launch {
            billingClient?.acknowledgePurchase(params) { billingResult ->
                if (billingResult.responseCode == BillingClient.BillingResponseCode.OK) {
                    Log.d(TAG, "Purchase acknowledged successfully")
                    onPurchaseResult(true, "サブスクリプションが有効になりました！")
                } else {
                    Log.e(TAG, "Acknowledge failed: ${billingResult.debugMessage}")
                    onPurchaseResult(true, "サブスクリプション有効（確認処理は次回再試行します）")
                }
            }
        }
    }

    fun destroy() {
        billingClient?.endConnection()
        billingClient = null
    }
}
