import React, { useState } from 'react';
import type { EdgeTask, EdgeServer } from './types/simulation';
import { runMultiTaskSimulation } from './services/simulationEngine';
import { Header } from './components/Header';
import { TaskForm } from './components/TaskForm';
import { NetworkDiagram } from './components/NetworkDiagram';
import { ExplainabilityLog } from './components/ExplainabilityLog';

const INITIAL_SERVERS: EdgeServer[] = [
  { id: 1, name: 'Server 1', baseCpu: 20, currentCpu: 20, queueCount: 0, status: 'AVAILABLE', processingTasks: [], waitingTasks: [] },
  { id: 2, name: 'Server 2', baseCpu: 15, currentCpu: 15, queueCount: 0, status: 'AVAILABLE', processingTasks: [], waitingTasks: [] },
  { id: 3, name: 'Server 3', baseCpu: 45, currentCpu: 45, queueCount: 0, status: 'AVAILABLE', processingTasks: [], waitingTasks: [] },
  { id: 4, name: 'Server 4', baseCpu: 30, currentCpu: 30, queueCount: 0, status: 'AVAILABLE', processingTasks: [], waitingTasks: [] },
];

const INITIAL_TASKS: EdgeTask[] = [
  { id: 'T-001', cpuRequirement: 3, dataSize: 15, priority: 'HIGH', deadline: 500, executionTime: 200, status: 'WAITING' },
  { id: 'T-002', cpuRequirement: 6, dataSize: 8, priority: 'MEDIUM', deadline: 600, executionTime: 150, status: 'WAITING' },
  { id: 'T-003', cpuRequirement: 1, dataSize: 25, priority: 'HIGH', deadline: 400, executionTime: 300, status: 'WAITING' },
];

export const App: React.FC = () => {
  const [servers, setServers] = useState<EdgeServer[]>(INITIAL_SERVERS);
  const [tasks, setTasks] = useState<EdgeTask[]>(INITIAL_TASKS);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [ppoMessage, setPpoMessage] = useState<string | null>(null);
  const [targetServerId, setTargetServerId] = useState<number | null>(null);

  const handleAddTask = (newTask: EdgeTask) => {
    setTasks((prev) => [...prev, newTask]);
  };

  const handleClearQueue = () => {
    if (isSimulating) return;
    setTasks([]);
    setServers(INITIAL_SERVERS);
    setPpoMessage(null);
    setTargetServerId(null);
  };

  const handleStartSimulation = () => {
    if (isSimulating || tasks.length === 0) return;

    setIsSimulating(true);
    runMultiTaskSimulation(
      tasks,
      setTasks,
      servers,
      setServers,
      setPpoMessage,
      setTargetServerId,
      () => {
        setIsSimulating(false);
      }
    );
  };

  // Filter tasks currently traveling in the network diagram
  const activeRoutingTasks = tasks.filter((t) =>
    ['ROUTING_ROUTER', 'ROUTING_SWITCH', 'SCHEDULING'].includes(t.status)
  );

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-main)', display: 'flex', flexDirection: 'column' }}>
      {/* Simple Academic Header */}
      <Header />

      {/* Main Content Layout */}
      <main style={{
        maxWidth: '1440px',
        width: '100%',
        margin: '0 auto',
        padding: '0 24px 32px 24px',
        flex: 1,
        display: 'grid',
        gridTemplateColumns: '380px 1fr',
        gap: '20px',
        alignItems: 'start'
      }}>
        {/* LEFT COLUMN: Task Input, Queue & Decision Rationale */}
        <div>
          <TaskForm
            tasks={tasks}
            onAddTask={handleAddTask}
            onStartSimulation={handleStartSimulation}
            onClearQueue={handleClearQueue}
            isSimulating={isSimulating}
          />

          <ExplainabilityLog tasks={tasks} />
        </div>

        {/* RIGHT COLUMN: 2D Academic Network Diagram & Server Containers */}
        <div>
          <NetworkDiagram
            servers={servers}
            activeRoutingTasks={activeRoutingTasks}
            ppoActiveMessage={ppoMessage}
            targetServerId={targetServerId}
          />
        </div>
      </main>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--border-color)',
        padding: '12px 24px',
        textAlign: 'center',
        fontSize: '0.75rem',
        color: 'var(--text-dark)'
      }}>
        EdgeDRLSimulation — Academic Network Visualizer for DRL Task Scheduling
      </footer>
    </div>
  );
};

export default App;
