//
//  SafariWebExtensionHandler.swift
//  Shared (Extension)
//
//  Created by John Keating on 07/08/2026.
//

import SafariServices
import AVFAudio

private final class NativeSpeechController: NSObject, AVSpeechSynthesizerDelegate {
    static let shared = NativeSpeechController()

    private let synthesizer = AVSpeechSynthesizer()
    private var activeUtterance: AVSpeechUtterance?
    private var activeRequestID = ""
    private var playbackState = "idle"

    private override init() {
        super.init()
        synthesizer.delegate = self
    }

    func handle(_ message: [String: Any]) -> [String: Any] {
        switch message["command"] as? String {
        case "ping":
            return ["ok": true, "engine": "AVSpeechSynthesizer"]
        case "voices":
            return ["ok": true, "voices": premiumVoices()]
        case "speak":
            return speak(message)
        case "pause":
            if synthesizer.isSpeaking && !synthesizer.isPaused {
                _ = synthesizer.pauseSpeaking(at: .immediate)
                playbackState = "paused"
            }
            return status()
        case "resume":
            if synthesizer.isPaused {
                _ = synthesizer.continueSpeaking()
                playbackState = "speaking"
            }
            return status()
        case "stop":
            stop()
            return status()
        case "status":
            return status()
        default:
            return ["ok": false, "error": "Unknown native speech command"]
        }
    }

    private func premiumVoices() -> [[String: Any]] {
        AVSpeechSynthesisVoice.speechVoices()
            .filter { $0.quality.rawValue > AVSpeechSynthesisVoiceQuality.default.rawValue }
            .sorted {
                if $0.language != $1.language { return $0.language < $1.language }
                if $0.quality.rawValue != $1.quality.rawValue { return $0.quality.rawValue > $1.quality.rawValue }
                return $0.name.localizedCaseInsensitiveCompare($1.name) == .orderedAscending
            }
            .map { voice in
                [
                    "identifier": voice.identifier,
                    "name": voice.name,
                    "language": voice.language,
                    "quality": voiceQualityName(voice.quality.rawValue)
                ]
            }
    }

    private func speak(_ message: [String: Any]) -> [String: Any] {
        guard let text = message["text"] as? String, !text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
            return ["ok": false, "error": "No text was supplied for native speech"]
        }

        if synthesizer.isSpeaking || synthesizer.isPaused {
            _ = synthesizer.stopSpeaking(at: .immediate)
        }

        let utterance = AVSpeechUtterance(string: text)
        if let identifier = message["voiceIdentifier"] as? String, !identifier.isEmpty,
           let voice = AVSpeechSynthesisVoice(identifier: identifier) {
            utterance.voice = voice
        } else if let language = message["language"] as? String {
            utterance.voice = AVSpeechSynthesisVoice(language: language)
        }

        let requestedRate = (message["rate"] as? NSNumber)?.floatValue ?? 1
        utterance.rate = max(
            AVSpeechUtteranceMinimumSpeechRate,
            min(AVSpeechUtteranceMaximumSpeechRate, AVSpeechUtteranceDefaultSpeechRate * requestedRate)
        )

        activeRequestID = message["requestId"] as? String ?? UUID().uuidString
        activeUtterance = utterance
        playbackState = "starting"
        synthesizer.speak(utterance)
        return status()
    }

    private func stop() {
        if synthesizer.isSpeaking || synthesizer.isPaused {
            _ = synthesizer.stopSpeaking(at: .immediate)
        }
        activeUtterance = nil
        activeRequestID = ""
        playbackState = "idle"
    }

    private func status() -> [String: Any] {
        [
            "ok": true,
            "state": playbackState,
            "requestId": activeRequestID,
            "speaking": synthesizer.isSpeaking,
            "paused": synthesizer.isPaused
        ]
    }

    private func voiceQualityName(_ rawValue: Int) -> String {
        switch rawValue {
        case 3...: return "Premium"
        case 2: return "Enhanced"
        default: return "Default"
        }
    }

    func speechSynthesizer(_ synthesizer: AVSpeechSynthesizer, didStart utterance: AVSpeechUtterance) {
        guard utterance === activeUtterance else { return }
        playbackState = "speaking"
    }

    func speechSynthesizer(_ synthesizer: AVSpeechSynthesizer, didPause utterance: AVSpeechUtterance) {
        guard utterance === activeUtterance else { return }
        playbackState = "paused"
    }

    func speechSynthesizer(_ synthesizer: AVSpeechSynthesizer, didContinue utterance: AVSpeechUtterance) {
        guard utterance === activeUtterance else { return }
        playbackState = "speaking"
    }

    func speechSynthesizer(_ synthesizer: AVSpeechSynthesizer, didFinish utterance: AVSpeechUtterance) {
        guard utterance === activeUtterance else { return }
        playbackState = "finished"
        activeUtterance = nil
    }

    func speechSynthesizer(_ synthesizer: AVSpeechSynthesizer, didCancel utterance: AVSpeechUtterance) {
        guard utterance === activeUtterance else { return }
        playbackState = "idle"
        activeUtterance = nil
        activeRequestID = ""
    }
}

class SafariWebExtensionHandler: NSObject, NSExtensionRequestHandling {

    func beginRequest(with context: NSExtensionContext) {
        let request = context.inputItems.first as? NSExtensionItem

        let message: Any?
        if #available(iOS 15.0, macOS 11.0, *) {
            message = request?.userInfo?[SFExtensionMessageKey]
        } else {
            message = request?.userInfo?["message"]
        }

        let messageDictionary = message as? [String: Any] ?? [:]
        DispatchQueue.main.async {
            let result = NativeSpeechController.shared.handle(messageDictionary)
            let response = NSExtensionItem()
            if #available(iOS 15.0, macOS 11.0, *) {
                response.userInfo = [SFExtensionMessageKey: result]
            } else {
                response.userInfo = ["message": result]
            }
            context.completeRequest(returningItems: [response], completionHandler: nil)
        }
    }

}
