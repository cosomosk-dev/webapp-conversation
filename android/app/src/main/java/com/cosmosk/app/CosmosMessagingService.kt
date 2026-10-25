package com.cosmosk.app

import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Intent
import android.util.Log
import androidx.core.app.NotificationCompat
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage

class CosmosMessagingService : FirebaseMessagingService() {

    companion object {
        private const val TAG = "CosmosMessaging"
        const val CHANNEL_ID = "cosmosk_notifications"
        const val CHANNEL_NAME = "お知らせ"
    }

    override fun onNewToken(token: String) {
        super.onNewToken(token)
        Log.d(TAG, "FCM token refreshed")
    }

    override fun onMessageReceived(message: RemoteMessage) {
        super.onMessageReceived(message)
        Log.d(TAG, "FCM message received: ${message.messageId}")

        val notification = message.notification ?: return
        val title = notification.title ?: getString(R.string.app_name)
        val body = notification.body ?: return

        showNotification(title, body)
    }

    private fun showNotification(title: String, body: String) {
        val notificationManager = getSystemService(NOTIFICATION_SERVICE) as NotificationManager

        val intent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP
        }
        val pendingIntent = PendingIntent.getActivity(
            this, 0, intent,
            PendingIntent.FLAG_ONE_SHOT or PendingIntent.FLAG_IMMUTABLE
        )

        val notification = NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle(title)
            .setContentText(body)
            .setAutoCancel(true)
            .setContentIntent(pendingIntent)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .build()

        notificationManager.notify(System.currentTimeMillis().toInt(), notification)
    }
}
