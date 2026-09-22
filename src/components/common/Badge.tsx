import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'sena' | 'blue' | 'purple' | 'amber' | 'rose' | 'gray';
  icon?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'sena',
  icon,
  className = '',
  style
}) => {
  return (
    <span className={`badge badge-${variant} ${className}`} style={style}>
      {icon && <span style={{ display: 'inline-flex', alignItems: 'center' }}>{icon}</span>}
      {children}
    </span>
  );
};
