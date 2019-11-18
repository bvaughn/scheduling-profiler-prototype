import React, { Fragment, useLayoutEffect, useRef } from 'react';
import memoize from 'memoize-one';
import usePanAndZoom from './usePanAndZoom';
import { getCanvasContext } from './canvasUtils';
import { positionToTimestamp, timestampToPosition } from './usePanAndZoom';
import useInteractiveEvents from './useInteractiveEvents';
import EventHighlight from './EventHighlight';
import EventTooltip from './EventTooltip';
import SelectedEvent from './SelectedEvent';
import preprocessData from './preprocessData';
import styles from './App.module.css';
import AutoSizer from "react-virtualized-auto-sizer";
import {
  BAR_GUTTER_SIZE,
  BAR_HEIGHT,
  BAR_HORIZONTAL_SPACING,
  BAR_SEPARATOR_SIZE,
  EVENT_SIZE,
  INTERVAL_TIMES,
  MARKER_GUTTER_SIZE,
  MARKER_HEIGHT,
  MAX_INTERVAL_SIZE_PX,
} from './constants';

// https://docs.google.com/document/d/1CvAClvFfyA5R-PhYUmn5OOQtYMH4h6I0nSsKchNAySU/preview#
import profileJSON from './big-data.json';

const priorities = ['unscheduled', 'high', 'normal', 'low'];

const headerHeight = (MARKER_HEIGHT + MARKER_GUTTER_SIZE * 2);
const threadHeight = (EVENT_SIZE + BAR_HEIGHT * 2 + BAR_GUTTER_SIZE * 4)
const canvasHeight =
  headerHeight +
  BAR_SEPARATOR_SIZE * (priorities.length - 1) +
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

/*
let cachedEventQueueToPositionMap = null;
function eventQueueToPosition(eventQueue) {
  if (cachedEventQueueToPositionMap === null) {
    cachedEventQueueToPositionMap = new Map();

    let y = threadHeight;
    priorities.forEach((priority, priorityIndex) => {
      const currentPriority = events[priority];
      if (priorityIndex > 0) {
        y += BAR_SEPARATOR_SIZE;
      }
      y += BAR_GUTTER_SIZE;
      cachedEventQueueToPositionMap.set(currentPriority.reactEvents, y);
      y += EVENT_SIZE + BAR_GUTTER_SIZE;
      cachedEventQueueToPositionMap.set(currentPriority.reactWork, y);
      y += BAR_HEIGHT + BAR_GUTTER_SIZE;
      cachedEventQueueToPositionMap.set(currentPriority.otherWork, y);
      y += BAR_HEIGHT + BAR_GUTTER_SIZE;
    });
  }

  return cachedEventQueueToPositionMap.get(eventQueue) || null;
}
*/

function positionToEventQueue(mouseY) {
  let y = headerHeight;

  for (let priorityIndex = 0; priorityIndex < priorities.length; priorityIndex++) {
    const priority = priorities[priorityIndex];
    const currentPriority = events[priority];

    y += BAR_GUTTER_SIZE
    if (mouseY >= y && mouseY <= y + EVENT_SIZE) {
      return [currentPriority.reactEvents, y];
    }

    y += EVENT_SIZE + BAR_GUTTER_SIZE;
    if (mouseY >= y && mouseY <= y + BAR_HEIGHT) {
      return [currentPriority.reactWork, y];
    }

    y += BAR_HEIGHT + BAR_GUTTER_SIZE;
    if (mouseY >= y && mouseY <= y + BAR_HEIGHT) {
      return [currentPriority.otherWork, y];
    }

    y += BAR_HEIGHT + BAR_GUTTER_SIZE + BAR_SEPARATOR_SIZE;
  }

  return [null, null];
}

