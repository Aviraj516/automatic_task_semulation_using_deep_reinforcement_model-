import type { EdgeTask, EdgeServer, PPODecisionResult } from '../types/simulation';

export class MockPPOScheduler {
  evaluateTask(task: EdgeTask, servers: EdgeServer[]): PPODecisionResult {
    // Score servers based on total load (currentCpu + queueCount * 15)
    // Lower score is better
    const scoredServers = servers.map((srv) => {
      const penalty = srv.status === 'BUSY' ? 100 : 0;
      const queuePenalty = (srv.queueCount + srv.processingTasks.length + srv.waitingTasks.length) * 20;
      const cpuPenalty = srv.currentCpu;
      const score = penalty + queuePenalty + cpuPenalty;

      return { server: srv, score };
    });

    // Sort to pick lowest loaded server
    scoredServers.sort((a, b) => a.score - b.score);
    const chosenServer = scoredServers[0].server;

    return {
      taskId: task.id,
      selectedServerId: chosenServer.id,
      explanation: {
        delay: chosenServer.id % 2 === 0 ? 'Low (12ms)' : 'Optimal (16ms)',
        queue: chosenServer.queueCount === 0 ? 'Low (0 queued)' : `Minimal (${chosenServer.queueCount} queued)`,
        cpu: `Good (${100 - chosenServer.currentCpu}% free)`,
        priority: `${task.priority} Priority SLA aligned`,
        summary: `These conditions made ${chosenServer.name} suitable for task ${task.id}.`,
      }
    };
  }
}

export const defaultPPOScheduler = new MockPPOScheduler();
