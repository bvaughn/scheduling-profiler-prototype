import { useEffect, useRef, useState } from 'react';
import { positionToTimestamp } from './usePanAndZoom';
import { EVENT_SIZE } from './constants';

export default function useInteractiveEvents({
  canvasRef,
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

  const [selectedEvent, setSelectedEvent] = useState(null);

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

  useEffect(() => {
    const onClick = () => {
      setSelectedEvent(lastResultRef.current.hoveredEvent || null);
    };
    const canvas = canvasRef.current;
    canvas.addEventListener('click', onClick);
    return () => {
      canvas.removeEventListener('click', onClick);
    };
  }, [canvasRef]);

  if (eventQueue === null) {
    return [null, selectedEvent];
  }

  const eventSizeInMS = EVENT_SIZE / zoomLevel;
  const timestampAtMouseX = positionToTimestamp(canvasMouseX, offsetX, zoomLevel);

  if (
    canvasMouseX >= 0 && canvasMouseX < canvasWidth &&
    canvasMouseY >= 0 && canvasMouseY < canvasHeight
  ) {
    // Small mouse movements won't change the hovered event,
    // So always start by checking the last hovered event to see if we can avoid doing more work.
    const lastEvents = lastResultRef.current.eventQueue;
    const lastHoveredEvent = lastResultRef.current.hoveredEvent;

    // TODO This short circuit should handle events without durations too
    if (
      lastHoveredEvent !== null &&
      lastEvents === eventQueue &&
      timestampAtMouseX >= lastHoveredEvent.timestamp &&
      timestampAtMouseX <= lastHoveredEvent.timestamp + lastHoveredEvent.duration
    ) {
      hoveredEvent = lastHoveredEvent;

      return [hoveredEvent, selectedEvent];
    }

    // Since event data is sorted, we can use a binary search for faster comparison.

    let start = 0;
    let end = eventQueue.length - 1;
    while (start <= end) {
      const middle = Math.floor((start + end) / 2);

      const event = eventQueue[middle];
      const { duration, timestamp } = event;

      let startTime = timestamp;
      let stopTime;

      if (duration !== undefined) {
        stopTime = startTime + duration;

        if (timestampAtMouseX >= startTime && timestampAtMouseX <= stopTime) {
          hoveredEvent = event;
          break;
        }
      } else {
        startTime -= eventSizeInMS / 2;
        stopTime = startTime + eventSizeInMS;

        if (timestampAtMouseX >= startTime && timestampAtMouseX <= stopTime) {
          hoveredEvent = event;
          break;
        }
      }


      if (stopTime < timestampAtMouseX) {
        start = middle + 1;
      } else {
        end = middle - 1;
      }
    }
  }

  return [hoveredEvent, selectedEvent];
}