import React from 'react';
import { PriorityContext } from './contexts';
import styles from './Thread.module.css';

export default function Thread({
  children = null,
  priorityLabel,
}) {
  return (
    <div className={styles.Thread}>
      <label className={styles.LabelGroup}>
        <div className={styles.Priority}>{priorityLabel}</div>
      </label>
      <div className={styles.Markers}>
        <div className={styles.Container}>
          <PriorityContext.Provider value={priorityLabel}>
            {children}
          </PriorityContext.Provider>
        </div>
      </div>
    </div>
  );
}
