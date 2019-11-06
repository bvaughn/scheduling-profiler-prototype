import React, { Fragment, useContext } from 'react';
import { Popover } from 'antd';
import { PriorityContext } from './contexts';
import styles from './Work.module.css';

export default function Work({
  children = null,
  didDeopt = false,
  didResume = false,
  didYield = false,
  startTime,
  stopTime,
  showYieldStyle = false,
}) {
  const priorityLabel = useContext(PriorityContext);

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
          left: `calc(${startTime}px * var(--multiplier))`,
          width: `calc(${stopTime - startTime}px * var(--multiplier))`
        }}
        className={[
          styles.Work,
          didDeopt && styles.DidDeopt,
          didResume && styles.DidResume,
          didYield && styles.DidYield,
          didYield && showYieldStyle && styles.YieldStyle,
        ].join(' ')}
      >
        {children}
      </div>
    </Popover>
  );
}
