import React from 'react';

export interface InputProps extends React.ComponentPropsWithoutRef<'input'> {
  label?: string;
  hint?: string;
  prefix?: string;
  suffix?: string;
}

export declare const Input: React.FC<InputProps>;
