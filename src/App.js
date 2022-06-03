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
var sched_flag = false;
var update_flag = false;
var finish_flag = false;
var results = "";
var task_seq = "";
var startSimulate = false;
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
  const [rbtProps, setRbtProps] = useState(new RBTree());
  const [showResult, setShowResult] = useState("");
  const resultRef = useRef();
  const handleSimulate = () => {
    startSimulate = true;
    data_init();

    //parse input
    const input = document.getElementById("tasks").value;
    const ary = input.split("\n");

    var n = parseInt(ary[0]);
    num = n;
    n = 1;

    //add create timequeue with arrival time
    while (n <= num) {
      var tmp = ary[n].split(" ");
      const sched = new Sched(tmp[1], tmp[2], tmp[3]);
      var tmpary = timequeue.get(parseInt(tmp[1]));
      if (!tmpary) tmpary = [tmp[0]];
      else tmpary.push(tmp[0]);
      timequeue.set(parseInt(tmp[1]), tmpary);
      tasks.set(tmp[0], sched);
      n++;
    }

    //scroll to red black tree
    setTimeout(() => {
      window.scrollTo({
        top: document.getElementById("RB-Tree").offsetTop,
        behavior: "smooth",
      });
    }, 100);
  };

  const handleNext = () => {
    if (!startSimulate) {
      alert("Please define the tasks first");
      return;
    }
    if (finish_flag) return;
    clock++;
    results += `CPU Time: ${clock}\n`;
    console.log("CPU Time : ", clock);
    if (clock === 0) {
      print_init();
      return;
    }

    sched_tick(); //update schedule enitities that are on runqueue

    //get tasks that arrive at current clock
    var cur = timequeue.get(clock);
    // console.log(tasks);
    if (cur) {
      for (var i of cur) {
        rbt.insert(i, tasks.get(i).vruntime);
      }
      // treeRef.current.forceUpdate();
      // console.log("tasks: ", tasks);
      update_flag = true;
    }
    if (current_task == "") sched_flag = true;
    if (update_flag) {
      update_slice_all(); //update schedule enitities that added to runqueue
    }
    if (sched_flag) schedule();

    if (finish_flag) {
      write_finishe_buffer();
    } else {
      write_buffer();
    }

    function write_finishe_buffer() {
      results += `Finish scheduling simulate\n`;
      console.log("Finish scheduling simulate");
      task_seq += "]\n";
      results += task_seq;
      setShowResult(results);
      setTimeout(() => {
        window.scrollTo({
          top: document.getElementById("results").offsetTop,
          behavior: "smooth",
        });
      }, 100);
    }

    function write_buffer() {
      results += `current running task: ${current_task}\n\n\n`;
      console.log("rbt: ");
      console.log(rbt.root);
      console.log("tasks data: ");
      console.log(tasks);
      console.log("current task: ", current_task);
      console.log("\n\n");
      task_seq += `${current_task} `;
      sched_flag = false;
      update_flag = false;
    }
  };

  function data_init() {
    rbt = new RBTree();
    tasks = new Map();
    timequeue = new Map();
    sched_flag = false;
    update_flag = false;
    finish_flag = false;
    clock = -1;
    current_task = "";
    results = "";
    task_seq = "\n[ ";
    setShowResult("");
  }

  function update_slice_all() {
    for (const [key, se] of tasks) {
      // console.log("update ", key, se);
      if (se.arrival_time > clock) continue;
      update_slice(key);
    }
  }

  function update_slice(key) {
    var timeslice = calc_slice(key);
    var se = tasks.get(key);
    tasks.set(
      key,
      new Sched(
        se.arrival_time,
        se.burst_time,
        se.nice,
        se.exec_start,
        se.sum_exec_runtime,
        se.vruntime,
        timeslice,
        true
      )
    );
    tasks.set(key, tasks.get(key));
  }

  function sched_tick() {
    if (current_task === "") return;

    //update exec runtime
    update_exec(current_task);
    var se = tasks.get(current_task);

    if (se.sum_exec_runtime >= se.burst_time) {
      //finish execute
      results += `${current_task} has finished execution\n`;
      console.log(current_task, " has finished execution");
      tasks.delete(current_task);
      current_task = "";
      sched_flag = true;
    } else if (clock - se.exec_start >= se.timeslice) {
      //ran out of timeslice
      results += `${current_task} has finished its timeslice of ${se.timeslice}\n`;
      console.log(current_task, " has finished timeslice");
      update_vruntime(current_task);
      current_task = "";
      sched_flag = true;
    }
  }

  function update_vruntime(key) {
    var vruntime = calc_vruntime(key);
    results += `Update ${key}'s vruntime to: ${vruntime}\n`;
    console.log("Update ", key, "'s vruntime to : ", vruntime);
    var se = tasks.get(key);
    tasks.set(
      key,
      new Sched(
        se.arrival_time,
        se.burst_time,
        se.nice,
        se.exec_start,
        se.sum_exec_runtime,
        vruntime,
        se.timeslice,
        se.on_rq
      )
    );
    rbt.insert(key, vruntime);
  }

  function update_exec(key) {
    var se = tasks.get(key);

    tasks.set(
      key,
      new Sched(
        se.arrival_time,
        se.burst_time,
        se.nice,
        se.exec_start,
        se.sum_exec_runtime + 1,
        se.vruntime,
        se.timeslice,
        se.on_rq
      )
    );
    // tasks.set(key, tasks.get(key));
  }

  function schedule() {
    var min = rbt.get_min(rbt.root); //get smallest vruntime from rbt
    if (!min) {
      finish_flag = true;
      return;
    }
    var se = tasks.get(min.key); //get schedule entity that has smallest vruntime

    if (se.sum_exec_runtime == 0) update_slice_init(min.key);
    else update_slice(min.key);

    results += `${min.key} has the smallest vruntime: ${se.vruntime}\n`;
    console.log(min.key, " has the smallest vruntime: ", se.vruntime);

    se = tasks.get(min.key); //get updated schedule entity
    rbt.remove(); //remove schedule entity from rbt
    current_task = min.key;
  }

  function update_slice_init(key) {
    var timeslice = calc_slice(key);
    var se = tasks.get(key);
    tasks.set(
      key,
      new Sched(
        se.arrival_time,
        se.burst_time,
        se.nice,
        clock,
        0,
        0,
        timeslice,
        true
      )
    );
    tasks.set(key, tasks.get(key));
  }

  function get_nice(nice) {
    return sched_prio_to_weight[nice + 20];
  }

  function calc_vruntime(key) {
    var vruntime = 0;
    var se = tasks.get(key); //schedule entity
    var weight = get_nice(se.nice);
    var delta_exec = clock - se.exec_start;
    vruntime = se.vruntime + get_nice(0) * (delta_exec / weight);
    return vruntime;
  }

  function calc_slice(key) {
    var timeslice = 0;
    var target_latency = Math.max(num * sched_min_granularity, sched_latency);
    var se = tasks.get(key); //schedule entity
    var weight = get_nice(se.nice);
    var total_weight = 0;
    for (const i of tasks.values()) {
      if (i.arrival_time > clock) continue;
      total_weight += get_nice(i.nice);
    }
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

    results += `Scheduler Init\n`;
    results += `Constants are listed below: \n`;
    results += `sched_latency: ${sched_latency}\n`;
    results += `sched_min_granularity: ${sched_min_granularity}\n`;
    results += `sched_wakeup_granularity: ${sched_wakeup_granularity}\n\n\n`;
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

        <div>
          <p>Rules: </p>
          <p>
            1. First line defines{" "}
            <a className="enlarge-text">the total number of tasks</a>
          </p>
          <p>
            2. Then each line defines the tasks in the order of:{" "}
            <a className="enlarge-text">task name</a>,{" "}
            <a className="enlarge-text">arrival time</a>,{" "}
            <a className="enlarge-text">burst time</a>,{" "}
            <a className="enlarge-text">nice value</a>
          </p>
        </div>
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
        <textarea
          readOnly
          className="card2"
          defaultValue={showResult}
        ></textarea>
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
