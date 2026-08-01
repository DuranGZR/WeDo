package com.wedo.share

import android.app.Activity
import android.content.Intent
import android.os.Bundle

class ShareReceiverActivity : Activity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val sharedText = intent.getStringExtra(Intent.EXTRA_TEXT)
        val payload = SharePayload(
            sharedText = sharedText,
            url = sharedText?.takeIf { it.startsWith("http") },
            mimeType = intent.type,
            sourceApp = callingPackage,
        )
        // The config plugin/native module will forward this payload to the RN share route.
        setResult(RESULT_OK, Intent().putExtra("wedo.share.payload", payload.url ?: payload.sharedText))
        finish()
    }
}
