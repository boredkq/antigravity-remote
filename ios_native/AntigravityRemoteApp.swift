import SwiftUI

@main
struct AntigravityRemoteApp: App {
    @StateObject private var agentVM = AgentViewModel()
    
    var body: some Scene {
        WindowGroup {
            MainTabView()
                .environmentObject(agentVM)
                .preferredColorScheme(.dark)
        }
    }
}
