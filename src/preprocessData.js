export default function preprocessData(rawData) {
  const processedData = [];

  const metadata = {
    high: {
      hasUncommittedWork: false,
      previousStartTime: null,
      previousStopTime: null,
    },
    normal: {
      hasUncommittedWork: false,
      previousStartTime: null,
      previousStopTime: null,
    },
    low: {
      hasUncommittedWork: false,
      previousStartTime: null,
      previousStopTime: null,
    },
    unscheduled: {
      hasUncommittedWork: false,
      previousStartTime: null,
      previousStopTime: null,
    },
  };

  let currentPriority = null;
  let functionCallStackDepth = 0;

  // Data is sorted by time so, so the first entry always marks the start of our session.
  let firstTime = rawData[0].ts;

  for (let i = 0; i < rawData.length; i++) {
    const currentEvent = rawData[i];

    const currentMetadata = metadata[currentPriority || 'unscheduled'];
    if (!currentMetadata) {
      console.warn('Unexpected priority', currentPriority);
    }

    const { cat, name, ph, ts } = currentEvent;

    const timestamp = Math.round((ts - firstTime) / 1000);

    // TODO Combine yields/starts that are closer than some threshold with the previous event to reduce renders.

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
              processedData.push({
                type: 'render-idle',
                priority: currentPriority,
                timestamp: currentMetadata.previousStopTime,
                duration: timestamp - currentMetadata.previousStopTime,
              });
            }

            currentMetadata.hasUncommittedWork = true;
            currentMetadata.previousStartTime = timestamp;
            currentMetadata.previousStopTime = null;

          } else if (name === '--render-stop') {
            if (currentMetadata.previousStartTime === null) {
              console.warn('unexpected render stop');
            } else {
              processedData.push({
                type: 'render-work',
                priority: currentPriority,
                timestamp: currentMetadata.previousStartTime,
                duration: timestamp - currentMetadata.previousStartTime,
              });
            }

            currentMetadata.previousStartTime = null;
            currentMetadata.previousStopTime = timestamp;

          } else if (name === '--render-yield') {
            if (currentMetadata.previousStartTime === null) {
              console.warn('unexpected render stop');
            } else {
              processedData.push({
                type: 'render-work',
                priority: currentPriority,
                timestamp: currentMetadata.previousStartTime,
                duration: timestamp - currentMetadata.previousStartTime
              });
            }

            currentMetadata.previousStartTime = null;
            currentMetadata.previousStopTime = timestamp;

          } else if (name === '--render-cancel') {
            if (currentMetadata.previousStartTime === null) {
              console.warn('unexpected render stop');
            } else {
              processedData.push({
                type: 'render-work',
                priority: currentPriority,
                timestamp: currentMetadata.previousStartTime,
                duration: timestamp - currentMetadata.previousStartTime
              });
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
              processedData.push({
                type: 'commit-work',
                priority: currentPriority,
                timestamp: currentMetadata.previousStartTime,
                duration: timestamp - currentMetadata.previousStartTime,
              });
            }

            currentMetadata.hasUncommittedWork = false;
            currentMetadata.previousStartTime = null;
            currentMetadata.previousStopTime = null;

          } else if (name.startsWith('--suspend-')) {
            // TODO

          } else if (name.startsWith('--schedule-render')) {
            processedData.push({
              type: 'schedule-render',
              priority: currentPriority,
              timestamp,
            });

          } else if (name.startsWith('--schedule-state-update-')) {
            processedData.push({
              type: 'schedule-state-update',
              priority: currentPriority,
              timestamp,
              componentStack: name.substr(24)
            });
          }
        }
        break;
      case "B": // Begin
        if (name === "FunctionCall") {
          functionCallStackDepth++;
        }
        break;
      case "E": // End
        if (name === "FunctionCall") {
          if (functionCallStackDepth === 0) {
            console.warn('unexpected "FunctionCall" end');
          }
          functionCallStackDepth--;
          if (functionCallStackDepth === 0) {
            // TODO
          }
        }
        break;
      default:
        break;
    }
  }

  return processedData;
}