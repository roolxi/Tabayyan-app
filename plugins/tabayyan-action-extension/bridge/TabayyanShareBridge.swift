import Foundation
import React

@objc(TabayyanShareBridge)
public class TabayyanShareBridge: NSObject {

    private var appGroupId: String {
        if let customGroup = Bundle.main.object(forInfoDictionaryKey: "TabayyanAppGroupId") as? String, !customGroup.isEmpty {
            return customGroup
        }
        let bundleId = Bundle.main.bundleIdentifier ?? "com.roolxi.tabayyan"
        return "group.\(bundleId)"
    }

    @objc
    public func getPendingSharedPayload(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        guard let defaults = UserDefaults(suiteName: appGroupId) else {
            resolve(nil)
            return
        }
        let payload = defaults.dictionary(forKey: "pendingSharedPayload")
        resolve(payload)
    }

    @objc
    public func clearPendingSharedPayload(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        if let defaults = UserDefaults(suiteName: appGroupId) {
            defaults.removeObject(forKey: "pendingSharedPayload")
            defaults.synchronize()
        }
        resolve(true)
    }
}

