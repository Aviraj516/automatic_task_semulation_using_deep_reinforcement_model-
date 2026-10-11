export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';

export type TaskStatus = 
  | 'WAITING' 
  | 'ROUTING_ROUTER' 
  | 'ROUTING_SWITCH' 
  | 'SCHEDULING' 
  | 'PROCESSING' 
  | 'COMPLETED';

export interface SimpleExplanation {
  delay: string;
  queue: string;
  cpu: string;
  priority: string;
  summary: string;
}

export interface EdgeTask {
  id: string;
  cpuRequirement: number; // CPU cores needed (1..12)
  dataSize: number;       // MB
  priority: TaskPriority;
  deadline: number;       // ms (SLA deadline)
  executionTime: number;  // ms (CPU processing duration)
  status: TaskStatus;
  assignedServerId?: number;
  progress?: number;       // 0..100 processing progress
  explanation?: SimpleExplanation;
}

export interface EdgeServer {
  id: number;
  name: string;
  baseCpu: number;        // base load %
  currentCpu: number;     // active load % (base + task load)
  queueCount: number;
  status: 'AVAILABLE' | 'BUSY';
  processingTasks: EdgeTask[];
  waitingTasks: EdgeTask[];
}

export interface PPODecisionResult {
  taskId: string;
  selectedServerId: number;
  explanation: SimpleExplanation;
}
