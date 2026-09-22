import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color?: 'green' | 'blue' | 'purple' | 'amber' | 'rose';
  helpText?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon,
  color = 'green',
  helpText
}) => {
  return (
    <div className="stat-card">
      <div className={`stat-icon-wrapper ${color}`}>
        {icon}
      </div>
      <div className="stat-info">
        <span className="stat-label">{label}</span>
        <span className="stat-value">{value}</span>
        {helpText && <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>{helpText}</span>}
      </div>
    </div>
  );
};
