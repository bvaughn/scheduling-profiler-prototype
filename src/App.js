import React, { Fragment, useLayoutEffect, useRef } from 'react';
import usePanAndZoom from './usePanAndZoom';
import { getCanvasContext } from './canvasUtils';
import { positionToTimestamp, timestampToPosition } from './usePanAndZoom';
import useHoveredEvent from './useHoveredEvent';
import EventTooltip from './EventTooltip';
import preprocessData from './preprocessData';
import styles from './App.module.css';
import AutoSizer from "react-virtualized-auto-sizer";
import { BAR_X_GUTTER, INTERVAL_TIMES, MARKER_TEXT_OFFSET, MAX_INTERVAL_SIZE_PX } from './constants';

// https://docs.google.com/document/d/1CvAClvFfyA5R-PhYUmn5OOQtYMH4h6I0nSsKchNAySU/preview#
import profileJSON from './big-data.json';

const events = preprocessData(profileJSON);

const CANVAS_HEIGHT = 100;
const CANVAS_WIDTH = 800;

// Time mark intervals vary based on the current zoom range and the time it represents.
// In Chrome, these seem to range from 70-140 pixels wide.
// Time wise, they represent intervals of e.g. 1s, 500ms, 200ms, 100ms, 50ms, 20ms.
// Based on zoom, we should determine which amount to actually show.
function getTimeTickInterval(canvasWidth, unscaledContentWidth, zoomLevel) {
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

const renderCanvas = (canvas, state, hoveredEvent) => {
  const context = getCanvasContext(canvas, true);

  const canvasHeight = canvas.height / 2;
  const canvasWidth = canvas.width / 2;

  const { offsetX, unscaledContentWidth, zoomLevel } = state;

  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, canvas.width, canvas.height);

  const interval = getTimeTickInterval(canvasWidth, unscaledContentWidth, zoomLevel);
  const intervalSize = interval * zoomLevel;
  const firstIntervalPosition = 0 - offsetX + Math.floor(offsetX / intervalSize) * intervalSize;
  for (let i = firstIntervalPosition; i < canvasWidth; i += intervalSize) {
    context.fillStyle = '#dddddd';
    context.fillRect(i, 0, 1, canvasHeight);

    const markerTimestamp = positionToTimestamp(i, offsetX, zoomLevel);
    const markerLabel = Math.round(markerTimestamp);

    if (i > 0) {
      context.font = '10px Lucida Grande';
      context.fillStyle = 'black';
      context.textAlign = 'right';
      context.fillText(`${markerLabel}ms`, i - MARKER_TEXT_OFFSET, 10 + MARKER_TEXT_OFFSET);
    }
  }

  events.forEach(event => {
    const {
      duration,
      // TODO priority,
      timestamp,
      type,
    } = event;

    if (duration === undefined) {
      // TODO Support non-duration events (e.g. setState)
      // Probably best to do this by specifying some minimum duration so they can be hovered?
      return;
    }

    const width = Math.max(duration * zoomLevel - BAR_X_GUTTER, 0);

    if (width <= 0) {
      return; // Too small to render at this zoom level
    }

    const x = timestampToPosition(timestamp, offsetX, zoomLevel);
    
    if (x + width < 0 || canvasWidth < x) {
      return; // Not in view
    }

    let color = null;
    let y = null;
    switch (type) {
      case 'commit-work':
        color = event === hoveredEvent
          ? '#dd1411'
          : '#ff3633';
        y = 0.3;
        break;
      case 'render-idle':
        color = event === hoveredEvent
          ? '#c5d0dc'
          : '#e7f0fe';
        y = 0.3;
        break;
      case 'render-work':
        color = event === hoveredEvent
          ? '#1c65d3'
          : '#3e87f5';
        y = 0.3;
        break;
      case 'non-react-function-call':
        color = event === hoveredEvent
          ? '#434343'
          : '#656565';
        y = 0.65;
        break;
      default:
        console.warn(`Unexpected type "${type}"`);
        break;
    }

    if (color !== null) {
      context.fillStyle = color;
    }

    if (y !== null) {
      context.fillRect(
        Math.floor(x),
        Math.floor(y * canvasHeight),
        Math.floor(width),
        Math.floor(0.2 * canvasHeight),
      );
    }
  });

  // TODO Is this necessary?
  canvas.style.transform = '';
};

function App() {
  return (
    <AutoSizer disableHeight>
      {({ width }) => <AppWithWidth width={width} />}
    </AutoSizer>
  );
}

function AppWithWidth({ width }) {
  const canvasRef = useRef();

  const lastEvent = events[events.length - 1];
  const lastTime =
    lastEvent.duration !== undefined
      ? lastEvent.timestamp + lastEvent.duration
      : lastEvent.timestamp;

  const state = usePanAndZoom(canvasRef, lastTime);
  const hoveredEvent = useHoveredEvent({
    canvasHeight: CANVAS_HEIGHT,
    canvasWidth: width,
    events,
    state
  });

  useLayoutEffect(() => renderCanvas(canvasRef.current, state, hoveredEvent));

  return (
    <div
      className={styles.Container}
      style={{
        height: CANVAS_HEIGHT,
        width: width,
      }}
    >
      <canvas
        ref={canvasRef}
        className={styles.Canvas}
        height={CANVAS_HEIGHT}
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
