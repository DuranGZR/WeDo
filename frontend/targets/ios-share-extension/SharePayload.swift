import Foundation

struct SharePayload: Codable {
    let sharedText: String?
    let url: String?
    let imageUri: String?
    let mimeType: String?
    let sourceApp: String?
}
