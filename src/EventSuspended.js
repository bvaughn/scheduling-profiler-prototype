import React, { Fragment } from 'react';
import { Popover } from 'antd';
import ComponentStack from './ComponentStack';
import styles from './EventSuspended.module.css';

export default function EventSuspended({
  componentStack = '',
  timestamp,
}) {
  return (
    <Popover
      content={
        <Fragment>
          <p>Component <strong>suspended</strong> at {timestamp}ms</p>
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
      ></div>
    </Popover>
  );
}
