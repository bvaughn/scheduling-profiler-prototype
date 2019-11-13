import React, { useLayoutEffect, useRef, useState } from 'react';

export default function Viewport({ children, className, duration }) {
  const ref = useRef(null);
  const [minimumScale, setMinimumScale] = useState(1);
  const [scale, setScale] = useState(1);
  const [xOffset, setXOffset] = useState(0);

  const handleMouseDown = event => {
    // TODO Set initial anchor point
  };

  const handleMouseMove = event => {
    // TODO If anchor point defined, move viewport based on distance from it
  };

  const handleMouseUp = event => {
    // TODO Clear anchor point
  };

  const debugRef = useRef({});

  const handleWheel = event => {
    const deltaX = getNormalizedScrollDelta(event, ref.current.width, 'deltaX');
    const deltaY = getNormalizedScrollDelta(event, ref.current.height, 'deltaY');

    // If vertical wheel, zoom in/out
    // If horizontal wheel, move viewport
    if (Math.abs(deltaY) > Math.abs(deltaX)) {
      // TODO This is super naive zooming.
      const newScale = clamp(minimumScale, 10, scale - (deltaY * 0.001));

      // Content under the cursor should stay fixed as we zoom in or out.
      // So we need to find what the current timestamp is,
      // and map that to the new scale/zoom.
      const relativeX = event.pageX - ref.current.offsetLeft;
      const anchorX = (relativeX / scale) - xOffset;

      // anchor point = timestamp * scale - time offset
      const anchor = anchorX * scale - xOffset;

      debugRef.current = {
        pageX: event.pageX,
        relativeX,
        anchorX
      };

      // time offset = timestamp * scale - anchor point
      const newXOffset = anchorX * newScale - anchor;

console.groupCollapsed('handleWheel()', scale, '->', newScale, '...', xOffset, '->', newXOffset);
console.log('x:', event.pageX, '->', relativeX);
console.log('anchorX:', anchorX);
console.log('scale:', scale, '->', newScale)
console.log('anchor = anchor * scale - time offset');
console.log(`${anchor} = ${anchorX} * ${scale} - ${xOffset}`);
console.log('new offset = anchor * scale - anchor');
console.log(`${newXOffset} = ${anchorX} * ${newScale} - ${anchor}`);
console.groupEnd();

      // TODO Zoom in around cursor location too (move viewport)
      //setScale(newScale);
      //setXOffset(newXOffset);
//ref.current.style.transform = `translateX(${xOffset}px) scale(${scale}, 1)`;

    } else {
      // TODO This is super naive scrolling.
      // TODO Also the max delatX doesn't take the container size into account.
      //setXOffset(clamp(0, duration, xOffset + deltaX));
//ref.current.style.transform = `translateX(${xOffset}px) scale(${scale}, 1)`;
    }

    return false;
  };

  // Initialize.
  // TODO Re-initialize values on resize.
  useLayoutEffect(() => {
    const container = ref.current;
    const computedStyle = getComputedStyle(container);
    const scale = (container.offsetWidth - parseFloat(computedStyle.paddingLeft) - parseFloat(computedStyle.paddingRight)) / (duration / 1000);

    setScale(scale);
    setMinimumScale(scale);
  }, []);

  useLayoutEffect(() => {
    const container = ref.current;
    container.style.setProperty('--scale', scale);
    container.style.setProperty('--x-offset', `${xOffset}px`);
    //container.scrollLeft = xOffset;

    // Prevent default scrolling/bouncing behavior.
    ref.current.addEventListener("wheel", event => event.preventDefault());
    ref.current.addEventListener("scroll", event => event.preventDefault());
  }, [scale, xOffset]);

  return (
    <div
      className={className}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
      style={{
        // transform: `translateX(-${xOffset}px)`
      }}
      ref={ref}
    >
      {children}

      <pre>{`scale: ${scale}
xOffset: ${xOffset}
last pageX: ${debugRef.current.pageX}
last relativeX: ${debugRef.current.relativeX}
last anchorX: ${debugRef.current.anchorX}`}</pre>
    </div>
  );
}

function clamp(min, max, value) {
  return Math.max(min, Math.min(max, value));
}

const SCROLL_LINE_SIZE = 15;
const { DOM_DELTA_PAGE, DOM_DELTA_LINE } =
  typeof window === 'object' && window.WheelEvent
    ? new WheelEvent('mouse')
    : { DOM_DELTA_LINE: 1, DOM_DELTA_PAGE: 2 };

/**
 * Scroll wheel events can by of various types. Do the right thing by converting these
 * into CssPixels. https://developer.mozilla.org/en-US/docs/Web/API/WheelEvent/deltaMode
 */
function getNormalizedScrollDelta(
  event: SyntheticWheelEvent<>,
  pageHeight: number,
  key: 'deltaY' | 'deltaX'
): CssPixels {
  const delta = key === 'deltaY' ? event.deltaY : event.deltaX;
  switch (event.deltaMode) {
    case DOM_DELTA_PAGE:
      return delta * pageHeight;
    case DOM_DELTA_LINE:
      return delta * SCROLL_LINE_SIZE;
    default:
  }
  // Scroll by pixel.
  return delta;
}