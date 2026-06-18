import React from 'react';

export interface SwitchProps {
  checked: boolean;
  onChange: (value: boolean) => void;
  size?: 'sm' | 'md';
}

export declare const Switch: React.FC<SwitchProps>;
