import React from 'react';
import styles from './RenderIdle.module.css';

export default function RenderIdle({
  startTime,
  stopTime,
}) {
  return (
    <div
      style={{
        left: `calc(${startTime}px * var(--scale) - var(--x-offset))`,
        width: `calc(${stopTime - startTime}px * var(--scale))`
      }}
      className={styles.RenderIdle}
    />
  );
}
