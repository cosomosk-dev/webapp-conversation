-keepattributes *Annotation*
-keepattributes SourceFile,LineNumberTable

# Google Play Billing
-keep class com.android.vending.billing.** { *; }

# WebView JavaScript Interface
-keepclassmembers class com.cosmosk.app.WebAppInterface {
    @android.webkit.JavascriptInterface <methods>;
}

# Keep Kotlin coroutines
-keepnames class kotlinx.coroutines.internal.MainDispatcherFactory {}
-keepnames class kotlinx.coroutines.CoroutineExceptionHandler {}
