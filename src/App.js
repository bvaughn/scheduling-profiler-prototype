import React, { useState } from 'react';
import { Checkbox, Slider, InputNumber, Row, Col } from 'antd';
import Blocking from './Blocking';
import EventScheduled from './EventScheduled';
import EventSuspended from './EventSuspended';
import MarkerLabels from './MarkerLabels';
import Work from './Work';
import Thread from './Thread';
import styles from './App.module.css';
import data from './data';

function App() {
  const [multiplier, setMultiplier] = useState(() => {
    const style = getComputedStyle(document.body);
    return parseFloat(style.getPropertyValue('--multiplier'));
  });

  const handleChange = value => {
    setMultiplier(value);

    document.documentElement.style.setProperty('--multiplier', value);
  };

  const [connectBlockedWork, setConnectBlockedWork] = useState(true);

  const children = {
    high: [],
    normal: [],
    low: [],
  };

  const previousData = {
    high: [],
    normal: [],
    low: [],
  };

  for (let i = 0; i < data.length; i++) {
    const current = data[i];

    let child = null;
    let previous = null;

    switch (current.type) {
      case 'resume':
      case 'start':
        previous = previousData[current.priority];
        if (connectBlockedWork && previous !== null) {
          child = (
            <Blocking
              key={i}
              startTime={previous.timestamp}
              stopTime={current.timestamp}
            />
          );
        }
        previousData[current.priority] = current;
        break;
      case 'finish':
      case 'yield':
        previous = previousData[current.priority];
        child = (
          <Work
            didDeopt={previous.didDeopt}
            didResume={previous.type === 'resume'}
            didYield={current.type === 'yield'}
            key={i}
            startTime={previous.timestamp}
            stopTime={current.timestamp}
            showYieldStyle={!connectBlockedWork}
          />
        );
        previousData[current.priority] = current.type === 'yield' ? current : null;
        break;
      case 'suspended':
        child = (
          <EventSuspended
            componentStack={current.componentStack}
            key={i}
            timestamp={current.timestamp}
          />
        );
        break;
      case 'work-scheduled':
        child = (
          <EventScheduled
            componentStack={current.componentStack}
            key={i}
            timestamp={current.timestamp}
          />
        );
        break;
      default:
        console.warn('You messed up, Brian:', current);
        break;
    }

    if (child !== null) {
      children[current.priority].push(child);
    }
  }

  return (
    <div className={styles.App}>
      <Row type="flex" align="middle">
        <Col span={3}>
          <Checkbox
            onChange={event => setConnectBlockedWork(event.target.checked)}
            checked={connectBlockedWork}
          >
            Show blocks
          </Checkbox>
        </Col>
        <Col span={1} align="end">
          Zoom
        </Col>
        <Col span={4}>
          <Slider
            min={1}
            max={20}
            step={0.01}
            onChange={handleChange}
            value={multiplier}
          />
        </Col>
        <Col span={4}>
          <InputNumber
            min={1}
            max={20}
            value={multiplier}
            onChange={handleChange}
          />
        </Col>
      </Row>

      <MarkerLabels />

      <Thread priorityLabel="High">
        {children.high}
      </Thread>
      <Thread priorityLabel="Normal">
        {children.normal}
      </Thread>
      <Thread priorityLabel="Low">
        {children.low}
      </Thread>
    </div>
  );
}

export default App;
