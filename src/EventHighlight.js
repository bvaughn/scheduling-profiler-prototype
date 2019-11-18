import React from 'react';
import { timestampToPosition } from './usePanAndZoom';
import { BAR_HORIZONTAL_SPACING, EVENT_SIZE } from './constants';
import styles from './EventHighlight.module.css';

export default function EventHighlight({ height, hoveredEvent, state, y }) {
  if (hoveredEvent == null) {
    return null;
  }

  const { offsetX, zoomLevel } = state;
  const { duration, timestamp } = hoveredEvent;

  if (duration === undefined) {
    return (
      <div
        className={styles.Highlight}
        style={{
          position: 'absolute',
          top: y,
          left: Math.floor(timestampToPosition(timestamp, offsetX, zoomLevel)) - EVENT_SIZE / 2,
          width: `${EVENT_SIZE}px`,
          height: `${EVENT_SIZE}px`,
          borderRadius: '50%',
        }}
      />
    );
  } else {
    let width = Math.max(duration * zoomLevel - BAR_HORIZONTAL_SPACING, 0);
    if (width <= 0) {
      return null;
    }

    return (
      <div
        className={styles.Highlight}
        style={{
          position: 'absolute',
          top: y,
          left: Math.floor(timestampToPosition(timestamp, offsetX, zoomLevel)),
          width: Math.floor(width),
          height: height,
        }}
      />
    );
  }
}