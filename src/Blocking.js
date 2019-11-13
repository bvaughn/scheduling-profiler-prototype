import React from 'react';
import styles from './Blocking.module.css';

export default function Blocking({
  children = null,
  startTime,
  stopTime,
}) {
  return (
    <div
      style={{
        left: `calc(${startTime}px * var(--scale))`,
        width: `calc(${stopTime - startTime}px * var(--scale))`
      }}
      className={styles.Blocking}
    >
      {children}
    </div>
  );
}
