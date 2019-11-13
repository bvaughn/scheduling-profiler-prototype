import React, { Fragment, useLayoutEffect, useRef } from 'react';
import useMoveAndZoom from './useMoveAndZoom';
import { getCanvasContext } from './canvasUtils';
import { timestampToPosition } from './useMoveAndZoom';
import Tooltip from './Tooltip';
import preprocessData from './preprocessData';
import style from './App.module.css';

// https://docs.google.com/document/d/1CvAClvFfyA5R-PhYUmn5OOQtYMH4h6I0nSsKchNAySU/preview#
// import profileJSON from './big-data.json';
import profileJSON from './small-data.json';

const events = preprocessData(profileJSON);
console.log('events', events)

const BAR_X_GUTTER = 1;
const CANVAS_HEIGHT = 100;
const CANVAS_WIDTH = 800;

const renderCanvas = (canvas, state) => {
  const context = getCanvasContext(canvas);

  const {
    height: canvasHeight,
    width: canvasWidth,
  } = canvas;

  const { offsetX, zoomLevel } = state;

  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, canvas.width, canvas.height);

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
    switch (type) {
      case 'commit-work':
        color = '#3d87f5';
        break;
      case 'render-idle':
        color = 'rgba(0,0,0,.05) ';
        break;
      case 'render-work':
        color = '#e7f0fd';
        break;
      default:
        break;
    }

    context.fillStyle = color;
    context.fillRect(Math.floor(x), Math.floor(0), Math.floor(width), Math.floor(canvasHeight));
  });

  // TODO Is this necessary?
  canvas.style.transform = '';
};

function App() {
  const canvasRef = useRef();

  const lastEvent = events[events.length - 1];
  const lastTime =
    lastEvent.duration !== undefined
      ? lastEvent.timestamp + lastEvent.duration
      : lastEvent.timestamp;

  const state = useMoveAndZoom(canvasRef, lastTime);

  useLayoutEffect(() => renderCanvas(canvasRef.current, state));

  return (
    <Fragment>
      <canvas
        ref={canvasRef}
        className={style.Canvas}
        height={CANVAS_HEIGHT}
        width={CANVAS_WIDTH}
      />
      <Tooltip
        canvasHeight={CANVAS_HEIGHT}
        canvasWidth={CANVAS_WIDTH}
        events={events}
        state={state}
      />
    </Fragment>
  );
}

export default App;
