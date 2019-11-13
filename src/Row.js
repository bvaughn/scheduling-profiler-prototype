import React from 'react';
import styles from './Row.module.css';

export default function Row({ children, className }) {
  return (
    <div className={`${styles.Row} ${className || ''}`}>
      {children}
    </div>
  )
}