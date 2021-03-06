// @flow

import prettyMilliseconds from 'pretty-ms';
import React, { Fragment, useLayoutEffect, useRef } from 'react';
import { COLORS } from './constants';
import { getBatchRange } from './utils';
import useSmartTooltip from './useSmartTooltip';
import styles from './EventTooltip.css';

const TOOLTIP_OFFSET = 4;

export default function EventTooltip({ data, hoveredEvent, state }) {
  const { canvasMouseY, canvasMouseX } = state;

  const tooltipRef = useSmartTooltip({
    mouseX: canvasMouseX,
    mouseY: canvasMouseY,
  });

  if (hoveredEvent === null) {
    return null;
  }

  const { event, flamechartNode, measure } = hoveredEvent;

  if (event !== null) {
    switch (event.type) {
      case 'schedule-render':
        return (
          <TooltipReactEvent
            color={COLORS.REACT_SCHEDULE_HOVER}
            data={data}
            event={event}
            tooltipRef={tooltipRef}
          />
        );
      case 'schedule-state-update': // eslint-disable-line no-case-declarations
        const color = event.isCascading
          ? COLORS.REACT_SCHEDULE_CASCADING_HOVER
          : COLORS.REACT_SCHEDULE_HOVER;
        return (
          <TooltipReactEvent
            color={color}
            data={data}
            event={event}
            tooltipRef={tooltipRef}
          />
        );
      case 'suspend':
        return (
          <TooltipReactEvent
            color={COLORS.REACT_SUSPEND_HOVER}
            data={data}
            event={event}
            tooltipRef={tooltipRef}
          />
        );
      default:
        console.warn(`Unexpected event type "${event.type}"`);
        break;
    }
  } else if (measure !== null) {
    switch (measure.type) {
      case 'commit':
      case 'render-idle':
      case 'render':
      case 'layout-effects':
      case 'passive-effects':
        return (
          <TooltipReactMeasure
            data={data}
            measure={measure}
            tooltipRef={tooltipRef}
          />
        );
      default:
        console.warn(`Unexpected measure type "${measure.type}"`);
        break;
    }
  } else if (flamechartNode !== null) {
    return (
      <TooltipFlamechartNode
        data={data}
        flamechartNode={flamechartNode}
        tooltipRef={tooltipRef}
      />
    );
  } else {
    return null;
  }
}

function formatComponentStack(componentStack) {
  if (componentStack == null) {
    return null;
  }

  const lines = componentStack.split('\n').map(line => line.trim());
  lines.shift();

  if (lines.length > 5) {
    return lines.slice(0, 5).join('\n') + '\n...';
  }
  return lines.join('\n');
}

const TooltipFlamechartNode = ({ data, flamechartNode, tooltipRef }) => {
  const { end, node, start } = flamechartNode;
  const { name, file } = node.frame;
  return (
    <div
      className={styles.Tooltip}
      style={{
        backgroundColor: COLORS.TOOLTIP_BG,
        color: COLORS.TOOLTIP,
      }}
      ref={tooltipRef}
    >
      {prettyMilliseconds((end - start) / 1000)} {name}
      <div className={styles.DetailsGrid}>
        <div className={styles.DetailsGridLabel}>Script URL:</div>
        {file}
      </div>
    </div>
  );
};

const TooltipReactEvent = ({ color, data, event, tooltipRef }) => {
  const { componentName, componentStack, timestamp, type } = event;

  let label = null;
  switch (type) {
    case 'schedule-render':
      label = 'render scheduled';
      break;
    case 'schedule-state-update':
      label = 'state update scheduled';
      break;
    case 'suspend':
      label = 'suspended';
      break;
    default:
      break;
  }

  return (
    <div
      className={styles.Tooltip}
      style={{
        backgroundColor: COLORS.TOOLTIP_BG,
        color: COLORS.TOOLTIP,
      }}
      ref={tooltipRef}
    >
      {componentName && (
        <span className={styles.ComponentName} style={{ color }}>
          {componentName}
        </span>
      )}{' '}
      {label}
      <div className={styles.Divider} />
      <div className={styles.DetailsGrid}>
        <div className={styles.DetailsGridLabel}>Timestamp:</div>
        {prettyMilliseconds(timestamp)}
        {componentStack && (
          <Fragment>
            <div className={styles.DetailsGridLabel}>Component stack:</div>
            <pre className={styles.ComponentStack}>
              {formatComponentStack(componentStack)}
            </pre>
          </Fragment>
        )}
      </div>
    </div>
  );
};

const TooltipReactMeasure = ({ data, measure, tooltipRef }) => {
  const { batchUID, duration, priority, timestamp, type } = measure;

  let label = null;
  switch (type) {
    case 'commit':
      label = 'commit';
      break;
    case 'render-idle':
      label = 'idle';
      break;
    case 'render':
      label = 'render';
      break;
    case 'layout-effects':
      label = 'layout effects';
      break;
    case 'passive-effects':
      label = 'passive effects';
      break;
    default:
      break;
  }

  const [startTime, stopTime] = getBatchRange(batchUID, priority, data);

  return (
    <div
      className={styles.Tooltip}
      style={{
        position: 'absolute',
        backgroundColor: COLORS.TOOLTIP_BG,
        color: COLORS.TOOLTIP,
      }}
      ref={tooltipRef}
    >
      {prettyMilliseconds(duration)} {label}
      <div className={styles.Divider} />
      <div className={styles.DetailsGrid}>
        <div className={styles.DetailsGridLabel}>Timestamp:</div>
        {prettyMilliseconds(timestamp)}
        <div className={styles.DetailsGridLabel}>Batch duration:</div>
        {prettyMilliseconds(stopTime - startTime)}
      </div>
    </div>
  );
};
