import React, { Fragment } from 'react';
import { positionToTimestamp } from './usePanAndZoom';

export default function useHoveredEvent({ canvasHeight, canvasWidth, events, state }) {
  const {
    canvasMouseX,
    canvasMouseY,
    offsetX,
    zoomLevel,
  } = state;

  const timestampAtMouseX = positionToTimestamp(canvasMouseX, offsetX, zoomLevel);

  const isReactEvent = canvasMouseY < canvasHeight / 2;

  let hoveredEvent = null;
  if (
    canvasMouseX >= 0 && canvasMouseX < canvasWidth &&
    canvasMouseY >= 0 && canvasMouseY < canvasHeight
  ) {
    // TODO Cache last hovered event and check it first as short cut
    // TODO Use binary search for faster comparison
    hoveredEvent = events.find(event => {
      const { duration, timestamp, type } = event;

      if (isReactEvent !== (type !== 'non-react-function-call')) {
        return false;
      }

      // TODO This won't find small things (like state-updates)
      return timestampAtMouseX >= timestamp && timestampAtMouseX <= timestamp + duration;
    });
  }

  return hoveredEvent;
}
