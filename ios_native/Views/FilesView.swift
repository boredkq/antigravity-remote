import SwiftUI

struct FilesView: View {
    @EnvironmentObject var agentVM: AgentViewModel
    
    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            Text("📁 Workspace File Explorer")
                .font(.system(size: 18, weight: .bold))
                .foregroundColor(.white)
                .padding(.horizontal, 16)
                .padding(.top, 16)
            
            ScrollView {
                VStack(spacing: 8) {
                    Text("Connect to host to view files in active workspace")
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
