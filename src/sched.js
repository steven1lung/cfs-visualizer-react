export class Sched {
  constructor(
    arrival,
    burst,
    nice,
    exec_start,
    sum_exec_runtime,
    vruntime,
    timeslice,
    on_rq
  ) {
    this.arrival_time = parseInt(arrival);
    this.burst_time = parseInt(burst);
    this.nice = parseInt(nice);
    this.exec_start = exec_start ? exec_start : 0;
    this.sum_exec_runtime = sum_exec_runtime ? sum_exec_runtime : 0;
    this.vruntime = vruntime ? vruntime : 0;
    this.timeslice = timeslice ? timeslice : 0;
    this.on_rq = on_rq ? on_rq : false;
  }
}

export const sched_prio_to_weight = [
  88761, 71755, 56483, 46273, 36291, 29154, 23254, 18705, 14949, 11916, 9548,
  7620, 6100, 4904, 3906, 3121, 2501, 1991, 1586, 1277, 1024, 820, 655, 526,
  423, 335, 272, 215, 172, 137, 110, 87, 70, 56, 45, 36, 29, 23, 18, 15,
];
