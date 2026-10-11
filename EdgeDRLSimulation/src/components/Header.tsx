import React from 'react';

export const Header: React.FC = () => {
  return (
    <header style={{
      background: 'var(--bg-panel)',
      borderBottom: '1px solid var(--border-color)',
      padding: '12px 24px',
      marginBottom: '20px'
    }}>
      <div style={{ maxWidth: '1440px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)', letterSpacing: '-0.01em' }}>
          Intelligent Edge Task Scheduling
        </h1>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
          Deep Reinforcement Learning Simulation — Multi-Task Edge Network Scheduler
        </p>
      </div>
    </header>
  );
};
