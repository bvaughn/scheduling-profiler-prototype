import React, { Fragment } from 'react';
import { Popover } from 'antd';
import ComponentStack from './ComponentStack';
import styles from './EventScheduled.module.css';

export default function EventScheduled({
  componentStack,
  timestamp,
}) {
  return (
    <Popover
      content={
        <Fragment>
          <p>Component <strong>updated state</strong> at {timestamp}ms</p>
          <ComponentStack componentStack={componentStack} />
        </Fragment>
      }
      trigger="hover"
    >
      <div
        className={styles.Outer}
        style={{
          left: `calc(${timestamp}px * var(--multiplier))`,
        }}
      >
        <div className={styles.Inner}></div>
      </div>
    </Popover>
  );
}
