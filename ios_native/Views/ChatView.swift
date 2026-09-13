import SwiftUI

struct ChatView: View {
    @EnvironmentObject var agentVM: AgentViewModel
    @State private var promptText: String = ""
    
    let commands = ["/goal", "/schedule", "/planning", "/skills", "/mcp", "/clear"]
    
    var body: some View {
        VStack(spacing: 0) {
            // Quick Commands Bar
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 8) {
                    ForEach(commands, id: \.self) { cmd in
                        Button(action: {
                            promptText = "\(cmd) "
                        }) {
                            Text(cmd)
                                .font(.system(size: 12, weight: .medium))
                                .padding(.horizontal, 12)
                                .padding(.vertical, 6)
                                .background(Capsule().fill(Color.white.opacity(0.08)))
                                .foregroundColor(.indigo)
                        }
                    }
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 8)
            }
            
            // Messages List
            ScrollViewReader { proxy in
                ScrollView {
                    LazyVStack(spacing: 14) {
                        ForEach(agentVM.messages) { msg in
                            MessageBubble(message: msg)
                                .id(msg.id)
                        }
                    }
                    .padding(16)
                }
                .onChange(of: agentVM.messages.count) { _ in
                    if let last = agentVM.messages.last {
                        withAnimation(.spring(response: 0.3, dampingFraction: 0.7)) {
                            proxy.scrollTo(last.id, anchor: .bottom)
                        }
                    }
                }
            }
            
            // Input Bar
            HStack(spacing: 10) {
                TextField("Type remote prompt or command...", text: $promptText)
                    .textFieldStyle(.plain)
                    .padding(.horizontal, 14)
                    .padding(.vertical, 10)
                    .background(RoundedRectangle(cornerRadius: 20).fill(Color.white.opacity(0.06)))
                    .foregroundColor(.white)
                
                Button(action: {
                    let text = promptText.trimmingCharacters(in: .whitespacesAndNewlines)
                    if !text.isEmpty {
                        agentVM.sendPrompt(text)
                        promptText = ""
                    }
                }) {
                    Image(systemName: "paperplane.fill")
                        .font(.system(size: 16, weight: .bold))
                        .foregroundColor(.white)
                        .frame(width: 38, height: 38)
                        .background(Circle().fill(LinearGradient(gradient: Gradient(colors: [.indigo, .purple]), startPoint: .topLeading, endPoint: .bottomTrailing)))
                        .shadow(color: .indigo.opacity(0.4), radius: 6, x: 0, y: 3)
                }
            }
            .padding(12)
            .background(Color(red: 0.05, green: 0.07, blue: 0.12).opacity(0.95))
        }
        .background(Color(red: 0.03, green: 0.04, blue: 0.08).ignoresSafeArea())
    }
}

struct MessageBubble: View {
    let message: MessageItem
    
    var body: some View {
        HStack {
            if message.sender == "user" { Spacer() }
            
            VStack(alignment: message.sender == "user" ? .trailing : .leading, spacing: 6) {
                if let thought = message.thought {
                    Text("💭 \(thought)")
                        .font(.system(size: 11, design: .monospaced))
                        .foregroundColor(.indigo)
                        .padding(8)
                        .background(RoundedRectangle(cornerRadius: 10).strokeBorder(Color.indigo.opacity(0.3)))
                }
                
                if !message.tools.isEmpty {
                    HStack(spacing: 6) {
                        ForEach(message.tools, id: \.self) { tool in
                            Text("⚙️ \(tool)")
                                .font(.system(size: 10, design: .monospaced))
                                .padding(.horizontal, 8)
                                .padding(.vertical, 3)
                                .background(Capsule().fill(Color.cyan.opacity(0.2)))
                                .foregroundColor(.cyan)
                        }
                    }
                }
                
                Text(message.content)
                    .font(.system(size: 14))
                    .foregroundColor(.white)
                    .padding(.horizontal, 14)
                    .padding(.vertical, 10)
                    .background(
                        Group {
                            if message.sender == "user" {
                                LinearGradient(gradient: Gradient(colors: [.indigo, .purple]), startPoint: .topLeading, endPoint: .bottomTrailing)
                            } else {
                                Color.white.opacity(0.08)
                            }
                        }
                    )
                    .cornerRadius(16)
            }
            .frame(maxWidth: 300, alignment: message.sender == "user" ? .trailing : .leading)
            
            if message.sender == "agent" { Spacer() }
        }
        .transition(.scale.combined(with: .opacity))
    }
}
