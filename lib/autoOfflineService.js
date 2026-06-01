// lib/autoOfflineService.js
import dbConnect from './dbConnect';
import User from '../models/Users';
import WorkSession from '../models/WorkSession';

export async function markInactiveAgentsOffline() {
  try {
    await dbConnect();
    
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    // Find agents who are marked ONLINE but haven't had activity in 5 minutes
    const inactiveAgents = await User.find({
      role: 'agent',
      currentStatus: 'ONLINE',
      lastActivity: { $lt: fiveMinutesAgo }
    });
    
    for (const agent of inactiveAgents) {
      console.log(`Marking agent ${agent.name} (${agent._id}) as offline due to inactivity`);
      
      // Update agent status
      agent.currentStatus = 'OFFLINE';
      await agent.save();
      
      // Find today's work session
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const workSession = await WorkSession.findOne({
        agentId: agent._id,
        date: {
          $gte: today,
          $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
        }
      });
      
      if (workSession) {
        const previousStatus = workSession.status;
        workSession.status = 'OFFLINE';
        
        // Add to status history only if status changed
        if (previousStatus !== 'OFFLINE') {
          workSession.statusHistory.push({
            status: 'OFFLINE',
            timestamp: new Date()
          });
        }
        
        // Set leftTime if not already set
        if (!workSession.leftTime && workSession.arrivalTime) {
          workSession.leftTime = new Date();
        }
        
        await workSession.save();
      }
    }
    
    if (inactiveAgents.length > 0) {
      console.log(`Marked ${inactiveAgents.length} agents as offline`);
    }
    
  } catch (error) {
    console.error('Error in auto-offline service:', error);
  }
}

// Run this function every minute
export function startAutoOfflineService() {
  // Run immediately
  markInactiveAgentsOffline();
  
  // Then run every minute
  setInterval(markInactiveAgentsOffline, 60 * 1000);
  
  console.log('Auto-offline service started');
}