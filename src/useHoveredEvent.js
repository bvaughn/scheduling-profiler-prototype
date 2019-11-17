import React, { useEffect, useRef } from 'react';
import { positionToTimestamp } from './usePanAndZoom';

export default function useHoveredEvent({ canvasHeight, canvasWidth, events, state }) {
  const {
    canvasMouseX,
    canvasMouseY,
    offsetX,
    zoomLevel,
  } = state;

  const lastHoveredEventRef = useRef(null);

  const timestampAtMouseX = positionToTimestamp(canvasMouseX, offsetX, zoomLevel);

  const isReactEvent = canvasMouseY < canvasHeight / 2;

  let hoveredEvent = null;

  useEffect(() => {
    lastHoveredEventRef.current = hoveredEvent || null;
  });

  if (
    canvasMouseX >= 0 && canvasMouseX < canvasWidth &&
    canvasMouseY >= 0 && canvasMouseY < canvasHeight
  ) {
    // Small mouse movements won't change the hovered event,
    // So always start by checking the last hovered event to see if we can avoid doing more work.
    const lastHoveredEvent = lastHoveredEventRef.current;
    if (
      lastHoveredEvent !== null &&
      timestampAtMouseX >= lastHoveredEvent.timestamp &&
      timestampAtMouseX <= lastHoveredEvent.timestamp + lastHoveredEvent.duration
    ) {
      hoveredEvent = lastHoveredEvent;
      return lastHoveredEvent;
    }

    // Since event data is sorted, we can use a binary search for faster comparison.
    // TODO We need to pre-separate event streams (React and non-React) for this to work :(
    let indexLow = 0;
    let indexHigh = events.length - 1;
    let index = Math.round(indexHigh / 2);
    while (index < indexHigh && index > indexLow && hoveredEvent === null) {
      const event = events[index];
      const {
        duration,
        timestamp: startTime
      } = event;

      const stopTime = startTime + duration;

      // TODO This won't find small things (like state-updates)
      const match = timestampAtMouseX >= startTime && timestampAtMouseX <= stopTime;

      if (match) {
        hoveredEvent = event;
      } else if (timestampAtMouseX < startTime) {
        indexHigh = index;
        index = indexLow + Math.round((indexHigh - indexLow) / 2);
      } else {
        indexLow = index;
        index = indexLow + Math.round((indexHigh - indexLow) / 2);
      }
    }
  }

  return hoveredEvent;
}
