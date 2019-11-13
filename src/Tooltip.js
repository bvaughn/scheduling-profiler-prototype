import React, { Fragment } from 'react';
import { getMaxOffsetX, positionToTimestamp } from './useMoveAndZoom';
import style from './Tooltip.module.css';

const TOOLTIP_OFFSET = 8;

export default function Tooltip({ canvasHeight, canvasWidth, events, state }) {
  const {
    canvasMouseX,
    canvasMouseY,
    offsetX,
    zoomLevel,
  } = state;

  const timestampAtMouseX = positionToTimestamp(canvasMouseX, offsetX, zoomLevel);

  let hoveredEvent = null;
  if (
    canvasMouseX >= 0 && canvasMouseX < canvasWidth &&
    canvasMouseY >= 0 && canvasMouseY < canvasHeight
  ) {
    // TODO Cache last hovered event and check it first as short cut
    // TODO Use binary search for faster comparison
    hoveredEvent = events.find(event => {
      const { duration, timestamp } = event;
      // TODO This won't find small things (like state-updates)
      return timestampAtMouseX >= timestamp && timestampAtMouseX <= timestamp + duration;
    });
  }

  return (
    <Fragment>
      {hoveredEvent && (
        <div
          className={style.Tooltip}
          style={{
            position: 'absolute',
            top: canvasMouseY + TOOLTIP_OFFSET,
            left: canvasMouseX + TOOLTIP_OFFSET,
          }}
        >
          {hoveredEvent.type} at {hoveredEvent.timestamp} - {hoveredEvent.timestamp + hoveredEvent.duration}
        </div>
      )}
<pre>{`width: 800
scrollWidth: ${state.scrollWidth}
offsetX: ${state.offsetX} [0 - ${getMaxOffsetX(canvasWidth, state.unscaledContentWidth, state.zoomLevel)}]
zoomLevel: ${state.zoomLevel} [${state.minZoomLevel} - ???]
canvasMouseX: ${state.canvasMouseX}
canvasMouseY: ${state.canvasMouseY}
caltulated ts: ${timestampAtMouseX}`}</pre>
    </Fragment>
  );
}