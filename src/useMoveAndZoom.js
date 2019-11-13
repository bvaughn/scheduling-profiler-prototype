import { useEffect, useReducer } from 'react';
import { flushSync } from 'react-dom';
import { getCanvasMousePos } from './canvasUtils';
import debounce from 'lodash.debounce';

const WHEEL_DELTA_THRESHOLD = 1;
const MAX_ZOOM_LEVEL = 1;

const initialState = {
  canvasMouseX: 0,
  canvasMouseY: 0,
  isDragging: false,
  isZooming: false,
  minZoomLevel: 1,
  offsetX: 0,
  unscaledContentWidth: 0,
  zoomLevel: 1,
};

export function positionToTimestamp(position, offset, zoomLevel) {
  return (position + offset) / zoomLevel;
}

export function timestampToPosition(timestamp, offset, zoomLevel) {
  return (timestamp * zoomLevel) - offset; 
}

export function getMaxOffsetX(canvasWidth, unscaledContentWidth, zoomLevel) {
  return unscaledContentWidth * zoomLevel - canvasWidth;
}

function reducer(state, action) {
  const { payload, type } = action;
  switch (type) {
    case 'debounced-wheel':
      return {
        ...state,
        isZooming: false,
      };
    case 'initialize':
      return {
        ...state,
        minZoomLevel: payload.minZoomLevel,
        unscaledContentWidth: payload.unscaledContentWidth,
        zoomLevel: payload.zoomLevel,
      };
    case 'mouse-down':
      return {
        ...state,
        isDragging: true,
      };
    case 'mouse-move':
      const {
        canvasMouseX,
        canvasMouseY
      } = getCanvasMousePos(payload.canvas, payload.event);

      if (state.isDragging) {
        return {
          ...state,
          canvasMouseX,
          canvasMouseY,
          offsetX: clamp(
            0,
            getMaxOffsetX(canvas.width, state.unscaledContentWidth, state.zoomLevel),
            state.offsetX - payload.event.movementX / state.zoomLevel,
          ),
        };
      } else {
        return {
          ...state,
          canvasMouseX,
          canvasMouseY,
        };
      }
    case 'mouse-up':
      return {
        ...state,
        isDragging: false,
      };
    case 'wheel':
      const { canvas, event } = payload;
      const { deltaX, deltaY } = event;
      const { offsetX, minZoomLevel, unscaledContentWidth, zoomLevel } = state;

      const absDeltaX = Math.abs(deltaX);
      const absDeltaY = Math.abs(deltaY);

      if (absDeltaX > absDeltaY) {
        if (absDeltaX > WHEEL_DELTA_THRESHOLD) {
          return {
            ...state,
            offsetX: clamp(
              0,
              getMaxOffsetX(canvas.width, unscaledContentWidth, zoomLevel),
              offsetX + deltaX / zoomLevel,
            ),
          };
        }
      } else {
        if (absDeltaY > WHEEL_DELTA_THRESHOLD) {
          const updatedZoomLevel = clamp(
            minZoomLevel,
            MAX_ZOOM_LEVEL,
            zoomLevel * (1 + 0.005 * -deltaY),
          );

          const { canvasMouseX } = getCanvasMousePos(canvas, event);

          // Determine what point in time the mouse is currently centered over,
          // and adjust the offset so that point stays centered after zooming.
          const timestampAtCurrentZoomLevel = positionToTimestamp(canvasMouseX, offsetX, zoomLevel);

          // ...given...
          // x position = ( timestamp * zoom level ) - x offset
          // ...then...
          // x offset = ( timestamp * zoom level ) - x position
          const newOffsetX = clamp(
            0,
            getMaxOffsetX(canvas.width, unscaledContentWidth, updatedZoomLevel),
            (timestampAtCurrentZoomLevel * updatedZoomLevel) - canvasMouseX,
          );

          if (updatedZoomLevel !== zoomLevel) {
            return {
              ...state,
              offsetX: newOffsetX,
              isZooming: true,
              zoomLevel: updatedZoomLevel,
            };
          }
        }
      }
      break;
    default:
      throw Error(`Unexpected type "${type}"`);
  }

  return state;
}

function clamp(min, max, value) {
  return Math.max(min, Math.min(max, value));
}

// Inspired by https://github.com/jsdf/flamechart
export default function useMoveAndZoom(canvasRef, unscaledContentWidth) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // TODO This effect should run any time width or unscaledContentWidth changes
  useEffect(() => {
    const width = canvasRef.current.width;

    dispatch({
      type: 'initialize',
      payload: {
        minZoomLevel: width / unscaledContentWidth,
        unscaledContentWidth,
        zoomLevel: width / unscaledContentWidth,
      },
    });
  }, [canvasRef, unscaledContentWidth]);

  useEffect(() => {
    const canvas = canvasRef.current;

    const onCanvasMouseDown = event => {
      dispatch({ type: 'mouse-down' });
    };

    const onCanvasMouseMove = event => {
      dispatch({
        type: 'mouse-move',
        payload: {
          canvas: canvasRef.current,
          event,
        }
      });
    };

    const onDocumentMouseUp = event => {
      dispatch({ type: 'mouse-up' });
    };

    const onCanvasWheel = event => {
      event.preventDefault();
      event.stopPropagation();

      dispatch({
        type: 'wheel',
        payload: {
          canvas,
          event,
        },
      })
    };

    document.addEventListener('mouseup', onDocumentMouseUp);

    if (canvas instanceof HTMLCanvasElement) {
      canvas.addEventListener('wheel', onCanvasWheel);
      canvas.addEventListener('mousedown', onCanvasMouseDown);
      canvas.addEventListener('mousemove', onCanvasMouseMove);
    }

    return () => {
      document.removeEventListener('mouseup', onDocumentMouseUp);

      if (canvas instanceof HTMLCanvasElement) {
        canvas.removeEventListener('wheel', onCanvasWheel);
        canvas.removeEventListener('mousedown', onCanvasMouseDown);
        canvas.removeEventListener('mousemove', onCanvasMouseMove);
      }
    };
  }, [canvasRef]);

  useEffect(() => {
    if (state.isZooming) {
      const id = setTimeout(() => {
        dispatch({ type: 'debounced-wheel' });
      }, 100);
      return () => clearTimeout(id);
    }
  }, [state.isZooming]);

  return state;
}