const componentStackA = `in List (at App.js:14)
in App (at src/index.js:7`;

const data = [
  {
    type: "start",
    timestamp: 1,
    priority: "normal",
  },
  {
    type: "suspended",
    timestamp: 12,
    priority: "normal",
    componentStack: componentStackA,
  },
  {
    type: "suspended",
    timestamp: 14,
    priority: "normal",
    componentStack: componentStackA,
  },
  {
    type: "yield",
    timestamp: 15,
    priority: "normal",
  },
  // TODO Add "retry" event for resolved suspense promise
  // TODO Add "retry" event for resolved suspense promise
  {
    type: "start",
    timestamp: 16,
    priority: "low",
  },
  {
    type: "yield",
    timestamp: 26,
    priority: "low",
  },
  {
    type: "resume",
    timestamp: 27,
    priority: "low",
  },
  {
    type: "yield",
    timestamp: 35,
    priority: "low",
  },
  {
    type: "resume",
    timestamp: 36,
    priority: "normal",
  },
  {
    type: "yield",
    timestamp: 52,
    priority: "normal",
  },
  {
    type: "resume",
    timestamp: 53,
    priority: "normal",
  },
  {
    type: "finish",
    timestamp: 63,
    priority: "normal",
  },
  {
    type: "work-scheduled",
    timestamp: 63,
    priority: "high",
    componentStack: componentStackA,
  },
  // TODO Flag this work as a deopt?
  {
    type: "start",
    timestamp: 63,
    priority: "high",
    didDeopt: true,
  },
  {
    type: "finish",
    timestamp: 66,
    priority: "high",
  },
  // TODO "commit" with duration
  {
    type: "resume",
    timestamp: 67,
    priority: "low",
  },
  {
    type: "yield",
    timestamp: 77,
    priority: "low",
  },
  {
    type: "work-scheduled",
    timestamp: 81,
    priority: "high",
    componentStack: componentStackA,
  },
  {
    type: "work-scheduled",
    timestamp: 81,
    priority: "normal",
    componentStack: componentStackA,
  },
  {
    type: "start",
    timestamp: 81,
    priority: "high",
  },
  {
    type: "finish",
    timestamp: 93,
    priority: "high",
  },
  // TODO "commit" with duration
  {
    type: "start",
    timestamp: 94,
    priority: "normal",
  },
  {
    type: "finish",
    timestamp: 102,
    priority: "normal",
  },
  // TODO "commit" with duration
  {
    type: "resume",
    timestamp: 103,
    priority: "low",
  },
  {
    type: "finish",
    timestamp: 108,
    priority: "low",
  },
  // TODO "commit" with duration
]

export default data;