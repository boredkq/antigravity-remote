import SwiftUI

struct MainTabView: View {
    @EnvironmentObject var agentVM: AgentViewModel
    @State private var selectedTab: Int = 0
    
    var body: some View {
        VStack(spacing: 0) {
            // Header
            HStack {
                HStack(spacing: 8) {
                    Image(systemName: "rocket.fill")
                        .font(.system(size: 16, weight: .bold))
                        .foregroundColor(.white)
                        .padding(6)
                        .background(RoundedRectangle(cornerRadius: 8).fill(LinearGradient(gradient: Gradient(colors: [.indigo, .purple]), startPoint: .topLeading, endPoint: .bottomTrailing)))
                    
                    Text("Antigravity")
                        .font(.system(size: 17, weight: .bold))
                        .foregroundColor(.white)
                }
                
                Spacer()
                
                HStack(spacing: 6) {
                    Circle()
                        .fill(agentVM.wsManager.isConnected ? Color.green : Color.red)
                        .frame(width: 8, height: 8)
                        .shadow(color: agentVM.wsManager.isConnected ? .green : .red, radius: 4)
                    
                    Text(agentVM.wsManager.isConnected ? "Connected" : "Offline")
                        .font(.system(size: 12, weight: .medium))
                        .foregroundColor(.gray)
                }
                .padding(.horizontal, 10)
                .padding(.vertical, 5)
                .background(Capsule().fill(Color.white.opacity(0.06)))
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 12)
            .background(Color(red: 0.05, green: 0.07, blue: 0.12).opacity(0.95))
            
            // Tab Content
            TabView(selection: $selectedTab) {
                ChatView().tag(0)
                TasksView().tag(1)
                FilesView().tag(2)
                ArtifactsView().tag(3)
                SettingsView().tag(4)
            }
            .tabViewStyle(.page(indexDisplayMode: .never))
            
            // Custom Glassmorphic Bottom Navigation
            HStack {
                TabButton(icon: "message.fill", title: "Chat", index: 0, selectedIndex: $selectedTab)
                Spacer()
                TabButton(icon: "cpu", title: "Tasks", index: 1, selectedIndex: $selectedTab)
                Spacer()
                TabButton(icon: "folder.fill", title: "Files", index: 2, selectedIndex: $selectedTab)
                Spacer()
                TabButton(icon: "doc.text.fill", title: "Artifacts", index: 3, selectedIndex: $selectedTab)
                Spacer()
                TabButton(icon: "gearshape.fill", title: "Settings", index: 4, selectedIndex: $selectedTab)
            }
            .padding(.horizontal, 20)
            .padding(.vertical, 10)
            .background(Color(red: 0.05, green: 0.07, blue: 0.12).opacity(0.95))
        }
        .background(Color(red: 0.03, green: 0.04, blue: 0.08).ignoresSafeArea())
    }
}

struct TabButton: View {
    let icon: String
    let title: String
    let index: Int
    @Binding var selectedIndex: Int
    
    var isSelected: Bool { index == selectedIndex }
    
    var body: some View {
        Button(action: {
            withAnimation(.spring(response: 0.3, dampingFraction: 0.7)) {
                selectedIndex = index
            }
        }) {
            VStack(spacing: 4) {
                Image(systemName: icon)
                    .font(.system(size: 20))
                    .foregroundColor(isSelected ? .indigo : .gray)
                
                Text(title)
                    .font(.system(size: 10, weight: isSelected ? .bold : .regular))
                    .foregroundColor(isSelected ? .indigo : .gray)
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 6)
            .background(isSelected ? Color.indigo.opacity(0.15) : Color.clear)
            .cornerRadius(12)
        }
    }
}
