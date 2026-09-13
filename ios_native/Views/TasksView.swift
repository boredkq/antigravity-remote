import SwiftUI

struct TasksView: View {
    @EnvironmentObject var agentVM: AgentViewModel
    
    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                // System Meter Card
                VStack(alignment: .leading, spacing: 12) {
                    Text("🖥️ System Resources")
                        .font(.system(size: 16, weight: .bold))
                        .foregroundColor(.white)
                    
                    Text("\(agentVM.status.hostname) (\(agentVM.status.platform)) | \(agentVM.status.cpuCount) CPUs")
                        .font(.system(size: 12))
                        .foregroundColor(.gray)
                    
                    VStack(alignment: .leading, spacing: 6) {
                        HStack {
                            Text("Memory Usage")
                                .font(.system(size: 12))
                                .foregroundColor(.gray)
                            Spacer()
                            Text("\(agentVM.status.memoryUsedMB) MB / \(agentVM.status.memoryTotalMB) MB")
                                .font(.system(size: 12, weight: .medium))
                                .foregroundColor(.white)
                        }
                        
                        GeometryReader { geo in
                            ZStack(alignment: .leading) {
                                Capsule().fill(Color.white.opacity(0.1))
                                Capsule()
                                    .fill(LinearGradient(gradient: Gradient(colors: [.cyan, .blue]), startPoint: .leading, endPoint: .trailing))
                                    .frame(width: geo.size.width * CGFloat(agentVM.status.memoryTotalMB > 0 ? Double(agentVM.status.memoryUsedMB) / Double(agentVM.status.memoryTotalMB) : 0))
                            }
                        }
                        .frame(height: 8)
                    }
                }
                .padding(16)
                .background(RoundedRectangle(cornerRadius: 16).fill(Color.white.opacity(0.06)))
                
                // Tasks Monitor Card
                VStack(alignment: .leading, spacing: 12) {
                    Text("🤖 Active Subagents")
                        .font(.system(size: 16, weight: .bold))
                        .foregroundColor(.white)
                    
                    if agentVM.status.activeTasksCount == 0 {
                        Text("No active subagent processes currently running")
                            .font(.system(size: 13))
                            .foregroundColor(.gray)
                            .padding(.vertical, 20)
                            .frame(maxWidth: .infinity, alignment: .center)
                    } else {
                        HStack {
                            Text("Running Subagents")
                                .font(.system(size: 13))
                                .foregroundColor(.white)
                            Spacer()
                            Text("\(agentVM.status.activeTasksCount) Active")
                                .font(.system(size: 12, weight: .bold))
                                .foregroundColor(.green)
                        }
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
