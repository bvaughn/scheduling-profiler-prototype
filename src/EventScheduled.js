import React, { Fragment, useContext } from 'react';
import { Popover } from 'antd';
import ComponentStack from './ComponentStack';
import styles from './EventScheduled.module.css';

export default function EventScheduled({
  componentStack = '',
  label,
  timestamp
}) {
  /*
  return (
    <Popover
      content={
        <Fragment>
          <p>Scheduled <strong>{label}</strong> at {timestamp}ms</p>
          {componentStack && <ComponentStack componentStack={componentStack.trim()} />}
        </Fragment>
      }
      trigger="hover"
    >
      <div
        className={styles.Outer}
        style={{
          left: `calc(${timestamp}px * var(--scale) - var(--x-offset))`,
        }}
      >
        <div className={styles.Inner}></div>
      </div>
    </Popover>
  );
  */
  return (
    <div
      className={styles.Outer}
      style={{
        left: `calc(${timestamp}px * var(--scale) - var(--x-offset))`,
      }}
    >
      <div className={styles.Inner}></div>
    </div>
  );
}
