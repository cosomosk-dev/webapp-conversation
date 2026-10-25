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

# Firebase
-keep class com.google.firebase.** { *; }
-keep class com.google.android.gms.** { *; }
-dontwarn com.google.firebase.**
-dontwarn com.google.android.gms.**
