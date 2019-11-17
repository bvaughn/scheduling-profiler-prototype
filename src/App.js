import React, { Fragment, useLayoutEffect, useRef } from 'react';
import usePanAndZoom from './usePanAndZoom';
import { getCanvasContext } from './canvasUtils';
import { positionToTimestamp, timestampToPosition } from './usePanAndZoom';
import useHoveredEvent from './useHoveredEvent';
import EventTooltip from './EventTooltip';
import preprocessData from './preprocessData';
import styles from './App.module.css';
import AutoSizer from "react-virtualized-auto-sizer";
import { INTERVAL_TIMES, MAX_INTERVAL_SIZE_PX } from './constants';

// https://docs.google.com/document/d/1CvAClvFfyA5R-PhYUmn5OOQtYMH4h6I0nSsKchNAySU/preview#
import profileJSON from './big-data.json';

const MARKER_HEIGHT = 10;
const MARKER_GUTTER_SIZE = 4;
const BAR_HEIGHT = 20;
const BAR_HORIZONTAL_SPACING = 1;
const BAR_GUTTER_SIZE = 10;

const priorities = ['unscheduled', 'high', 'normal', 'low'];

const headerHeight = (MARKER_HEIGHT + MARKER_GUTTER_SIZE * 2);
const threadHeight = (BAR_HEIGHT * 2 + BAR_GUTTER_SIZE * 3)
const canvasHeight =
  headerHeight +
  threadHeight * priorities.length;

const events = preprocessData(profileJSON);

// Time mark intervals vary based on the current zoom range and the time it represents.
// In Chrome, these seem to range from 70-140 pixels wide.
// Time wise, they represent intervals of e.g. 1s, 500ms, 200ms, 100ms, 50ms, 20ms.
// Based on zoom, we should determine which amount to actually show.
function getTimeTickInterval(zoomLevel) {
  let interval = INTERVAL_TIMES[0];
  for (let i = 0; i < INTERVAL_TIMES.length; i++) {
    const currentInteval = INTERVAL_TIMES[i];
    const pixels = currentInteval * zoomLevel;
    if (pixels <= MAX_INTERVAL_SIZE_PX) {
      interval = currentInteval;
    }
  }
  return interval;
}

let cachedEventQueueToPositionMap = null;
function eventQueueToPosition(eventQueue) {
  if (cachedEventQueueToPositionMap === null) {
    cachedEventQueueToPositionMap = new Map();

    let y = threadHeight;
    priorities.forEach((priority, priorityIndex) => {
      const currentPriority = events[priority];
      y += BAR_GUTTER_SIZE;
      cachedEventQueueToPositionMap.set(currentPriority.react, y);
      y += BAR_HEIGHT + BAR_GUTTER_SIZE;
      cachedEventQueueToPositionMap.set(currentPriority.other, y);
      y += BAR_HEIGHT + BAR_GUTTER_SIZE;
    });
  }

  return cachedEventQueueToPositionMap.get(eventQueue) || null;
}

function positionToEventQueue(mouseY) {
  let y = headerHeight;

  for (let i = 0; i < priorities.length; i++) {
    const priority = priorities[i];
    const currentPriority = events[priority];

    y += BAR_GUTTER_SIZE;

    if (mouseY >= y && mouseY <= y + BAR_HEIGHT) {
      return currentPriority.react;
    }

    y += BAR_HEIGHT + BAR_GUTTER_SIZE;

    if (mouseY >= y && mouseY <= y + BAR_HEIGHT) {
      return currentPriority.other;
    }

    y += BAR_HEIGHT + BAR_GUTTER_SIZE;
  }

  return null;
}

