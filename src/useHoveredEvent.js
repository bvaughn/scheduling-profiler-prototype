import React, { useEffect, useRef } from 'react';
import { positionToTimestamp } from './usePanAndZoom';

export default function useHoveredEvent({
  canvasHeight,
  canvasWidth,
  events,
  state
}) {
  const {
    canvasMouseX,
    canvasMouseY,
    offsetX,
    zoomLevel,
  } = state;

  let hoveredEvent = null;

  const lastResultRef = useRef({
    events,
    hoveredEvent,
  });

  useEffect(() => {
    lastResultRef.current = {
      events,
      hoveredEvent: hoveredEvent || null,
    };
  });

  if (events === null) {
    return null;
  }

  const timestampAtMouseX = positionToTimestamp(canvasMouseX, offsetX, zoomLevel);

  if (
    canvasMouseX >= 0 && canvasMouseX < canvasWidth &&
    canvasMouseY >= 0 && canvasMouseY < canvasHeight
  ) {
    // Small mouse movements won't change the hovered event,
    // So always start by checking the last hovered event to see if we can avoid doing more work.
    const lastEvents = lastResultRef.current.events;
    const lastHoveredEvent = lastResultRef.current.hoveredEvent;
    if (
      lastHoveredEvent !== null &&
      lastEvents === events &&
      timestampAtMouseX >= lastHoveredEvent.timestamp &&
      timestampAtMouseX <= lastHoveredEvent.timestamp + lastHoveredEvent.duration
    ) {
      hoveredEvent = lastHoveredEvent;
      return lastHoveredEvent;
    }

    // Since event data is sorted, we can use a binary search for faster comparison.
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
