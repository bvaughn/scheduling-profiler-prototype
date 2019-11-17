import React from 'react';
import { timestampToPosition } from './usePanAndZoom';
import { BAR_X_GUTTER } from './constants';
import styles from './EventHighlight.module.css';

export default function EventHighlight({ canvasHeight, hoveredEvent, state }) {
  if (hoveredEvent == null) {
    return null;
  }

  const { offsetX, zoomLevel } = state;
  const { duration, timestamp, type } = hoveredEvent;

  let width = Math.max(duration * zoomLevel - BAR_X_GUTTER, 0);

  if (width <= 0) {
    return null;
  }

  const isReactEvent = type !== 'non-react-function-call';

  return (
    <div
      className={styles.Highlight}
      style={{
        position: 'absolute',
        top: Math.floor(isReactEvent ? 0.2 * canvasHeight : 0.6 * canvasHeight) - 1,
        left: Math.floor(timestampToPosition(timestamp, offsetX, zoomLevel)) - 1,
        width: Math.floor(width) + 2,
        height: Math.floor(0.2 * canvasHeight) + 2,
      }}
    />
  );
}