import React, { Fragment } from 'react';
import { Popover } from 'antd';
import styles from './RenderWork.module.css';

export default function RenderWork({
  didResume,
  didYield,
  priorityLabel,
  startTime,
  stopTime,
}) {
  /*
  return (
    <Popover
      content={
        <Fragment>
          <p><strong>{priorityLabel}</strong> priority work</p>
          <ul>
            <li>{didResume ? 'Resumed' : 'Started'} at {startTime}ms</li>
            <li>{didYield ? 'Yielded' : 'Finished'} after {stopTime - startTime}ms</li>
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
        className={[
          styles.RenderWork,
          didResume && styles.DidResume,
          didYield && styles.DidYield,
        ].join(' ')}
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
      className={[
        styles.RenderWork,
        didResume && styles.DidResume,
        didYield && styles.DidYield,
      ].join(' ')}
    />
  );
}