/*
let cachedIdlePattern = null;
function getIdlePattern() {
  if (cachedIdlePattern === null) {
    // https://stackoverflow.com/questions/32201479/continuous-hatch-line-needed-in-canvas-with-repeated-pattern
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    const CANVAS_SIDE_LENGTH = 8;
    const WIDTH = CANVAS_SIDE_LENGTH;
    const HEIGHT = CANVAS_SIDE_LENGTH;
    const DIVISIONS = 4;

    canvas.width = WIDTH;
    canvas.height = HEIGHT;
    context.fillStyle = '#e7f0fe';

    // Top line
    context.beginPath();
    context.moveTo(0, HEIGHT * (1 / DIVISIONS));
    context.lineTo(WIDTH * (1 / DIVISIONS), 0);
    context.lineTo(0, 0);
    context.lineTo(0, HEIGHT * (1 / DIVISIONS));
    context.fill();

    // Middle line
    context.beginPath();
    context.moveTo(WIDTH, HEIGHT * (1 / DIVISIONS));
    context.lineTo(WIDTH * (1 / DIVISIONS), HEIGHT);
    context.lineTo(0, HEIGHT);
    context.lineTo(0, HEIGHT * ((DIVISIONS - 1) / DIVISIONS));
    context.lineTo(WIDTH * ((DIVISIONS - 1) / DIVISIONS), 0);
    context.lineTo(WIDTH, 0);
    context.lineTo(WIDTH, HEIGHT * (1 / DIVISIONS));
    context.fill();

    // Bottom line
    context.beginPath();
    context.moveTo(WIDTH, HEIGHT * ((DIVISIONS - 1) / DIVISIONS));
    context.lineTo(WIDTH * ((DIVISIONS - 1) / DIVISIONS), HEIGHT);
    context.lineTo(WIDTH, HEIGHT);
    context.lineTo(WIDTH, HEIGHT * ((DIVISIONS - 1) / DIVISIONS));
    context.fill();

    cachedIdlePattern = canvas;
  }

  return cachedIdlePattern;
}
*/

