import React from 'react';
import styles from './ComponentStack.module.css';

export default function ComponentStack({ componentStack }) {
  return (
    <pre className={styles.Outer}>
      {componentStack}
    </pre>
  );
}