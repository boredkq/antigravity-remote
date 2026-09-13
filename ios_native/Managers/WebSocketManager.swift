import Foundation
import Combine

class WebSocketManager: ObservableObject {
    @Published var isConnected = false
    @Published var isAuthed = false
    @Published var pairingRequired = false
    @Published var lastMessage: [String: Any]?
    
    private var webSocketTask: URLSessionWebSocketTask?
    private var urlSession: URLSession
    private var token: String = UserDefaults.standard.string(forKey: "ag_token") ?? ""
    private var serverUrl: String = UserDefaults.standard.string(forKey: "ag_server_url") ?? "ws://localhost:8080/ws"
    
    init() {
        let config = URLSessionConfiguration.default
        self.urlSession = URLSession(configuration: config)
    }
    
    func configure(url: String, token: String) {
        self.serverUrl = url
        self.token = token
        UserDefaults.standard.set(url, forKey: "ag_server_url")
        UserDefaults.standard.set(token, forKey: "ag_token")
    }
    
    func connect() {
        guard let url = URL(string: serverUrl) else { return }
        disconnect()
        
        webSocketTask = urlSession.webSocketTask(with: url)
        webSocketTask?.resume()
        
        sendAuthToken()
        listenForMessages()
    }
    
    func disconnect() {
        webSocketTask?.cancel(with: .normalClosure, reason: nil)
        DispatchQueue.main.async {
            self.isConnected = false;
            self.isAuthed = false
        }
    }
    
    func send(json: [String: Any]) {
        guard let data = try? JSONSerialization.data(withJSONObject: json),
              let string = String(data: data, encoding: .utf8) else { return }
        
        let message = URLSessionWebSocketTask.Message.string(string)
        webSocketTask?.send(message) { error in
            if let error = error {
                print("[WebSocket] Send error: \(error.localizedDescription)")
            }
        }
    }
    
    private func sendAuthToken() {
        if token.isEmpty {
            DispatchQueue.main.async {
                self.pairingRequired = true
            }
            return
        }
        send(json: ["type": "auth", "token": token])
    }
    
    private func listenForMessages() {
        webSocketTask?.receive { [weak self] result in
            switch result {
            case .failure(let error):
                print("[WebSocket] Receive failure: \(error.localizedDescription)")
                DispatchQueue.main.async {
                    self?.isConnected = false
                    self?.isAuthed = false
                }
            case .success(let message):
                switch message {
                case .string(let text):
                    self?.handleIncomingText(text)
                case .data(let data):
                    if let text = String(data: data, encoding: .utf8) {
                        self?.handleIncomingText(text)
                    }
                @unknown default:
                    break
                }
                self?.listenForMessages()
            }
        }
    }
    
    private func handleIncomingText(_ text: String) {
        guard let data = text.data(using: .utf8),
              let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else { return }
        
        DispatchQueue.main.async {
            let msgType = json["type"] as? String ?? ""
            if msgType == "auth_success" {
                self.isConnected = true
                self.isAuthed = true
                self.pairingRequired = false
            } else if msgType == "auth_error" {
                self.isAuthed = false
                self.pairingRequired = true
            }
            self.lastMessage = json
        }
    }
}
