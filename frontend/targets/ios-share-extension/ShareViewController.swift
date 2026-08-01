import Social
import UniformTypeIdentifiers

final class ShareViewController: SLComposeServiceViewController {
    override func isContentValid() -> Bool { true }

    override func didSelectPost() {
        let extensionItem = extensionContext?.inputItems.first as? NSExtensionItem
        let provider = extensionItem?.attachments?.first
        let type = UTType.url.identifier
        provider?.loadItem(forTypeIdentifier: type, options: nil) { item, _ in
            let url = (item as? URL)?.absoluteString
            let payload = SharePayload(sharedText: nil, url: url, imageUri: nil, mimeType: type, sourceApp: nil)
            if let data = try? JSONEncoder().encode(payload),
               let value = String(data: data, encoding: .utf8) {
                UserDefaults(suiteName: "group.com.wedo.app")?.set(value, forKey: "wedo.share.payload")
            }
            DispatchQueue.main.async { self.extensionContext?.completeRequest(returningItems: nil) }
        }
    }
}
