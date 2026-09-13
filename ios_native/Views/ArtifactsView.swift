import SwiftUI

struct ArtifactsView: View {
    @EnvironmentObject var agentVM: AgentViewModel
    
    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            Text("📜 Agent Artifacts & Plans")
                .font(.system(size: 18, weight: .bold))
                .foregroundColor(.white)
                .padding(.horizontal, 16)
                .padding(.top, 16)
            
            ScrollView {
                VStack(spacing: 12) {
                    Text("Markdown plans and artifacts will appear here")
                        .font(.system(size: 13))
                        .foregroundColor(.gray)
                        .padding(.vertical, 30)
                }
                .padding(16)
            }
        }
        .background(Color(red: 0.03, green: 0.04, blue: 0.08).ignoresSafeArea())
    }
}
