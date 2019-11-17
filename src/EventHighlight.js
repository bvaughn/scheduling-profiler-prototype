import React from 'react';
import { timestampToPosition } from './usePanAndZoom';
import { BAR_HORIZONTAL_SPACING } from './constants';
import styles from './EventHighlight.module.css';

export default function EventHighlight({ height, hoveredEvent, state, y }) {
  if (hoveredEvent == null) {
    return null;
  }

  const { offsetX, zoomLevel } = state;
  const { duration, timestamp } = hoveredEvent;

  let width = Math.max(duration * zoomLevel - BAR_HORIZONTAL_SPACING, 0);

  if (width <= 0) {
    return null;
  }

  return (
    <div
      className={styles.Highlight}
      style={{
        position: 'absolute',
        top: y - 1,
        left: Math.floor(timestampToPosition(timestamp, offsetX, zoomLevel)) - 1,
        width: Math.floor(width) + 2,
        height: height + 2,
      }}
    />
  );
}