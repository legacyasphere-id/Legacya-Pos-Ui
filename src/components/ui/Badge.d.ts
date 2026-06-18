import React from 'react';

export interface BadgeProps {
  tone?: 'neutral' | 'primary' | 'success' | 'warning' | 'danger';
  children?: React.ReactNode;
  dot?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export declare const Badge: React.FC<BadgeProps>;
