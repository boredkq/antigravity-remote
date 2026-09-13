import SwiftUI

struct SettingsView: View {
    @EnvironmentObject var agentVM: AgentViewModel
    @State private var serverUrl: String = UserDefaults.standard.string(forKey: "ag_server_url") ?? "ws://localhost:8080/ws"
    @State private var pairingPin: String = ""
    @State private var isInternetGateway: Bool = false
    @State private var selectedModel: String = "gemini-3.6-flash"
    
    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                // Connection Mode Selector (Local Wi-Fi vs Global Internet)
                VStack(alignment: .leading, spacing: 12) {
                    Text("📡 Server Connection Mode")
                        .font(.system(size: 16, weight: .bold))
                        .foregroundColor(.white)
                    
                    Picker("Mode", selection: $isInternetGateway) {
                        Text("Local Wi-Fi Network").tag(false)
                        Text("Global Internet Tunnel").tag(true)
                    }
                    .pickerStyle(.segmented)
                    .onChange(of: isInternetGateway) { newValue in
                        if newValue {
                            serverUrl = "wss://your-tunnel.trycloudflare.com/ws"
                        } else {
                            serverUrl = "ws://192.168.1.100:8080/ws"
                        }
                    }
                    
                    Text("Server Address (WebSocket URL)")
                        .font(.system(size: 12))
                        .foregroundColor(.gray)
                    
                    TextField("ws://...", text: $serverUrl)
                        .textFieldStyle(.plain)
                        .padding(12)
                        .background(RoundedRectangle(cornerRadius: 12).fill(Color.white.opacity(0.08)))
                        .foregroundColor(.white)
                    
                    Button(action: {
                        let token = UserDefaults.standard.string(forKey: "ag_token") ?? ""
                        agentVM.wsManager.configure(url: serverUrl, token: token)
                        agentVM.wsManager.connect()
                    }) {
                        Text("Save & Reconnect")
                            .font(.system(size: 14, weight: .bold))
                            .foregroundColor(.white)
                            .frame(maxWidth: .infinity)
                            .padding(12)
                            .background(RoundedRectangle(cornerRadius: 12).fill(LinearGradient(gradient: Gradient(colors: [.indigo, .purple]), startPoint: .leading, endPoint: .trailing)))
                    }
                }
                .padding(16)
                .background(RoundedRectangle(cornerRadius: 16).fill(Color.white.opacity(0.06)))
                
                // Security Pairing PIN Entry
                VStack(alignment: .leading, spacing: 12) {
                    Text("🔐 Security Pairing Code")
                        .font(.system(size: 16, weight: .bold))
                        .foregroundColor(.white)
                    
                    Text("Enter the 6-digit PIN code displayed on the host server console.")
                        .font(.system(size: 12))
                        .foregroundColor(.gray)
                    
                    TextField("123456", text: $pairingPin)
                        .keyboardType(.numberPad)
                        .multilineTextAlignment(.center)
                        .font(.system(size: 22, weight: .bold, design: .monospaced))
                        .padding(12)
                        .background(RoundedRectangle(cornerRadius: 12).fill(Color.white.opacity(0.08)))
                        .foregroundColor(.white)
                    
                    Button(action: {
                        agentVM.pairWithPin(pairingPin) { success in
                            if success {
                                pairingPin = ""
                            }
                        }
                    }) {
                        Text("Pair Device")
                            .font(.system(size: 14, weight: .bold))
                            .foregroundColor(.white)
                            .frame(maxWidth: .infinity)
                            .padding(12)
                            .background(RoundedRectangle(cornerRadius: 12).fill(Color.cyan))
                    }
                }
                .padding(16)
                .background(RoundedRectangle(cornerRadius: 16).fill(Color.white.opacity(0.06)))
                
                // Gemini Model Switcher
                VStack(alignment: .leading, spacing: 12) {
                    Text("🤖 Gemini Model Switcher")
                        .font(.system(size: 16, weight: .bold))
                        .foregroundColor(.white)
                    
                    Picker("Model", selection: $selectedModel) {
                        Text("Gemini 3.6 Flash").tag("gemini-3.6-flash")
                        Text("Gemini 3.5 Flash").tag("gemini-3.5-flash")
                        Text("Gemini 3.5 Pro").tag("gemini-3.5-pro")
                    }
                    .pickerStyle(.menu)
                    .tint(.indigo)
                    .onChange(of: selectedModel) { newModel in
                        agentVM.wsManager.send(json: ["type": "change_model", "model": newModel])
                    }
                }
                .padding(16)
                .background(RoundedRectangle(cornerRadius: 16).fill(Color.white.opacity(0.06)))
            }
            .padding(16)
        }
        .background(Color(red: 0.03, green: 0.04, blue: 0.08).ignoresSafeArea())
    }
}
