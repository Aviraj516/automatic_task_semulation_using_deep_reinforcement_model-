import React, { useState } from 'react';
import type { EdgeTask, TaskPriority } from '../types/simulation';

interface TaskFormProps {
  tasks: EdgeTask[];
  onAddTask: (task: EdgeTask) => void;
  onStartSimulation: () => void;
  onClearQueue: () => void;
  isSimulating: boolean;
}

export const TaskForm: React.FC<TaskFormProps> = ({
  tasks,
  onAddTask,
  onStartSimulation,
  onClearQueue,
  isSimulating,
}) => {
  const [taskCounter, setTaskCounter] = useState<number>(tasks.length + 1);
  const [taskId, setTaskId] = useState<string>(`T-00${taskCounter}`);
  const [cpuReq, setCpuReq] = useState<number>(3);
  const [dataSize, setDataSize] = useState<number>(15);
  const [priority, setPriority] = useState<TaskPriority>('HIGH');
  const [executionTime, setExecutionTime] = useState<number>(200);
  const [deadline, setDeadline] = useState<number>(500);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSimulating) return;

    onAddTask({
      id: taskId,
      cpuRequirement: cpuReq,
      dataSize,
      priority,
      deadline,
      executionTime,
      status: 'WAITING',
    });

    const nextCount = taskCounter + 1;
    setTaskCounter(nextCount);
    setTaskId(`T-0${nextCount < 10 ? '0' + nextCount : nextCount}`);
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'WAITING': return 'status-waiting';
      case 'ROUTING_ROUTER':
      case 'ROUTING_SWITCH': return 'status-routing';
      case 'SCHEDULING': return 'status-scheduling';
      case 'PROCESSING': return 'status-processing';
      case 'COMPLETED': return 'status-completed';
      default: return 'status-waiting';
    }
  };

  const getStatusLabel = (task: EdgeTask) => {
    if (task.status === 'PROCESSING' && task.assignedServerId) {
      return `Processing on S${task.assignedServerId}`;
    }
    if (task.status === 'SCHEDULING') return 'PPO Scheduling';
    if (task.status === 'ROUTING_ROUTER') return 'Routing (Router)';
    if (task.status === 'ROUTING_SWITCH') return 'Routing (Switch)';
    return task.status;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Task Creation Input Panel */}
      <div className="panel">
        <div className="panel-title">
          <span>Create Task</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Input Parameters</span>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>
                Task ID
              </label>
              <input
                type="text"
                value={taskId}
                onChange={(e) => setTaskId(e.target.value)}
                disabled={isSimulating}
                required
                className="font-mono"
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                disabled={isSimulating}
                style={{ width: '100%' }}
              >
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>
                CPU (cores)
              </label>
              <input
                type="number"
                min="1"
                max="12"
                step="0.5"
                value={cpuReq}
                onChange={(e) => setCpuReq(parseFloat(e.target.value) || 1)}
                disabled={isSimulating}
                className="font-mono"
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>
                Size (MB)
              </label>
              <input
                type="number"
                min="1"
                max="200"
                value={dataSize}
                onChange={(e) => setDataSize(parseInt(e.target.value) || 1)}
                disabled={isSimulating}
                className="font-mono"
                style={{ width: '100%' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>
                Execution Time (ms)
              </label>
              <input
                type="number"
                min="50"
                max="1000"
                step="10"
                value={executionTime}
                onChange={(e) => setExecutionTime(parseInt(e.target.value) || 50)}
                disabled={isSimulating}
                className="font-mono"
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>
                Deadline / SLA (ms)
              </label>
              <input
                type="number"
                min="10"
                max="3000"
                step="10"
                value={deadline}
                onChange={(e) => setDeadline(parseInt(e.target.value) || 10)}
                disabled={isSimulating}
                className="font-mono"
                style={{ width: '100%' }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSimulating}
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '4px', justifyContent: 'center' }}
          >
            + Add Task
          </button>
        </form>
      </div>

      {/* Task Queue Panel */}
      <div className="panel">
        <div className="panel-title">
          <span>Task Queue ({tasks.length})</span>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={onClearQueue}
              disabled={isSimulating || tasks.length === 0}
              className="btn"
              style={{ fontSize: '0.72rem', padding: '2px 8px' }}
            >
              Clear
            </button>
          </div>
        </div>

        {tasks.length === 0 ? (
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '16px 0' }}>
            No tasks queued. Add tasks above to simulate.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '240px', overflowY: 'auto' }}>
            {tasks.map((t) => (
              <div
                key={t.id}
                style={{
                  background: 'var(--bg-subpanel)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '4px',
                  padding: '8px 10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '0.8rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span className="font-mono" style={{ fontWeight: 600, color: 'var(--accent-blue)' }}>
                    {t.id}
                  </span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                    CPU {t.cpuRequirement} cores | {t.executionTime}ms | {t.priority}
                  </span>
                </div>

                <span className={`status-badge ${getStatusBadgeClass(t.status)}`}>
                  {getStatusLabel(t)}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Start Simulation Button */}
        <button
          onClick={onStartSimulation}
          disabled={isSimulating || tasks.length === 0}
          className="btn btn-success"
          style={{ width: '100%', marginTop: '14px', justifyContent: 'center', padding: '10px', fontSize: '0.88rem' }}
        >
          {isSimulating ? 'Simulation Running...' : 'Start Simulation'}
        </button>
      </div>
    </div>
  );
};
