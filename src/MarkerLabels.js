import React from 'react';
import styles from './MarkerLabels.module.css';

export default function MarkerLabels({ duration }) {
  const style = getComputedStyle(document.body);
  const framerate = parseFloat(style.getPropertyValue('--framerate'));
  
  const labels = [];
  for (let i = 0; i < 20; i++) {
    labels.push(
      <div key={i} className={styles.Label}>
        {Math.round(i * framerate)}ms
      </div>
    )
  }

  return (
    <div className={styles.Labels}>
      {labels}
    </div>
  );
}