// TODO Maybe I could memoize canvas rendering if the only thing that's changed is the mouse X/Y coordinates.
// This would mean that I'd have to give up coloring the hovered element differently (or just render that with React)
// but that might be the right trade off.
const renderCanvas = (canvas, state, hoveredEvent) => {
  const context = getCanvasContext(canvas, true);

  const canvasHeight = canvas.height / 2;
  const canvasWidth = canvas.width / 2;

  const { offsetX, unscaledContentWidth, zoomLevel } = state;

  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, canvas.width, canvas.height);

  let y = MARKER_GUTTER_SIZE;

  const interval = getTimeTickInterval(zoomLevel);
  const intervalSize = interval * zoomLevel;
  const firstIntervalPosition = 0 - offsetX + Math.floor(offsetX / intervalSize) * intervalSize;
  for (let i = firstIntervalPosition; i < canvasWidth; i += intervalSize) {
    context.fillStyle = '#dddddd';
    context.fillRect(i, 0, 1, canvasHeight);

    const markerTimestamp = positionToTimestamp(i, offsetX, zoomLevel);
    const markerLabel = Math.round(markerTimestamp);

    if (i > 0) {
      context.font = `${MARKER_HEIGHT}px Lucida Grande`;
      context.fillStyle = 'black';
      context.textAlign = 'right';
      context.fillText(`${markerLabel}ms`, i - MARKER_GUTTER_SIZE, y + MARKER_HEIGHT);
    }
  }

  y += MARKER_HEIGHT + MARKER_GUTTER_SIZE;

  priorities.forEach((priority, priorityIndex) => {
    const currentPriority = events[priority];

    if (priorityIndex % 2 === 0) {
      context.fillStyle = 'rgba(0,0,0,.02)';
      context.fillRect(
        Math.floor(0),
        Math.floor(y),
        Math.floor(canvasWidth),
        Math.floor(threadHeight),
      );
    }

    y += BAR_GUTTER_SIZE;

    // Render React stuff that happened at this priority.
    currentPriority.react.forEach(event => {
      const {
        duration,
        timestamp,
        type,
      } = event;

      if (duration === undefined) {
        // TODO Support non-duration events (e.g. setState)
        // Probably best to do this by specifying some minimum duration so they can be hovered?
        return;
      }

      const width = Math.max(duration * zoomLevel - BAR_HORIZONTAL_SPACING, 0);
      if (width <= 0) {
        return; // Too small to render at this zoom level
      }

      const x = timestampToPosition(timestamp, offsetX, zoomLevel);
      if (x + width < 0 || canvasWidth < x) {
        return; // Not in view
      }

      let color = null;
      switch (type) {
        case 'commit-work':
          color = event === hoveredEvent
            ? '#dd1411'
            : '#ff3633';
          break;
        case 'render-idle':
          color = event === hoveredEvent
            ? '#c5d0dc'
            : '#e7f0fe';
          break;
        case 'render-work':
          color = event === hoveredEvent
            ? '#1c65d3'
            : '#3e87f5';
          break;
        default:
          console.warn(`Unexpected type "${type}"`);
          break;
      }

      if (color !== null) {
        context.fillStyle = color;
        context.fillRect(
          Math.floor(x),
          Math.floor(y),
          Math.floor(width),
          Math.floor(BAR_HEIGHT),
        );
      }
    });

    y += BAR_HEIGHT + BAR_GUTTER_SIZE;

    // Render non-React JS that happened at this priority.
    currentPriority.other.forEach(event => {
      const {
        duration,
        timestamp,
        type,
      } = event;

      const width = Math.max(duration * zoomLevel - BAR_HORIZONTAL_SPACING, 0);
      if (width <= 0) {
        return; // Too small to render at this zoom level
      }

      const x = timestampToPosition(timestamp, offsetX, zoomLevel);
      if (x + width < 0 || canvasWidth < x) {
        return; // Not in view
      }

      context.fillStyle = event === hoveredEvent
        ? '#434343'
        : '#656565';

      context.fillRect(
        Math.floor(x),
        Math.floor(y),
        Math.floor(width),
        Math.floor(BAR_HEIGHT),
      );
    });

    y += BAR_HEIGHT + BAR_GUTTER_SIZE;
  });
};

function App() {
  return (
    <AutoSizer disableHeight>
      {({ width }) => <AppWithWidth width={width} />}
    </AutoSizer>
  );
}

function getLastEventTime(events) {
  const lastEvent = events[events.length - 1];
  if (lastEvent == null) {
    return 0;
  }
  return lastEvent.duration !== undefined
    ? lastEvent.timestamp + lastEvent.duration
    : lastEvent.timestamp;
}

function AppWithWidth({ width }) {
  const canvasRef = useRef();

  const state = usePanAndZoom(canvasRef, events.duration);
  const hoveredEvent = useHoveredEvent({
    canvasHeight,
    canvasWidth: width,
    events: positionToEventQueue(state.canvasMouseY),
    state,
  });

  useLayoutEffect(() => renderCanvas(canvasRef.current, state, hoveredEvent));

  return (
    <div
      className={styles.Container}
      style={{
        height: canvasHeight,
        width: width,
      }}
    >
      <canvas
        ref={canvasRef}
        className={styles.Canvas}
        height={canvasHeight}
        width={width}
      />
      <EventTooltip
        hoveredEvent={hoveredEvent}
        state={state}
      />
    </div>
  );
}

export default App;
