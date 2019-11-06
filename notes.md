* User timings API for scheduler start/stop at priority
  Currently it uses a call stack (logEvent) but we could feature flag switch for performance.now()
  Gap between markSchedulerSuspended and markSchedulerUnsuspended is unscheduled JS ("Main thread")
* User timings API for root events too
* Show React vs non-React for each priority
* DevTools starts/stops scheduler profiling mode
* Open question: Is performance.mark() fast enough?
* Open question: Can performance.mark() hold a serialized component stack?
* Unsupported: Multi-root (interleaved)
* How can we detect that a root is throwing away work without committing? checkForInterruption()
  But we'd also need to compare roots (it's not currently comparing wIPR to root)

---------------

Types of events:
* Root start (or resume) work
* Root suspend (with a retry timer)
* Root commits
* An update was scheduled (e.g. setState) by component X (displayName? component stack?)

Event attributes:
* Root (mapped to ID)
* Timestamp
* Type
* Priority (thread ID)

Open questions:
* Q: Does it make sense to show state updates at their target priority?
* Q: How many priorities do we want to show to the user and how should we label them?
* Q: If you clicked on a work chunk, would it be worthwhile to highlight all of the related chunks that were part of that commit?
     (This would require us to add an explicit event for when we discarded without committing)
* Q: Should state updates be shown inline (at thread/priority) or in their own separate area?
* Q: How will this work for multi-root apps?
  A: Only show one root at a time. Switch between using a drop-down selector like in Profiler.

# Start working on a root (maybe start, maybe resume)
```
{
  type: "start" | "resume",
  timestamp: number,
  priority: PriorityID,
  didDeopt: boolean,
}
```

# Stop working on a root (maybe yielding for time slicing, maybe for suspense)
```
{
  type: "finish" | "yield",
  timestamp: number,
  priority: PriorityID,
}
```

# Commit a mutation
{
  type: "commit",
  timestamp: number,
  duration: number,
  priority: PriorityID,
}

# A component suspended during render or suspended Promise has resolved
```
{
  type: "suspended" | "retry",
  timestamp: number,
  priority: PriorityID,
  componentStack: string,
}
```

# A component scheduled work (e.g. state update)
```
{
  type: "work-scheduled",
  timestamp: number,
  priority: PriorityID,
  componentStack: string,
}
```