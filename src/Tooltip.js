import React, { Fragment } from 'react';
import { getMaxOffsetX, positionToTimestamp, timestampToPosition } from './usePanAndZoom';
import style from './Tooltip.module.css';
import { BAR_X_GUTTER, TOOLTIP_OFFSET } from './constants';

export default function EventFinder({ canvasHeight, canvasWidth, events, state }) {
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

  return (
    <Fragment>
      {hoveredEvent && (
        <Highlight
          canvasHeight={canvasHeight}
          hoveredEvent={hoveredEvent}
          state={state}
        />
      )}
      {hoveredEvent && (
        <Tooltip
          hoveredEvent={hoveredEvent}
          state={state}
        />
      )}

      <DebugInfo
        canvasWidth={canvasWidth}
        state={state}
        timestampAtMouseX={timestampAtMouseX}
      />
    </Fragment>
  );
}

function Tooltip({ hoveredEvent, state }) {
  const { canvasMouseY, canvasMouseX } = state;
  const { duration, timestamp, type } = hoveredEvent;

  return (
    <div
      className={style.Tooltip}
      style={{
        position: 'absolute',
        top: canvasMouseY + TOOLTIP_OFFSET,
        left: canvasMouseX + TOOLTIP_OFFSET,
      }}
    >
      {type} at {timestamp}ms - {timestamp + duration}ms
    </div>
  );
}

function Highlight({ canvasHeight, hoveredEvent, state }) {
  const { offsetX, zoomLevel } = state;
  const { duration, timestamp, type } = hoveredEvent;

  let width = Math.max(duration * zoomLevel - BAR_X_GUTTER, 0);

  if (width <= 0) {
    return null;
  }

  const isReactEvent = type !== 'non-react-function-call';

  return (
    <div
      className={style.Highlight}
      style={{
        position: 'absolute',
        top: Math.floor(isReactEvent ? 0.2 * canvasHeight : 0.6 * canvasHeight),
        left: Math.floor(timestampToPosition(timestamp, offsetX, zoomLevel)),
        width: Math.floor(width),
        height: Math.floor(0.2 * canvasHeight),
      }}
    />
  );
}

function DebugInfo({ canvasWidth, state, timestampAtMouseX }) {
  const bits = [
    `scrollWidth: ${state.scrollWidth}`,
    `offsetX: ${state.offsetX} [0 - ${getMaxOffsetX(canvasWidth, state.unscaledContentWidth, state.zoomLevel)}]`,
    `zoomLevel: ${state.zoomLevel} [min: ${state.minZoomLevel}]`,
    `canvasMouseX: ${state.canvasMouseX}`,
    `canvasMouseY: ${state.canvasMouseY}`,
    `caltulated ts: ${timestampAtMouseX}`,
  ];
  return (
    <pre>{bits.join('\n')}</pre>
  );
}