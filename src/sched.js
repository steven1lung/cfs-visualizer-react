export class Sched {
  constructor(arrival, burst, nice) {
    this.arrival_time = parseInt(arrival);
    this.burst_time = parseInt(burst);
    this.nice = parseInt(nice);
    this.exec_start = 0;
    this.sum_exec_runtime = 0;
    this.vruntime = 0;
    this.timeslice = 0;
  }
}
