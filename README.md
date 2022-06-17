# Linux CFS Visualizer

This project is to visualize the linux kernel Completely Fair Scheduler. Including the data structure used to store the tasks: a red black tree.

The website is availabe at : https://steven1lung.github.io/cfs-visualizer-react/

## Input format

```
3 10
A 1 3 0
B 2 4 -2
C 2 3 2
```

The fisrt line defines that there are 3 tasks and the total runtime is 10. Then each line describes the tasks in the order of: task name, arrival time, burst time, nice value.

So the second line would define a task naming 'A', would arrive at clock=1, has to run for 3 clocks, and its nice value is 0.

## CFS

CFS introduces virtual runtime to the the scheduling method, which rescribes how much time the task has been running on an 'ideal' machine. So every time a schedule needs to be triggered, the scheduler tends to pick the task whose virtual runtime is the least. Which means to pick the task that the running time on an ideal machine is the least so fa.

### Scheduling Parameters

1. `sched_latency`
   > The latency of the scheduler, the default would be 6.
2. `sched_min_granularity`
   > The minimum time a task should run. Default would be 0.75.
3. `target_latency`
   > Ensures every task to be executed once, so the value would be `max(n * sched_min_granularity, sched_latency)`.

### Creating a task

There are some variables needed to create a task:

1. Arrival time
2. Burst time
3. Nice value (-20 ~ +19)

The created task would be inserted to the red black tree when the task arrives.

### When a schedule happens

1. The task with the smallest `vruntime` is picked.
2. The chosen task would be removed from the red black tree.
3. The task would be given a timeslice: `timesclice = target_latency * (task_weight / total_weight)`.

### When a task is being executed

1. Update its total runtime which is `sum_exec_runtime`.
2. Update its virtual runtime.

#### A brief of Linux scheduler can be found here: https://hackmd.io/@steven1lung/scheduler_notes

#### References

https://elixir.free-electrons.com/linux/v5.10/source/include/linux/sched.h

https://developer.ibm.com/tutorials/l-completely-fair-scheduler/

https://github.com/nihal111/CFS-visualizer
