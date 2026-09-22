import UIKit
import UniformTypeIdentifiers

class ActionViewController: UIViewController {

    private let supportedHosts: Set<String> = [
        "instagram.com",
        "www.instagram.com",
        "instagr.am",
        "tiktok.com",
        "www.tiktok.com",
        "vm.tiktok.com",
        "vt.tiktok.com",
        "youtube.com",
        "www.youtube.com",
        "m.youtube.com",
        "youtu.be"
    ]

    private var appGroupId: String {
        if let customGroup = Bundle.main.object(forInfoDictionaryKey: "TabayyanAppGroupId") as? String, !customGroup.isEmpty {
            return customGroup
        }
        let bundleId = Bundle.main.bundleIdentifier ?? "com.roolxi.tabayyan"
        let baseBundle = bundleId.replacingOccurrences(of: ".action", with: "")
        return "group.\(baseBundle)"
    }

    private let isArabic: Bool = {
        let preferred = Locale.preferredLanguages.first?.lowercased() ?? ""
        return preferred.hasPrefix("ar")
    }()

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = UIColor(red: 7/255.0, green: 26/255.0, blue: 20/255.0, alpha: 1.0) // #071A14
        processSharedInput()
    }

    private func processSharedInput() {
        guard let items = extensionContext?.inputItems as? [NSExtensionItem], !items.isEmpty else {
            showError(message: isArabic ? "لم يتم العثور على محتوى مشارك." : "No shared content found.")
            return
        }

        let providers = items.flatMap { $0.attachments ?? [] }
        // Hosts may supply a thumbnail/title BEFORE the actual link.
        let types = [UTType.url.identifier, UTType.plainText.identifier, UTType.text.identifier]
        let attempts = types.flatMap { type in
            providers.filter { $0.hasItemConformingToTypeIdentifier(type) }.map { ($0, type) }
        }
        loadCandidate(attempts, index: 0, fallback: items.compactMap { $0.attributedContentText?.string }.joined(separator: " "))
    }

    private func loadCandidate(_ attempts: [(NSItemProvider, String)], index: Int, fallback: String) {
        guard index < attempts.count else {
            if let link = extractUrlFromText(fallback), let valid = validateAndNormalizeUrl(link) {
                handleValidUrl(valid)
            } else {
                showError(message: isArabic ? "شارك رابط المقطع من يوتيوب أو تيك توك أو إنستغرام." : "Share a video link from YouTube, TikTok, or Instagram.")
            }
            return
        }
        let (provider, type) = attempts[index]
        provider.loadItem(forTypeIdentifier: type, options: nil) { [weak self] item, _ in
            DispatchQueue.main.async {
                guard let self = self else { return }
                let text = (item as? URL)?.absoluteString ?? (item as? String)
                    ?? (item as? Data).flatMap { String(data: $0, encoding: .utf8) }
                if let text = text, let link = self.extractUrlFromText(text),
                   let valid = self.validateAndNormalizeUrl(link) {
                    self.handleValidUrl(valid)
                } else {
                    self.loadCandidate(attempts, index: index + 1, fallback: fallback)
                }
            }
        }
    }

    private func extractUrlFromText(_ text: String) -> String? {
        let pattern = #"(https?://[^\s]+)"#
        guard let regex = try? NSRegularExpression(pattern: pattern, options: .caseInsensitive) else {
            return nil
        }
        let nsString = text as NSString
        let results = regex.matches(in: text, options: [], range: NSRange(location: 0, length: nsString.length))
        guard let firstMatch = results.first else {
            // Check without scheme if domain matches directly
            let fallbackPattern = #"(?:www\.)?(?:youtube\.com|youtu\.be|tiktok\.com|vm\.tiktok\.com|vt\.tiktok\.com|instagram\.com|instagr\.am)/[^\s]+"#
            if let fallbackRegex = try? NSRegularExpression(pattern: fallbackPattern, options: .caseInsensitive) {
                if let fallbackMatch = fallbackRegex.matches(in: text, options: [], range: NSRange(location: 0, length: nsString.length)).first {
                    let matchedStr = nsString.substring(with: fallbackMatch.range)
                    return "https://" + matchedStr
                }
            }
            return nil
        }
        var urlStr = nsString.substring(with: firstMatch.range)
        // Clean trailing punctuation
        while let last = urlStr.last, [".", ",", ";", "!", "?", ")", "]", "}"].contains(last) {
            urlStr.removeLast()
        }
        return urlStr
    }

    private func validateAndNormalizeUrl(_ input: String) -> String? {
        var str = input.trimmingCharacters(in: .whitespacesAndNewlines)
        if !str.lowercased().hasPrefix("http://") && !str.lowercased().hasPrefix("https://") {
            str = "https://" + str
        }

        guard let components = URLComponents(string: str),
              let host = components.host?.lowercased(),
              let scheme = components.scheme?.lowercased(),
              (scheme == "http" || scheme == "https") else {
            return nil
        }

        // Host validation
        guard supportedHosts.contains(host), components.user == nil, components.password == nil,
              components.port == nil || components.port == 443, !components.path.isEmpty else {
            return nil
        }

        // Force HTTPS
        var secureComponents = components
        secureComponents.scheme = "https"

        guard let finalUrl = secureComponents.url else {
            return nil
        }

        return finalUrl.absoluteString
    }

    private func handleValidUrl(_ validUrl: String) {
        let payloadId = UUID().uuidString
        // A suite can be created even without the entitlement: check the actual container.
        guard FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: appGroupId) != nil else {
            showError(message: isArabic
                ? "توقيع التطبيق لا يتيح المشاركة الآمنة. أعد توقيع التطبيق والإضافة مع صلاحية App Groups، أو انسخ الرابط وافتح شاشة الفحص."
                : "Signing does not permit shared storage. Sign the app AND extension with matching App Groups, or paste the link in Tabayyan.")
            return
        }
        // 1. Persist to App Group container
        if let defaults = UserDefaults(suiteName: appGroupId) {
            let payload: [String: Any] = [
                "url": validUrl,
                "source": "ios-action",
                "timestamp": Date().timeIntervalSince1970,
                "id": payloadId
            ]
            defaults.set(payload, forKey: "pendingSharedPayload")
            defaults.synchronize()
        }

        // 2. Build deep link: tabayyan://handle-share?url=<percent-encoded-url>&source=ios-action
        var components = URLComponents()
        components.scheme = "tabayyan"
        components.host = "handle-share"
        components.queryItems = [
            URLQueryItem(name: "url", value: validUrl),
            URLQueryItem(name: "source", value: "ios-action"),
            URLQueryItem(name: "id", value: payloadId)
        ]
        guard let deepLinkUrl = components.url else {
            showFallbackSuccessUI()
            return
        }

        // 3. Attempt to open containing application via extensionContext
        self.extensionContext?.open(deepLinkUrl, completionHandler: { [weak self] success in
            DispatchQueue.main.async {
                guard let self = self else { return }
                if success {
                    self.extensionContext?.completeRequest(returningItems: nil, completionHandler: nil)
                } else {
                    self.showFallbackSuccessUI()
                }
            }
        })
    }

    private func showFallbackSuccessUI() {
        let titleText = isArabic ? "تم حفظ الرابط" : "Link Saved"
        let msgText = isArabic
            ? "تم حفظ الرابط بنجاح. يمكنك الآن فتح تطبيق تبيّن لمتابعة التحقق."
            : "The link has been saved. Open Tabayyan to continue verification."
        let buttonText = isArabic ? "تم" : "Done"

        presentMessageCard(title: titleText, message: msgText, buttonTitle: buttonText, isSuccess: true)
    }

    private func showError(message: String) {
        let titleText = isArabic ? "تعذر الفحص" : "Verification Unavailable"
        let buttonText = isArabic ? "إلغاء" : "Dismiss"

        presentMessageCard(title: titleText, message: message, buttonTitle: buttonText, isSuccess: false)
    }

    private func presentMessageCard(title: String, message: String, buttonTitle: String, isSuccess: Bool) {
        // Clean container
        view.subviews.forEach { $0.removeFromSuperview() }

        let card = UIView()
        card.translatesAutoresizingMaskIntoConstraints = false
        card.backgroundColor = UIColor(red: 16/255.0, green: 40/255.0, blue: 32/255.0, alpha: 0.95)
        card.layer.cornerRadius = 20
        card.layer.borderWidth = 1
        card.layer.borderColor = isSuccess
            ? UIColor(red: 212/255.0, green: 175/255.0, blue: 55/255.0, alpha: 0.4).cgColor
            : UIColor.red.withAlphaComponent(0.3).cgColor
        card.layer.masksToBounds = true
        view.addSubview(card)

        let iconLabel = UILabel()
        iconLabel.translatesAutoresizingMaskIntoConstraints = false
        iconLabel.text = isSuccess ? "✨" : "⚠️"
        iconLabel.font = UIFont.systemFont(ofSize: 36)
        iconLabel.textAlignment = .center
        card.addSubview(iconLabel)

        let titleLabel = UILabel()
        titleLabel.translatesAutoresizingMaskIntoConstraints = false
        titleLabel.text = title
        titleLabel.font = UIFont.boldSystemFont(ofSize: 18)
        titleLabel.textColor = UIColor.white
        titleLabel.textAlignment = .center
        card.addSubview(titleLabel)

        let msgLabel = UILabel()
        msgLabel.translatesAutoresizingMaskIntoConstraints = false
        msgLabel.text = message
        msgLabel.font = UIFont.systemFont(ofSize: 14)
        msgLabel.textColor = UIColor(white: 0.85, alpha: 1.0)
        msgLabel.numberOfLines = 0
        msgLabel.textAlignment = .center
        card.addSubview(msgLabel)

        let actionButton = UIButton(type: .system)
        actionButton.translatesAutoresizingMaskIntoConstraints = false
        actionButton.setTitle(buttonTitle, for: .normal)
        actionButton.titleLabel?.font = UIFont.boldSystemFont(ofSize: 16)
        actionButton.setTitleColor(UIColor.black, for: .normal)
        actionButton.backgroundColor = UIColor(red: 212/255.0, green: 175/255.0, blue: 55/255.0, alpha: 1.0) // Gold
        actionButton.layer.cornerRadius = 14
        actionButton.addTarget(self, action: #selector(handleDismiss), for: .touchUpInside)
        card.addSubview(actionButton)

        NSLayoutConstraint.activate([
            card.centerYAnchor.constraint(equalTo: view.centerYAnchor),
            card.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 28),
            card.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -28),

            iconLabel.topAnchor.constraint(equalTo: card.topAnchor, constant: 24),
            iconLabel.centerXAnchor.constraint(equalTo: card.centerXAnchor),

            titleLabel.topAnchor.constraint(equalTo: iconLabel.bottomAnchor, constant: 12),
            titleLabel.leadingAnchor.constraint(equalTo: card.leadingAnchor, constant: 16),
            titleLabel.trailingAnchor.constraint(equalTo: card.trailingAnchor, constant: -16),

            msgLabel.topAnchor.constraint(equalTo: titleLabel.bottomAnchor, constant: 8),
            msgLabel.leadingAnchor.constraint(equalTo: card.leadingAnchor, constant: 16),
            msgLabel.trailingAnchor.constraint(equalTo: card.trailingAnchor, constant: -16),

            actionButton.topAnchor.constraint(equalTo: msgLabel.bottomAnchor, constant: 20),
            actionButton.leadingAnchor.constraint(equalTo: card.leadingAnchor, constant: 20),
            actionButton.trailingAnchor.constraint(equalTo: card.trailingAnchor, constant: -20),
            actionButton.heightAnchor.constraint(equalToConstant: 44),
            actionButton.bottomAnchor.constraint(equalTo: card.bottomAnchor, constant: -24)
        ])
    }

    @objc private func handleDismiss() {
        extensionContext?.completeRequest(returningItems: nil, completionHandler: nil)
    }
}
