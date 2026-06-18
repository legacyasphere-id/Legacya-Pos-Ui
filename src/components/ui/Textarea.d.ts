import React from 'react';

export interface TextareaProps extends React.ComponentPropsWithoutRef<'textarea'> {
  label?: string;
  hint?: string;
  rows?: number;
}

export declare const Textarea: React.FC<TextareaProps>;
