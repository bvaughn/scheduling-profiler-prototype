import React from 'react';
import styles from './EventTooltip.module.css';
import { TOOLTIP_OFFSET } from './constants';

export default function EventTooltip({ hoveredEvent, state }) {
  if (hoveredEvent == null) {
    return null;
  }

  const { canvasMouseY, canvasMouseX } = state;
  const { duration, timestamp, type } = hoveredEvent;

  return (
    <div
      className={styles.Tooltip}
      style={{
        position: 'absolute',
        top: canvasMouseY + TOOLTIP_OFFSET,
        left: canvasMouseX + TOOLTIP_OFFSET,
      }}
    >
      {type.replace('-work', '')} at {timestamp}ms - {timestamp + duration}ms
    </div>
  );
}