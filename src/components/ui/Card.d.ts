import React from 'react';

export interface CardProps {
  children?: React.ReactNode;
  className?: string;
  as?: React.ElementType;
}

export declare const Card: React.FC<CardProps>;
