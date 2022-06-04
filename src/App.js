import React, { useState, useRef } from "react";
import "./styles/App.css";
import { RBTree } from "./rbt";
import { Sched } from "./sched";
import { options } from "./render";
import Graph from "react-graph-vis";
import { v4 as uuidv4 } from "uuid";
import cloneDeep from "lodash/cloneDeep";

var clock = 0;
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
var expected_runtime = 0;
var null_node_id = -1;
//scheduler variables
var current_task = "";
var current_show = "";
const sched_latency = 6;
const sched_min_granularity = 0.75;
const sched_wakeup_granularity = 1;
const sched_prio_to_weight = [
  88761, 71755, 56483, 46273, 36291, 29154, 23254, 18705, 14949, 11916, 9548,
  7620, 6100, 4904, 3906, 3121, 2501, 1991, 1586, 1277, 1024, 820, 655, 526,
  423, 335, 272, 215, 172, 137, 110, 87, 70, 56, 45, 36, 29, 23, 18, 15,
];

const graph = {
  nodes: [],
  edges: [],
};

function App() {
  const [showResult, setShowResult] = useState("");
  const [graphData, setGraphData] = useState(graph);
  const [clockShow, setClockShow] = useState(0);

  const generateGraph = (e) => {
    var newGraph = { nodes: [], edges: [] };
    dfs(rbt.root);
    console.log(newGraph);
    newGraph.edges.reverse();
    setGraphData(newGraph);

    function dfs(node) {
      if (!node) return;

      // console.log(node.key, " ", node.value);
      const newNode = {
        id: node.id,
        label: node.key,
        color: node.color ? "red" : "black",
      };
      newGraph.nodes.push(newNode);
      if (!node.left) {
        const leftNode = {
          id: null_node_id,
          label: "n",
          color: "black",
        };
        const leftEdge = {
          from: node.id,
          to: null_node_id--,
        };
        newGraph.nodes.push(leftNode);
        newGraph.edges.push(leftEdge);
      } else {
        const leftEdge = {
          from: node.id,
          to: node.left.id,
        };
        newGraph.edges.push(leftEdge);
      }

      if (!node.right) {
        const rightNode = {
          id: null_node_id,
          label: "n",
          color: "black",
        };
        const rightEdge = {
          from: node.id,
          to: null_node_id--,
        };
        newGraph.nodes.push(rightNode);
        newGraph.edges.push(rightEdge);
      } else {
        const rightEdge = {
          from: node.id,
          to: node.right.id,
        };
        newGraph.edges.push(rightEdge);
      }

      // console.log(newNode);
      dfs(node.left);
      dfs(node.right);
    }
  };

  const handleSimulate = () => {
    startSimulate = true;
    data_init();

    //parse input
    const input = document.getElementById("tasks").value;
    const ary = input.split("\n");

    var n = parseInt(ary[0].split(" ")[0]);
    expected_runtime = parseInt(ary[0].split(" ")[1]);
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
      setTimeout(() => {
        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });
      }, 100);
      return;
    }
    if (finish_flag) return;
    current_show = "";
    clock++;
    setClockShow(clockShow + 1);
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
        current_show += `${i} arrives, insert ${i} to rbt\n\n`;
      }
      // treeRef.current.forceUpdate();
      // console.log("tasks: ", tasks);
      console.log(rbt.root);

      update_flag = true;
    }
    if (current_task == "") sched_flag = true;
    if (update_flag) {
      update_slice_all(); //update schedule enitities that added to runqueue
    }
    if (sched_flag) schedule();

    if (clock > expected_runtime) finish_flag = true;
    if (finish_flag) write_finish_buffer();
    else write_buffer();
    if (current_show == "") {
      current_show = `No scheduling in this clock\n`;
    }
    generateGraph();
  };

  function write_finish_buffer() {
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

  function data_init() {
    rbt = new RBTree();
    tasks = new Map();
    timequeue = new Map();
    sched_flag = false;
    update_flag = false;
    finish_flag = false;
    clock = 0;
    current_task = "";
    results = "";
    task_seq = "\n[ ";
    expected_runtime = 0;
    current_show = "";
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
      current_show += `${current_task} has finished execution\n`;
      console.log(current_task, " has finished execution");
      tasks.delete(current_task);
      current_task = "";
      sched_flag = true;
    } else if (clock - se.exec_start >= se.timeslice) {
      //ran out of timeslice
      results += `${current_task} has finished its timeslice of ${se.timeslice}\n`;
      current_show += `${current_task} has finished execution\n`;
      console.log(current_task, " has finished timeslice");
      update_vruntime(current_task);
      current_task = "";
      sched_flag = true;
    }
  }

  function update_vruntime(key) {
    var vruntime = calc_vruntime(key);
    results += `Update ${key}'s vruntime to: ${vruntime}\n`;
    current_show += `Update ${key}'s vruntime to: ${vruntime} \nInsert ${key} to rbt\n`;
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
    current_show += "Schedule triggered\n\n";
    var se = tasks.get(min.key); //get schedule entity that has smallest vruntime

    if (se.sum_exec_runtime == 0) update_slice_init(min.key);
    else update_slice(min.key);

    results += `${min.key} has the smallest vruntime: ${se.vruntime}\n`;
    current_show += `${min.key} has the smallest vruntime: ${se.vruntime}\n`;
    console.log(min.key, " has the smallest vruntime: ", se.vruntime);

    se = tasks.get(min.key); //get updated schedule entity
    rbt.remove(); //remove schedule entity from rbt
    current_show += `Remove ${min.key} from rbt and execute it\n`;
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
            <a className="enlarge-text">the total number of tasks</a>,
            <a className="enlarge-text"> total runtime</a>.
          </p>
          <p>
            2. Then each line defines the tasks in the order of:{" "}
            <a className="enlarge-text">task name</a>,{" "}
            <a className="enlarge-text">arrival time</a>,{" "}
            <a className="enlarge-text">burst time</a>,{" "}
            <a className="enlarge-text">nice value</a>.
          </p>
          <p>
            3. The red black tree below would describe the status at{" "}
            <a className="enlarge-text">the end</a> of each clock.
          </p>
        </div>
        <textarea
          type="text"
          id="tasks"
          name="tasks"
          className="card"
          defaultValue={"3 10\nA 1 3 0\nB 2 4 -2\nC 2 3 2"}
        ></textarea>
        <button onClick={handleSimulate}>Simulate</button>

        <p className="description" id="RB-Tree">
          RB-Tree
        </p>
        <div></div>
        <div className="rbt">
          <p className="clock">{clock}</p>

          <Graph key={uuidv4} graph={graphData} options={options} />
          <div>
            <p>Current Task: {current_task == "" ? "X" : current_task}</p>
            <textarea
              readonly
              defaultValue={current_show}
              className="popup"
            ></textarea>
          </div>
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
          href="https://github.com/steven1lung/cfs-visualizer-react"
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
