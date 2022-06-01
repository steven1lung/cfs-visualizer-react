export class Sched {
  constructor(
    arrival,
    burst,
    nice,
    exec_start,
    sum_exec_runtime,
    vruntime,
    timeslice
  ) {
    this.arrival_time = parseInt(arrival);
    this.burst_time = parseInt(burst);
    this.nice = parseInt(nice);
    this.exec_start = exec_start ? exec_start : 0;
    this.sum_exec_runtime = sum_exec_runtime ? sum_exec_runtime : 0;
    this.vruntime = vruntime ? vruntime : 0;
    this.timeslice = timeslice ? timeslice : 0;
  }
}
