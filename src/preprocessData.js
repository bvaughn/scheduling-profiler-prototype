export default function preprocessData(rawData) {
  const processedData = {
    duration: 0,
    high: {
      react: [],
      other: [],
    },
    normal: {
      react: [],
      other: [],
    },
    low: {
      react: [],
      other: [],
    },
    unscheduled: {
      react: [],
      other: [],
    },
  };

  const metadata = {
    high: {
      functionCallStartTime: null,
      functionCallStackDepth: 0,
      hasUncommittedWork: false,
      previousStartTime: null,
      previousStopTime: null,
    },
    normal: {
      functionCallStartTime: null,
      functionCallStackDepth: 0,
      hasUncommittedWork: false,
      previousStartTime: null,
      previousStopTime: null,
    },
    low: {
      functionCallStartTime: null,
      functionCallStackDepth: 0,
      hasUncommittedWork: false,
      previousStartTime: null,
      previousStopTime: null,
    },
    unscheduled: {
      functionCallStartTime: null,
      functionCallStackDepth: 0,
      hasUncommittedWork: false,
      previousStartTime: null,
      previousStopTime: null,
    },
  };

  let currentPriority = null;

  // Data is sorted by time so, so the first entry always marks the start of our session.
  let firstTime = rawData[0].ts;

  for (let i = 0; i < rawData.length; i++) {
    const currentEvent = rawData[i];

    const currentMetadata = metadata[currentPriority || 'unscheduled'];
    if (!currentMetadata) {
      console.warn('Unexpected priority', currentPriority);
    }

    let currentProcessedGroup = processedData[currentPriority || 'unscheduled'];
    if (!currentProcessedGroup) {
      console.warn('Unexpected priority', currentPriority);
    }

    const { cat, name, ph, ts } = currentEvent;

    const timestamp = Math.round((ts - firstTime) / 1000);

    // TODO Combine yields/starts that are closer than some threshold with the previous event to reduce renders.

    // TODO Make second pass over data to determine when JS is executing that isn't React.
    // The easiest way to do this may be to gather both the React ranges and the JS ranges in the first past,
    // and then subtract the React ranges from the JS ranges during a second pass...

    switch (ph) {
      case "R":
        if (cat === "blink.user_timing") {
          if (name.startsWith('--scheduler-start-')) {
            if (currentPriority !== null) {
              console.warn('unexpected scheduler start:', name, 'with current priority:', currentPriority);
            }

            currentPriority = name.substr(18);

          } else if (name.startsWith('--scheduler-stop-')) {
            if (
              currentPriority === null ||
              currentPriority !== name.substr(17)
            ) {
              console.warn('unexpected scheduler stop:', name, 'with current priority:', currentPriority);
            }

            currentPriority = null;

          } else if (name === '--render-start') {
            if (currentMetadata.previousStartTime !== null) {
              console.warn('unexpected render start');
            }

            if (currentMetadata.hasUncommittedWork && currentMetadata.previousStopTime !== null) {
              currentProcessedGroup.react.push({
                type: 'render-idle',
                priority: currentPriority,
                timestamp: currentMetadata.previousStopTime,
                duration: timestamp - currentMetadata.previousStopTime,
              });

              processedData.duration = Math.max(processedData.duration, timestamp);
            }

            currentMetadata.hasUncommittedWork = true;
            currentMetadata.previousStartTime = timestamp;
            currentMetadata.previousStopTime = null;

          } else if (name === '--render-stop') {
            if (currentMetadata.previousStartTime === null) {
              console.warn('unexpected render stop');
            } else {
              currentProcessedGroup.react.push({
                type: 'render-work',
                priority: currentPriority,
                timestamp: currentMetadata.previousStartTime,
                duration: timestamp - currentMetadata.previousStartTime,
              });

              processedData.duration = Math.max(processedData.duration, timestamp);
            }

            currentMetadata.previousStartTime = null;
            currentMetadata.previousStopTime = timestamp;

          } else if (name === '--render-yield') {
            if (currentMetadata.previousStartTime === null) {
              console.warn('unexpected render stop');
            } else {
              currentProcessedGroup.react.push({
                type: 'render-work',
                priority: currentPriority,
                timestamp: currentMetadata.previousStartTime,
                duration: timestamp - currentMetadata.previousStartTime
              });

              processedData.duration = Math.max(processedData.duration, timestamp);
            }

            currentMetadata.previousStartTime = null;
            currentMetadata.previousStopTime = timestamp;

          } else if (name === '--render-cancel') {
            if (currentMetadata.previousStartTime === null) {
              console.warn('unexpected render stop');
            } else {
              currentProcessedGroup.react.push({
                type: 'render-work',
                priority: currentPriority,
                timestamp: currentMetadata.previousStartTime,
                duration: timestamp - currentMetadata.previousStartTime
              });

              processedData.duration = Math.max(processedData.duration, timestamp);
            }

            currentMetadata.hasUncommittedWork = false;
            currentMetadata.previousStartTime = null;
            currentMetadata.previousStopTime = null;

          } else if (name === '--commit-start') {
            if (currentMetadata.previousStartTime !== null) {
              console.warn('unexpected commit start');
            }

            currentMetadata.previousStartTime = timestamp;

          } else if (name === '--commit-stop') {
            if (currentMetadata.previousStartTime === null) {
              console.warn('unexpected commit stop');
            } else {
              currentProcessedGroup.react.push({
                type: 'commit-work',
                priority: currentPriority,
                timestamp: currentMetadata.previousStartTime,
                duration: timestamp - currentMetadata.previousStartTime,
              });

              processedData.duration = Math.max(processedData.duration, timestamp);
            }

            currentMetadata.hasUncommittedWork = false;
            currentMetadata.previousStartTime = null;
            currentMetadata.previousStopTime = null;

          } else if (name.startsWith('--suspend-')) {
            // TODO

          } else if (name.startsWith('--schedule-render')) {
            currentProcessedGroup.react.push({
              type: 'schedule-render',
              priority: currentPriority,
              timestamp,
            });

            processedData.duration = Math.max(processedData.duration, timestamp);

          } else if (name.startsWith('--schedule-state-update-')) {
            currentProcessedGroup.react.push({
              type: 'schedule-state-update',
              priority: currentPriority,
              timestamp,
              componentStack: name.substr(24)
            });

            processedData.duration = Math.max(processedData.duration, timestamp);
          }
        }
        break;
      case "B": // Begin
        if (name === "FunctionCall") {
          // TODO This is a flawed approach.
          // FunctionCalls will always be made before/after React starts rendering.
          if (currentMetadata.previousStartTime === null) {
            currentMetadata.functionCallStackDepth++;

            if (currentMetadata.functionCallStackDepth === 1) {
              currentMetadata.functionCallStartTime = timestamp;
            }
          }
        }
        break;
      case "E": // End
        if (name === "FunctionCall") {
          if (currentMetadata.previousStartTime === null) {
            if (currentMetadata.functionCallStackDepth === 0) {
              console.warn('unexpected "FunctionCall" end');
            }
            currentMetadata.functionCallStackDepth--;

            // TODO This is a flawed approach.
            // FunctionCalls will always be made before/after React starts rendering.
            if (currentMetadata.functionCallStackDepth === 0) {
              currentProcessedGroup.other.push({
                type: 'non-react-function-call',
                priority: currentPriority,
                timestamp,
                duration: timestamp - currentMetadata.functionCallStartTime,
              });

              processedData.duration = Math.max(processedData.duration, timestamp);
            }
          }
        }
        break;
      default:
        break;
    }
  }

  return processedData;
}