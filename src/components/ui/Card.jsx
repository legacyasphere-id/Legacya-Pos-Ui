import React from 'react';
import { tokens } from '../../data/tokens';

export const Card = ({ children, className = '', as: As = 'div', ...rest }) => (
  <As
    {...rest}
    className={`bg-card border border-line rounded-2xl ${className}`}
    style={{ boxShadow: tokens.shadow.sm }}
  >
    {children}
  </As>
);
