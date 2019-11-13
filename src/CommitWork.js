import React, { Fragment } from 'react';
import { Popover } from 'antd';
import styles from './CommitWork.module.css';

export default function CommitWork({
  priorityLabel,
  startTime,
  stopTime,
}) {
  /*
  return (
    <Popover
      content={
        <Fragment>
          <p><strong>{priorityLabel}</strong> priority commit</p>
          <ul>
            <li>Started at {startTime}ms</li>
            <li>Finished after {stopTime - startTime}ms</li>
          </ul>
        </Fragment>
      }
      trigger="hover"
    >
      <div
        style={{
          left: `calc(${startTime}px * var(--scale) - var(--x-offset))`,
          width: `calc(${stopTime - startTime}px * var(--scale))`
        }}
        className={styles.CommitWork}
      />
    </Popover>
  );
  */
  return (
    <div
      style={{
        left: `calc(${startTime}px * var(--scale) - var(--x-offset))`,
        width: `calc(${stopTime - startTime}px * var(--scale))`
      }}
      className={styles.CommitWork}
    />
  );
}