const renderCanvas = memoize((canvas, canvasWidth, canvasHeight, offsetX, zoomLevel) => {
  const context = getCanvasContext(canvas, canvasWidth, true);

  // Fill the canvas with the background color
  context.fillStyle = '#dddddd';
  context.fillRect(0, 0, canvas.width, canvas.height);

  let y = MARKER_HEIGHT + MARKER_GUTTER_SIZE * 2;

  // Draw priority groups behind everything else
  priorities.forEach(() => {
    context.fillStyle = '#ffffff';
    context.fillRect(
      Math.floor(0),
      Math.floor(y),
      Math.floor(canvasWidth),
      Math.floor(threadHeight),
    );

    y += BAR_GUTTER_SIZE * 4 + EVENT_SIZE + BAR_HEIGHT * 2 + BAR_SEPARATOR_SIZE;
  });

  y = MARKER_GUTTER_SIZE;

  const interval = getTimeTickInterval(zoomLevel);
  const intervalSize = interval * zoomLevel;
  const firstIntervalPosition = 0 - offsetX + Math.floor(offsetX / intervalSize) * intervalSize;

  // Draw time markers on top of the priority groupings
  for (let i = firstIntervalPosition; i < canvasWidth; i += intervalSize) {
    if (i > 0) {
      context.fillStyle = '#dddddd';
      context.fillRect(i, 0, 1, canvasHeight);

      const markerTimestamp = positionToTimestamp(i, offsetX, zoomLevel);
      const markerLabel = Math.round(markerTimestamp);

      context.font = `${MARKER_HEIGHT}px Lucida Grande`;
      context.fillStyle = '#000000';
      context.textAlign = 'right';
      context.fillText(`${markerLabel}ms`, i - MARKER_GUTTER_SIZE, y + MARKER_HEIGHT);
    }
  }

  y += MARKER_HEIGHT + MARKER_GUTTER_SIZE;

  // Draw events on top of everything
  priorities.forEach((priority, priorityIndex) => {
    const currentPriority = events[priority];

    y += BAR_GUTTER_SIZE;

    // Render React stuff that happened at this priority.
    currentPriority.reactEvents.forEach(event => {
      const {
        timestamp,
        type,
      } = event;

      const x = timestampToPosition(timestamp, offsetX, zoomLevel);
      if (x + EVENT_SIZE < 0 || canvasWidth < x) {
        return; // Not in view
      }

      let color = null;
      switch (type) {
        case 'schedule-render':
        case 'schedule-state-update':
          color = '#8c3cf5';
          break;
        case 'suspend':
          color = '#f26b0d';
          break;
        default:
          console.warn(`Unexpected event type "${type}"`);
          break;
      }

      if (color !== null) {
        context.beginPath();
        context.fillStyle = color;
        context.lineWidth = 0;
        context.arc(x, y + EVENT_SIZE / 2, EVENT_SIZE / 2, 0, 2 * Math.PI);
        context.fill();
      }
    });

    y += EVENT_SIZE + BAR_GUTTER_SIZE;

    // Render React stuff that happened at this priority.
    currentPriority.reactWork.forEach(event => {
      const {
        duration,
        timestamp,
        type,
      } = event;

      // We could change the max to 0 and just skip over rendering anything that small,
      // but this has the effect of making the chart look very empty when zoomed out.
      // So long as perf is okay- it might be best to err on the side of showing things.
      const width = Math.max(duration * zoomLevel - BAR_HORIZONTAL_SPACING, 1);

      const x = timestampToPosition(timestamp, offsetX, zoomLevel);
      if (x + width < 0 || canvasWidth < x) {
        return; // Not in view
      }

      let color = null;
      switch (type) {
        case 'commit-work':
          color = '#ff3633';
          break;
        case 'render-idle':
          // We could render idle time as diagonal hashes.
          // This looks nicer when zoomed in, but not so nice when zoomed out.
          // color = context.createPattern(getIdlePattern(), 'repeat');
          color = '#e7f0fe';
          break;
        case 'render-work':
          color = '#3e87f5';
          break;
        default:
          console.warn(`Unexpected work type "${type}"`);
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
    currentPriority.otherWork.forEach(event => {
      const { duration, timestamp } = event;

      const width = Math.max(duration * zoomLevel - BAR_HORIZONTAL_SPACING, 0);
      if (width <= 0) {
        return; // Too small to render at this zoom level
      }

      const x = timestampToPosition(timestamp, offsetX, zoomLevel);
      if (x + width < 0 || canvasWidth < x) {
        return; // Not in view
      }

      context.fillStyle = '#656565';
      context.fillRect(
        Math.floor(x),
        Math.floor(y),
        Math.floor(width),
        Math.floor(BAR_HEIGHT),
      );
    });

    y += BAR_HEIGHT + BAR_GUTTER_SIZE + BAR_SEPARATOR_SIZE;
  });
});

function App() {
  const labelStyle = {
    height: `${threadHeight}px`,
    marginBottom: `${BAR_SEPARATOR_SIZE}px`,
  };

  return (
    <div className={styles.App}>
      <div
        className={styles.LeftColumn}
        style={{
          paddingTop: `${headerHeight}px`,
        }}
      >
        <div className={styles.Label} style={labelStyle}>Unscheduled</div>
        <div className={styles.Label} style={labelStyle}>High</div>
        <div className={styles.Label} style={labelStyle}>Normal</div>
        <div className={styles.Label} style={labelStyle}>Low</div>
      </div>
      <div className={styles.RightColumn}>
        <div>
          <AutoSizer disableHeight>
            {({ width }) => <AutoSizedCanvas width={width} />}
          </AutoSizer>
        </div>
      </div>
    </div>
  );
}

function AutoSizedCanvas({ width }) {
  const canvasRef = useRef();

  const state = usePanAndZoom(canvasRef, events.duration);

  const [eventQueue, y] = positionToEventQueue(state.canvasMouseY);

  const [hoveredEvent, selectedEvent] = useInteractiveEvents({
    canvasRef,
    canvasHeight,
    canvasWidth: width,
    eventQueue,
    state,
  });

  useLayoutEffect(() => {
    renderCanvas(
      canvasRef.current,
      width,
      canvasHeight,
      state.offsetX,
      state.zoomLevel,
    )
  });

  return (
    <Fragment>
      <canvas
        ref={canvasRef}
        className={styles.Canvas}
        height={canvasHeight}
        width={width}
      />
      <EventHighlight
        hoveredEvent={hoveredEvent}
        height={BAR_HEIGHT}
        state={state}
        y={y}
      />
      <EventTooltip
        hoveredEvent={hoveredEvent}
        state={state}
      />
      <SelectedEvent
        selectedEvent={selectedEvent}
        width={width}
      />
    </Fragment>
  );
}

export default App;
