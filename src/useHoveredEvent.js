import React, { useEffect, useRef } from 'react';
import { positionToTimestamp } from './usePanAndZoom';

export default function useHoveredEvent({
  canvasHeight,
  canvasWidth,
  eventQueue,
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
    eventQueue,
    hoveredEvent,
  });

  useEffect(() => {
    lastResultRef.current = {
      eventQueue,
      hoveredEvent: hoveredEvent || null,
    };
  });

  if (eventQueue === null) {
    return null;
  }

  const timestampAtMouseX = positionToTimestamp(canvasMouseX, offsetX, zoomLevel);

  if (
    canvasMouseX >= 0 && canvasMouseX < canvasWidth &&
    canvasMouseY >= 0 && canvasMouseY < canvasHeight
  ) {
    // Small mouse movements won't change the hovered event,
    // So always start by checking the last hovered event to see if we can avoid doing more work.
    const lastEvents = lastResultRef.current.eventQueue;
    const lastHoveredEvent = lastResultRef.current.hoveredEvent;
    if (
      lastHoveredEvent !== null &&
      lastEvents === eventQueue &&
      timestampAtMouseX >= lastHoveredEvent.timestamp &&
      timestampAtMouseX <= lastHoveredEvent.timestamp + lastHoveredEvent.duration
    ) {
      hoveredEvent = lastHoveredEvent;
      return lastHoveredEvent;
    }

    // Since event data is sorted, we can use a binary search for faster comparison.

    let start = 0;
    let end = eventQueue.length - 1;
    while (start <= end) {
      const middle = Math.floor((start + end) / 2);

      const event = eventQueue[middle];
      const {
        duration,
        timestamp: startTime
      } = event;

      const stopTime = startTime + duration;

      // TODO This won't find small things (like state-updates)
      if (timestampAtMouseX >= startTime && timestampAtMouseX <= stopTime) {
        hoveredEvent = event;
        break;
      }

      if (stopTime < timestampAtMouseX) {
        start = middle + 1;
      } else {
        end = middle - 1;
      }
    }
  }

  return hoveredEvent;
}
