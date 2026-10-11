import React from 'react';
import type { EdgeServer } from '../types/simulation';

interface ServerBoxProps {
  server: EdgeServer;
  isTargeted: boolean;
}

export const ServerBox: React.FC<ServerBoxProps> = ({ server, isTargeted }) => {
  return (
    <div
      style={{
        background: 'var(--bg-panel)',
        border: isTargeted ? '2px solid var(--accent-blue)' : '1px solid var(--border-color)',
        borderRadius: '6px',
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        minHeight: '230px',
        position: 'relative',
        transition: 'border-color 0.2s ease'
      }}
    >
      {/* Top Banner: Name & Status */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px' }}>
        <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-main)' }}>
          {server.name.toUpperCase()}
        </span>
        <span
          style={{
            fontSize: '0.68rem',
            fontWeight: 700,
            padding: '1px 6px',
            borderRadius: '2px',
            background: server.status === 'AVAILABLE' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            color: server.status === 'AVAILABLE' ? 'var(--accent-green)' : 'var(--accent-red)',
            border: `1px solid ${server.status === 'AVAILABLE' ? 'var(--accent-green)' : 'var(--accent-red)'}`
          }}
        >
          {server.status}
        </span>
      </div>

      {/* Target Indicator Highlight */}
      {isTargeted && (
        <div style={{
          fontSize: '0.65rem',
          color: 'var(--accent-blue)',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}>
          ← PPO Target
        </div>
      )}

      {/* Inside Tasks Container */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {/* PROCESSING SECTION */}
        <div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-dark)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>
            Processing ({server.processingTasks.length})
          </div>

          {server.processingTasks.length === 0 ? (
            <div style={{ fontSize: '0.72rem', color: 'var(--text-dark)', fontStyle: 'italic', padding: '4px 6px', background: 'var(--bg-subpanel)', borderRadius: '3px' }}>
              None
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {server.processingTasks.map((t) => (
                <div
                  key={t.id}
                  style={{
                    background: 'rgba(37, 99, 235, 0.15)',
                    border: '1px solid rgba(59, 130, 246, 0.4)',
                    borderRadius: '4px',
                    padding: '5px 8px',
                    fontSize: '0.75rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="font-mono" style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                      {t.id}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      CPU: {t.cpuRequirement} cores
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div style={{ width: '100%', height: '3px', background: 'var(--bg-subpanel)', borderRadius: '2px', marginTop: '4px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${t.progress || 0}%`,
                        height: '100%',
                        background: 'var(--accent-green)',
                        transition: 'width 0.2s linear'
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* WAITING SECTION */}
        <div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-dark)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>
            Waiting Queue ({server.waitingTasks.length})
          </div>

          {server.waitingTasks.length === 0 ? (
            <div style={{ fontSize: '0.72rem', color: 'var(--text-dark)', fontStyle: 'italic', padding: '4px 6px', background: 'var(--bg-subpanel)', borderRadius: '3px' }}>
              Empty
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {server.waitingTasks.map((t) => (
                <div
                  key={t.id}
                  style={{
                    background: 'var(--bg-subpanel)',
                    border: '1px dashed var(--border-color)',
                    borderRadius: '3px',
                    padding: '4px 6px',
                    fontSize: '0.72rem',
                    color: 'var(--text-muted)'
                  }}
                >
                  <span className="font-mono">{t.id}</span> (Queued)
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Summary Bar */}
      <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '6px', fontSize: '0.74rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
        <span>CPU: <strong className="font-mono" style={{ color: 'var(--text-main)' }}>{server.currentCpu}%</strong></span>
        <span>Queue: <strong className="font-mono" style={{ color: 'var(--text-main)' }}>{server.queueCount + server.waitingTasks.length}</strong></span>
      </div>
    </div>
  );
};
