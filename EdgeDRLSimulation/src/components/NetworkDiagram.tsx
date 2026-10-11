import React from 'react';
import type { EdgeServer, EdgeTask } from '../types/simulation';
import { ServerBox } from './ServerBox';

interface NetworkDiagramProps {
  servers: EdgeServer[];
  activeRoutingTasks: EdgeTask[];
  ppoActiveMessage: string | null;
  targetServerId: number | null;
}

export const NetworkDiagram: React.FC<NetworkDiagramProps> = ({
  servers,
  activeRoutingTasks,
  ppoActiveMessage,
  targetServerId,
}) => {
  // Helper to map task routing status to visual vertical position
  const getTaskPositionStyle = (task: EdgeTask): React.CSSProperties => {
    if (task.status === 'ROUTING_ROUTER') {
      return { top: '80px', left: '50%', transform: 'translateX(-50%)' };
    }
    if (task.status === 'ROUTING_SWITCH') {
      return { top: '150px', left: '50%', transform: 'translateX(-50%)' };
    }
    if (task.status === 'SCHEDULING') {
      return { top: '220px', left: '50%', transform: 'translateX(-50%)' };
    }
    // Moving towards target server (S1..S4)
    if (task.assignedServerId) {
      const positions = ['14%', '38%', '62%', '86%'];
      const targetPos = positions[task.assignedServerId - 1] || '50%';
      return { top: '300px', left: targetPos, transform: 'translateX(-50%)' };
    }
    return { top: '20px', left: '50%', transform: 'translateX(-50%)' };
  };

  return (
    <div className="panel" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="panel-title">
        <span>Network Simulation Diagram</span>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Simple Academic 2D Topology</span>
      </div>

      {/* Network Canvas */}
      <div style={{
        flex: 1,
        position: 'relative',
        background: 'var(--bg-subpanel)',
        border: '1px solid var(--border-color)',
        borderRadius: '4px',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        minHeight: '480px'
      }}>
        {/* Render Moving Task Badges */}
        {activeRoutingTasks.map((t) => (
          <div
            key={t.id}
            className="packet-animating font-mono"
            style={{
              position: 'absolute',
              zIndex: 30,
              background: 'var(--accent-blue)',
              color: '#ffffff',
              padding: '3px 8px',
              borderRadius: '4px',
              fontSize: '0.75rem',
              fontWeight: 700,
              border: '1px solid #ffffff',
              boxShadow: '0 2px 6px rgba(0,0,0,0.5)',
              transition: 'all 0.5s ease-in-out',
              ...getTaskPositionStyle(t),
            }}
          >
            {t.id}
          </div>
        ))}

        {/* NODE 1: User / Tasks */}
        <div style={{
          background: 'var(--bg-panel)',
          border: '1px solid var(--border-color)',
          borderRadius: '4px',
          padding: '6px 16px',
          fontSize: '0.82rem',
          fontWeight: 600,
          color: 'var(--text-main)',
          zIndex: 5
        }}>
          User / Tasks Queue
        </div>

        {/* Line 1 */}
        <div style={{ height: '30px', width: '2px', background: 'var(--border-color)', margin: '2px 0' }} />

        {/* NODE 2: Router */}
        <div style={{
          background: 'var(--bg-panel)',
          border: '1px solid var(--border-color)',
          borderRadius: '4px',
          padding: '6px 20px',
          fontSize: '0.82rem',
          fontWeight: 600,
          color: 'var(--text-main)',
          zIndex: 5
        }}>
          Router
        </div>

        {/* Line 2 */}
        <div style={{ height: '30px', width: '2px', background: 'var(--border-color)', margin: '2px 0' }} />

        {/* NODE 3: Switch */}
        <div style={{
          background: 'var(--bg-panel)',
          border: '1px solid var(--border-color)',
          borderRadius: '4px',
          padding: '6px 20px',
          fontSize: '0.82rem',
          fontWeight: 600,
          color: 'var(--text-main)',
          zIndex: 5
        }}>
          Switch
        </div>

        {/* Line 3 */}
        <div style={{ height: '24px', width: '2px', background: 'var(--border-color)', margin: '2px 0' }} />

        {/* NODE 4: PPO Scheduler */}
        <div style={{
          background: ppoActiveMessage ? 'rgba(59, 130, 246, 0.2)' : 'var(--bg-panel)',
          border: ppoActiveMessage ? '1px solid var(--accent-blue)' : '1px solid var(--border-color)',
          borderRadius: '4px',
          padding: '6px 16px',
          fontSize: '0.82rem',
          fontWeight: 600,
          color: ppoActiveMessage ? 'var(--accent-blue)' : 'var(--text-main)',
          zIndex: 5,
          transition: 'all 0.2s ease',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span>PPO Scheduler</span>
          {ppoActiveMessage && (
            <span className="font-mono" style={{ fontSize: '0.72rem', color: 'var(--accent-green)' }}>
              ({ppoActiveMessage})
            </span>
          )}
        </div>

        {/* SVG Connector Lines to 4 Servers */}
        <svg style={{ width: '100%', height: '40px', margin: '4px 0', overflow: 'visible', zIndex: 1 }}>
          <line x1="50%" y1="0" x2="14%" y2="40" stroke="var(--border-color)" strokeWidth="2" strokeDasharray="3 3" />
          <line x1="50%" y1="0" x2="38%" y2="40" stroke="var(--border-color)" strokeWidth="2" strokeDasharray="3 3" />
          <line x1="50%" y1="0" x2="62%" y2="40" stroke="var(--border-color)" strokeWidth="2" strokeDasharray="3 3" />
          <line x1="50%" y1="0" x2="86%" y2="40" stroke="var(--border-color)" strokeWidth="2" strokeDasharray="3 3" />

          {targetServerId && (
            <line
              x1="50%"
              y1="0"
              x2={['14%', '38%', '62%', '86%'][targetServerId - 1]}
              y2="40"
              stroke="var(--accent-blue)"
              strokeWidth="3"
            />
          )}
        </svg>

        {/* 4 Edge Server Boxes Grid */}
        <div style={{
          width: '100%',
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '10px',
          marginTop: 'auto',
          zIndex: 5
        }}>
          {servers.map((server) => (
            <ServerBox
              key={server.id}
              server={server}
              isTargeted={targetServerId === server.id}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
