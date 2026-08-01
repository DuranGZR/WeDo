package com.wedo.share

data class SharePayload(
    val sharedText: String? = null,
    val url: String? = null,
    val imageUri: String? = null,
    val mimeType: String? = null,
    val sourceApp: String? = null,
)
