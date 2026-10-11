import React, { useState } from 'react';
import type { EdgeTask } from '../types/simulation';
import { 
  BrainCircuit, 
  Server, 
  ShieldCheck, 
  Activity, 
  Clock, 
  ChevronDown, 
  ChevronRight,
  Cpu,
  Radio
} from 'lucide-react';

interface ExplainabilityLogProps {
  tasks: EdgeTask[];
}

export const ExplainabilityLog: React.FC<ExplainabilityLogProps> = ({ tasks }) => {
  // Find all tasks that have been assigned by PPO
  const scheduledTasks = tasks.filter((t) => t.assignedServerId && t.explanation);

  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);

  if (scheduledTasks.length === 0) return null;

  const toggleExpand = (id: string) => {
    setExpandedTaskId(expandedTaskId === id ? null : id);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return { bg: 'rgba(239, 68, 68, 0.15)', text: '#ef4444', border: 'rgba(239, 68, 68, 0.3)' };
      case 'MEDIUM':
        return { bg: 'rgba(59, 130, 246, 0.15)', text: '#3b82f6', border: 'rgba(59, 130, 246, 0.3)' };
      case 'LOW':
      default:
        return { bg: 'rgba(148, 163, 184, 0.15)', text: '#94a3b8', border: 'rgba(148, 163, 184, 0.3)' };
    }
  };

  return (
    <div className="panel" style={{ marginTop: '16px', borderRadius: '8px' }}>
      {/* Header */}
      <div className="panel-title" style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BrainCircuit size={18} color="var(--accent-blue)" />
          <span>PPO Decision Rationale Log</span>
        </div>
        <span style={{ 
          fontSize: '0.72rem', 
          color: 'var(--accent-blue)', 
          background: 'rgba(59, 130, 246, 0.1)',
          padding: '3px 8px',
          borderRadius: '12px',
          border: '1px solid rgba(59, 130, 246, 0.2)',
          fontWeight: 500
        }}>
          Maskable PPO Explainability Model
        </span>
      </div>

      {/* Task Decision Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {scheduledTasks.map((t) => {
          const isExpanded = expandedTaskId === t.id || scheduledTasks.length === 1;
          const exp = t.explanation!;
          const priorityStyle = getPriorityColor(t.priority);

          // Parse raw action or mask if coming from raw string formats
          const isRawMask = exp.queue.startsWith('Mask:');
          const maskDisplay = isRawMask 
            ? exp.queue.replace('Mask:', 'Action Mask Status:') 
            : exp.queue;

          const isRawDelay = exp.delay.startsWith('Action ');
          const delayDisplay = isRawDelay
            ? `Selected Policy ${exp.delay} → Server ${t.assignedServerId}`
            : exp.delay;

          return (
            <div
              key={t.id}
              style={{
                background: 'var(--bg-subpanel)',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                overflow: 'hidden',
                transition: 'all 0.2s ease-in-out'
              }}
            >
              {/* Header clickable bar */}
              <div
                onClick={() => toggleExpand(t.id)}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 14px',
                  cursor: 'pointer',
                  background: isExpanded ? 'rgba(30, 41, 59, 0.6)' : 'transparent',
                  userSelect: 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ 
                    fontFamily: 'var(--font-mono)', 
                    fontWeight: 700, 
                    color: 'var(--text-main)', 
                    fontSize: '0.9rem' 
                  }}>
                    {t.id}
                  </span>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>assigned to</span>
                    <span style={{ 
                      fontSize: '0.8rem', 
                      fontWeight: 600, 
                      color: 'var(--accent-blue)',
                      background: 'rgba(59, 130, 246, 0.12)',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <Server size={12} /> Server {t.assignedServerId}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {/* Priority Tag */}
                  <span style={{
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    color: priorityStyle.text,
                    background: priorityStyle.bg,
                    border: `1px solid ${priorityStyle.border}`,
                    padding: '2px 6px',
                    borderRadius: '4px'
                  }}>
                    {t.priority}
                  </span>

                  {/* Deadline Tag */}
                  <span style={{
                    fontSize: '0.72rem',
                    color: 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <Clock size={12} /> {t.deadline}ms
                  </span>

                  <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                    {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </span>
                </div>
              </div>

              {/* Expanded Rationale Content */}
              {isExpanded && (
                <div style={{ 
                  padding: '12px 14px', 
                  borderTop: '1px solid var(--border-color)', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '12px',
                  background: 'rgba(15, 23, 42, 0.4)'
                }}>
                  {/* 4 Metric Cards Grid */}
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
                    gap: '10px' 
                  }}>
                    {/* 1. Action & Routing */}
                    <div style={{
                      background: 'var(--bg-panel)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '6px',
                      padding: '8px 10px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent-blue)', marginBottom: '4px' }}>
                        <Radio size={13} /> Action & Network Routing
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-main)' }}>
                        {delayDisplay}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        Policy index selected by PPO actor network.
                      </div>
                    </div>

                    {/* 2. Action Masking Status */}
                    <div style={{
                      background: 'var(--bg-panel)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '6px',
                      padding: '8px 10px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent-green)', marginBottom: '4px' }}>
                        <ShieldCheck size={13} /> Server Feasibility Mask
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-main)', wordBreak: 'break-word' }}>
                        {maskDisplay}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        Prevents scheduling to overloaded/invalid nodes.
                      </div>
                    </div>

                    {/* 3. Reward Evaluation */}
                    <div style={{
                      background: 'var(--bg-panel)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '6px',
                      padding: '8px 10px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent-amber)', marginBottom: '4px' }}>
                        <Activity size={13} /> Policy Reward Output
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-main)', fontWeight: 600 }}>
                        {exp.cpu}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        Step reward evaluating CPU balance & delay penalty.
                      </div>
                    </div>

                    {/* 4. SLA & Workload Constraints */}
                    <div style={{
                      background: 'var(--bg-panel)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '6px',
                      padding: '8px 10px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px' }}>
                        <Cpu size={13} /> Workload SLA Parameters
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-main)' }}>
                        {t.cpuRequirement} Cores • {t.dataSize}MB Data • {t.executionTime}ms Exec
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        Priority: {t.priority} | Deadline: {t.deadline}ms
                      </div>
                    </div>
                  </div>

                  {/* Summary Box */}
                  <div style={{
                    background: 'rgba(59, 130, 246, 0.08)',
                    borderLeft: '3px solid var(--accent-blue)',
                    padding: '8px 12px',
                    borderRadius: '0 4px 4px 0',
                    fontSize: '0.78rem',
                    color: 'var(--text-main)'
                  }}>
                    <strong style={{ color: 'var(--accent-blue)', marginRight: '6px' }}>AI Decision Explanation:</strong>
                    <span>"{exp.summary}"</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
