import React, { useState, useRef } from "react";
import "./styles/App.css";
import { RBTree } from "./rbt";
import { Sched } from "./sched";
import Tree from "./render";

var clock = -1;
var rbt = new RBTree();
var tasks = new Map();
var num;
var timequeue = new Map();
var readyqueue = new Map();
var sched_flag = false;

//scheduler variables
var current_task = "";
const sched_latency = 6;
const sched_min_granularity = 0.75;
const sched_wakeup_granularity = 1;
const sched_prio_to_weight = [
  88761, 71755, 56483, 46273, 36291, 29154, 23254, 18705, 14949, 11916, 9548,
  7620, 6100, 4904, 3906, 3121, 2501, 1991, 1586, 1277, 1024, 820, 655, 526,
  423, 335, 272, 215, 172, 137, 110, 87, 70, 56, 45, 36, 29, 23, 18, 15,
];

function App() {
  const [startSimulate, setStartSimulate] = useState(false);
  const [rbtProps, setRbtProps] = useState(new RBTree());

  const handleSimulate = () => {
    rbt = new RBTree();
    tasks = new Map();
    timequeue = new Map();
    const input = document.getElementById("tasks").value;
    //parse input
    const ary = input.split("\n");

    var n = parseInt(ary[0]);
    num = n;
    while (n > 0) {
      var tmp = ary[n].split(" ");
      const sched = new Sched(tmp[1], tmp[2], tmp[3]);
      var tmpary = timequeue.get(parseInt(tmp[1]));
      if (!tmpary) tmpary = [tmp[0]];
      else tmpary.push(tmp[0]);
      timequeue.set(parseInt(tmp[1]), tmpary);
      tasks.set(tmp[0], sched);
      n--;
    }

    //scroll to red black tree
    // setTimeout(() => {
    //   window.scrollTo({
    //     top: document.getElementById("RB-Tree").offsetTop,
    //     behavior: "smooth",
    //   });
    // }, 100);
  };
  const handleNext = () => {
    // rbt.printTree(rbt.root);
    // console.log(timequeue);
    clock++;
    console.log("CPU Time : ", clock);
    if (clock === 0) {
      print_init();
      return;
    }

    //tick
    sched_tick();

    //get tasks that arrive at current clock
    var cur = timequeue.get(clock);
    // console.log(tasks);
    if (cur) {
      for (var i of cur) {
        readyqueue.set(i, tasks.get(i));
        rbt.insert(i, tasks.get(i).vruntime);
      }
      // treeRef.current.forceUpdate();
      // console.log("readyqueue: ", readyqueue);
      sched_flag = true;
    }
    if (sched_flag == true) schedule();
    console.log("\n\n");
  };

  function sched_tick() {
    if (current_task === "") return;

    //update exec runtime
    update_exec(current_task);
    var se = readyqueue.get(current_task);
    console.log(se);
    if (se.timeslice <= 0) {
      //ran out of timeslice
      sched_flag = true;
    } else if (se.sum_exec_runtime >= se.burst_time) {
      //finish execute
      sched_flag = true;
    }
  }

  function update_exec(key) {
    console.log(readyqueue);
    var se = readyqueue.get(key);
    console.log(se);
    readyqueue.set(
      key,
      new Sched(
        se.arrival_time,
        se.burst_time - 1,
        se.nice,
        se.exec_start,
        clock - se.exec_start,
        0,
        se.timeslice - 1
      )
    );
    tasks.set(key, readyqueue.get(key));
  }

  function schedule() {
    var min = rbt.get_min(rbt.root); //get smallest vruntime from rbt
    var se = readyqueue.get(min.key); //get schedule entity that has smallest vruntime

    console.log(min.key, " has the smallest vruntime");

    update_slice(min.key); //update its timeslice and exec_start

    console.log(readyqueue.get(min.key));

    se = readyqueue.get(min.key); //get updated schedule entity
    rbt.remove(min.key, se.vruntime); //remove schedule entity from rbt

    current_task = min.key;
    console.log("current task: ", current_task);
  }

  function update_slice(key) {
    var timeslice = calc_slice(key);
    var se = readyqueue.get(key);
    readyqueue.set(
      key,
      new Sched(se.arrival_time, se.burst_time, se.nice, clock, 0, 0, timeslice)
    );
    tasks.set(key, readyqueue.get(key));
  }

  function get_nice(nice) {
    return sched_prio_to_weight[nice + 20];
  }

  function calc_vruntime(key) {
    var vruntime = 0;
    var se = readyqueue.get(key); //schedule entity
    var weight = get_nice(se.nice);
    var delta_exec = clock - se.exec_start;
    vruntime = se.vruntime + get_nice(0) * (delta_exec / weight);
    return vruntime;
  }

  function calc_slice(key) {
    var timeslice = 0;
    var target_latency = Math.max(num * sched_min_granularity, sched_latency);
    var se = readyqueue.get(key); //schedule entity
    var weight = get_nice(se.nice);
    var total_weight = 0;
    for (const i of readyqueue.values()) total_weight += get_nice(i.nice);
    timeslice = target_latency * (weight / total_weight);
    return timeslice;
  }

  function print_init() {
    console.log("Scheduler Init\n");
    console.log("Constants are listed below: \n");
    console.log("sched_latency: ", sched_latency);
    console.log("sched_min_granularity: ", sched_min_granularity);
    console.log("sched_wakeup_granularity: ", sched_wakeup_granularity);
    console.log("\n\n");
  }

  return (
    <div className="container">
      <main className="main">
        <h1 className="title">
          Welcome to{" "}
          <a href="https://www.kernel.org/doc/html/latest/scheduler/sched-design-CFS.html">
            CFS
          </a>{" "}
          Visualizer
        </h1>

        <p className="description">Get started by defining the tasks</p>

        <textarea
          type="text"
          id="tasks"
          name="tasks"
          className="card"
          defaultValue={"3\nA 1 3 0\nB 2 4 -2\nC 2 3 2"}
        ></textarea>
        <button onClick={handleSimulate}>Simulate</button>

        <p className="description" id="RB-Tree">
          RB-Tree
        </p>
        <div className="card2">
          <Tree />
          {/* {startSimulate && <rbt.Node_div num={num} />} */}
        </div>
        <button onClick={handleNext}>Next Clock</button>
        <p className="description" id="results">
          Results
        </p>
        <div className="card">Results of scheduling</div>
      </main>

      <footer className="footer">
        <a
          href="https://github.com/steven1lung"
          target="_blank"
          rel="noopener noreferrer"
        >
          Developed by steven1lung
        </a>
      </footer>
    </div>
  );
}

export default App;
