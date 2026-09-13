import Foundation
import Combine
import SwiftUI

struct MessageItem: Identifiable {
    let id = UUID()
    let sender: String // "user" or "agent"
    var content: String
    var thought: String?
    var tools: [String] = []
    let timestamp = Date()
}

struct SystemStatus {
    var hostname: String = ""
    var platform: String = ""
    var cpuCount: Int = 0
    var memoryUsedMB: Int = 0
    var memoryTotalMB: Int = 0
    var activeTasksCount: Int = 0
}

class AgentViewModel: ObservableObject {
    @Published var messages: [MessageItem] = [
        MessageItem(sender: "agent", content: "👋 Welcome to **Antigravity Remote** for iOS!\nYou can manage agents, execute commands, track tasks, and browse workspace files over Local Wi-Fi or Public Internet.")
    ]
    @Published var status = SystemStatus()
    @Published var selectedModel: String = "gemini-3.6-flash"
    @Published var isProcessing: Bool = false
    @Published var workspaceFiles: [[String: Any]] = []
    @Published var artifacts: [[String: Any]] = []
    
    val wsManager = WebSocketManager()
    private var cancellables = Set<AnyCancellable>()
    
    init() {
        wsManager.$lastMessage
            .compactMap { $0 }
            .sink { [weak self] msg in
                self?.handleWebSocketMessage(msg)
            }
            .store(in: &cancellables)
    }
    
    func sendPrompt(_ text: String) {
        guard !text.isEmpty else { return }
        messages.append(MessageItem(sender: "user", content: text))
        wsManager.send(json: ["type": "prompt", "prompt": text])
        isProcessing = true
    }
    
    func pairWithPin(_ pin: String, completion: @escaping (Bool) -> Void) {
        let baseUrl = UserDefaults.standard.string(forKey: "ag_http_url") ?? "http://localhost:8080"
        guard let url = URL(string: "\(baseUrl)/api/pair") else { return }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try? JSONSerialization.data(withJSONObject: ["pin": pin])
        
        URLSession.shared.dataTask(with: request) { [weak self] data, response, error in
            guard let data = data,
                  let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
                  let success = json["success"] as? Bool, success,
                  let token = json["token"] as? String else {
                DispatchQueue.main.async { completion(false) }
                return
            }
            
            DispatchQueue.main.async {
                let wsUrl = baseUrl.replacingOccurrences(of: "http", with: "ws") + "/ws"
                self?.wsManager.configure(url: wsUrl, token: token)
                self?.wsManager.connect()
                completion(true)
            }
        }.resume()
    }
    
    private func handleWebSocketMessage(_ json: [String: Any]) {
        guard let type = json["type"] as? String else { return }
        
        switch type {
        case "auth_success", "status_update":
            if let st = json["status"] as? [String: Any] {
                updateStatus(st)
            }
        case "agent_start":
            messages.append(MessageItem(sender: "agent", content: ""))
            isProcessing = true
        case "agent_thought":
            if let content = json["content"] as? String, !messages.isEmpty {
                messages[messages.count - 1].thought = content
            }
        case "agent_tool_call":
            if let tool = json["tool"] as? String, !messages.isEmpty {
                messages[messages.count - 1].tools.append(tool)
            }
        case "agent_chunk":
            if let chunk = json["chunk"] as? String, !messages.isEmpty {
                messages[messages.count - 1].content += chunk
            }
        case "agent_complete":
            isProcessing = false
        default:
            break
        }
    }
    
    private func updateStatus(_ st: [String: Any]) {
        status.hostname = st["hostname"] as? String ?? ""
        status.platform = st["platform"] as? String ?? ""
        status.cpuCount = st["cpuCount"] as? Int ?? 0
        if let mem = st["memory"] as? [String: Any] {
            status.memoryUsedMB = mem["usedMB"] as? Int ?? 0
            status.memoryTotalMB = mem["totalMB"] as? Int ?? 0
        }
        status.activeTasksCount = st["activeTasksCount"] as? Int ?? 0
    }
}
