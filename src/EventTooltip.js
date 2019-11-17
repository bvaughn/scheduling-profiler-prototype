import React from 'react';
import styles from './EventTooltip.module.css';
import { TOOLTIP_OFFSET } from './constants';

export default function EventTooltip({ hoveredEvent, state }) {
  if (hoveredEvent == null) {
    return null;
  }

  const { canvasMouseY, canvasMouseX } = state;
  const { duration, timestamp, type } = hoveredEvent;

  let label = null;
  switch (type) {
    case 'commit-work':
      label = 'commit';
      break;
    case 'non-react-function-call':
      label = 'other script';
      break;
    case 'render-idle':
      label = 'idle';
      break;
    case 'render-work':
      label = 'render';
      break;
    case 'schedule-render':
      label = 'render scheduled';
      break;
    case 'schedule-state-update':
      label = 'state update scheduled';
      break;
    default:
      break;
  }

  return (
    <div
      className={styles.Tooltip}
      style={{
        position: 'absolute',
        top: canvasMouseY + TOOLTIP_OFFSET,
        left: canvasMouseX + TOOLTIP_OFFSET,
      }}
    >
      {duration}ms {label !== null ? `(${label})` : ''}
    </div>
  );
}