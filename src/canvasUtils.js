import memoize from 'memoize-one';

// hidpi canvas: https://www.html5rocks.com/en/tutorials/canvas/hidpi/
export function configureRetinaCanvas(canvas) {
  // Get the device pixel ratio, falling back to 1.
  const dpr = window.devicePixelRatio || 1;
  // Get the size of the canvas in CSS pixels.
  const rect = canvas.getBoundingClientRect();
  // Give the canvas pixel dimensions of their CSS
  // size * the device pixel ratio.
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  canvas.style.width = `${rect.width}px`;
  canvas.style.height = `${rect.height}px`;
  return dpr;
}

export const getCanvasContext = memoize((canvas, scaleCanvas = false) => {
  const context = canvas.getContext('2d', { alpha: false} );
  if (scaleCanvas) {
    const dpr = configureRetinaCanvas(canvas);
    // Scale all drawing operations by the dpr, so you don't have to worry about the difference.
    context.scale(dpr, dpr);
  }
  return context;
});

export function getCanvasMousePos(canvas, mouseEvent) {
  const rect =
    canvas instanceof HTMLCanvasElement
      ? canvas.getBoundingClientRect()
      : {left: 0, top: 0};
  const canvasMouseX = mouseEvent.clientX - rect.left;
  const canvasMouseY = mouseEvent.clientY - rect.top;

  return {canvasMouseX, canvasMouseY};
}