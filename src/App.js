import React, { useState, useRef } from "react";
import "./styles/App.css";

import { Sched, sched_prio_to_weight } from "./sched";
import { options } from "./render";
import Graph from "react-graph-vis";
import { cloneDeep } from "lodash";
import { v4 as uuidv4 } from "uuid";

var clock = 0;
var RBTree = require("bintrees").RBTree;
var rbt = new RBTree(function (a, b) {
  return a.value - b.value;
});
var tasks = new Map(); //hashmap for task name to a task structure
var num; //total number of tasks
var timequeue = new Map(); //timequeue for adding tasks to runqueue when arrival time hits
var sched_flag = false;
var update_flag = false;
var finish_flag = false;
var results = "";
var task_seq = "";
var startSimulate = false;
var expected_runtime = 0;

var prev_rbt = [];
var prev_graph = [];
var prev_tasks = [];
var prev_show = [];
var prev_flags = [];
var prev_curtask = [];
var prev_count = 0;
//scheduler variables
var current_task = "";
var current_show = "";
var avoid_same_value = 0.0000001;
var Label2ID = new Map();

const sched_latency = 6;
const sched_min_granularity = 0.75;

const def_val = [
  "3 10\nA 1 3 0\nB 2 4 -2\nC 2 3 2",
  "4 12\nA 1 3 0\nB 2 4 -2\nC 2 3 2\nD 1 2 19",
  "5 13\nA 1 3 0\nB 2 4 -2\nC 2 3 2\nD 1 2 19\nE 4 1 -15",
];

const graph = {
  nodes: [],
  edges: [],
};

function App() {
  const [showResult, setShowResult] = useState("");
  const [graphData, setGraphData] = useState(graph);
  const [clockShow, setClockShow] = useState(0);
  const [defValShow, setDefValShow] = useState(def_val[0]);
  const showRef = useRef();
  const [nodeShow, setNodeShow] = useState("X");
  const [vrtShow, setVrtShow] = useState(0);
  const [timesliceShow, setTimesliceShow] = useState(0);
  const [niceShow, setNiceShow] = useState("null");
  const [hoverShow, setHoverShow] = useState(false);

  const events = {
    hoverNode: (node) => {
      // console.log(node.node);
      // console.log("asd");
      var key = Label2ID.get(node.node);
      var se = tasks.get(key);
      if (key !== "n") {
        setHoverShow(true);
        setVrtShow(se.vruntime);
        setTimesliceShow(se.timeslice);
        setNiceShow(JSON.stringify(se.nice));
      } else {
        setVrtShow(0);
        setTimesliceShow(0);
        setNiceShow("null");
      }
      setNodeShow(key);
    },
    blurNode: (node) => {
      setHoverShow(false);
    },
  };

  const generateGraph = (e) => {
    var newGraph = { nodes: [], edges: [] };
    Label2ID.clear();
    var nid = 1;
    console.log(rbt);
    preorder(rbt._root);
    setGraphData(newGraph);

    function preorder(node) {
      if (node == null) {
        return;
      }
      let lid = nid * 2;
      let rid = nid * 2 + 1;

      const newNode = {
        id: nid,
        label: node.data.key,
        color: node.red ? "red" : "black",
      };
      Label2ID.set(nid, node.data.key);
      newGraph.nodes.push(newNode);
      if (!node.left) {
        const leftNode = {
          id: lid,
          label: "n",
          color: "gray",
          font: "15px arial white",
        };
        const leftEdge = {
          from: nid,
          to: lid,
        };
        Label2ID.set(lid, "n");
        newGraph.nodes.push(leftNode);
        newGraph.edges.push(leftEdge);
      } else {
        const leftEdge = {
          from: nid,
          to: lid,
        };
        newGraph.edges.push(leftEdge);
      }

      if (!node.right) {
        const rightNode = {
          id: rid,
          label: "n",
          color: "gray",
          font: "15px arial white",
        };
        const rightEdge = {
          from: nid,
          to: rid,
        };
        Label2ID.set(rid, "n");
        newGraph.nodes.push(rightNode);
        newGraph.edges.push(rightEdge);
      } else {
        const rightEdge = {
          from: nid,
          to: rid,
        };
        newGraph.edges.push(rightEdge);
      }
      nid = lid;
      preorder(node.left);
      nid = rid;
      preorder(node.right);
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

  const handlePrev = () => {
    if (prev_graph.length < 1) return;
    prev_count++;
    console.log("prev");
    clock--;
    tasks = prev_tasks.pop();
    current_show = prev_show.pop();

    rbt = prev_rbt.pop();

    const tmp_flag = prev_flags.pop();
    sched_flag = tmp_flag.sched;
    finish_flag = tmp_flag.finish;
    update_flag = tmp_flag.update;
    current_task = prev_curtask.pop();
    setGraphData(prev_graph.pop());
  };

  /**
   * Every clock cycle would perform the following operation in order:
   *  1. Push current status to previous stack
   *  2. sched_tick() : update current task data
   *  3. Add tasks that arrive at current time, and update all tasks timeslice
   *  4. If no tasks are running, schedule a task to run
   *  5. Generate rbt visualization
   */
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

    //update previous data
    prev_tasks.push(cloneDeep(tasks));
    prev_show.push(current_show);
    console.log("save");
    prev_rbt.push(cloneDeep(rbt));
    prev_flags.push({
      sched: sched_flag,
      update: update_flag,
      finish: finish_flag,
    });
    prev_graph.push(cloneDeep(graphData));
    prev_curtask.push(current_task);

    current_show = "";
    clock++;
    setClockShow(clockShow + 1);
    if (prev_count === 0) results += `CPU Time: ${clock}\n`;
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
        console.log(i, "arrives", tasks.get(i).vruntime);
        rbt.insert({
          key: i,
          value: tasks.get(i).vruntime + avoid_same_value,
        });
        current_show += `${i} arrives, insert ${i} to rbt\n\n`;
        avoid_same_value *= 2;
      }
      // treeRef.current.forceUpdate();
      // console.log("tasks: ", tasks);
      console.log(rbt);

      update_flag = true;
    }
    if (current_task === "") sched_flag = true;
    if (update_flag) {
      update_slice_all(); //update schedule enitities that added to runqueue
    }
    if (sched_flag) schedule();

    if (clock > expected_runtime) finish_flag = true;
    if (finish_flag) write_finish_buffer();
    else write_buffer();
    if (current_show === "") {
      current_show = `No scheduling in this clock\n`;
    }
    generateGraph();
    if (prev_count > 0) prev_count--;
    // console.log(rbt);
  };

  function write_finish_buffer() {
    if (prev_count === 0) results += `Finish scheduling simulate\n`;
    console.log("Finish scheduling simulate");
    if (prev_count === 0) task_seq += "]\n";
    if (prev_count === 0) results += task_seq;
    setShowResult(results);
    setTimeout(() => {
      window.scrollTo({
        top: document.getElementById("results").offsetTop,
        behavior: "smooth",
      });
    }, 100);
  }

  function write_buffer() {
    if (prev_count === 0)
      results += `current running task: ${current_task}\n\n\n`;
    // console.log("rbt: ");
    // console.log(rbt.root);
    console.log("tasks data: ");
    console.log(tasks);
    console.log("current task: ", current_task);
    console.log("\n\n");
    if (prev_count === 0) task_seq += `${current_task} `;
    sched_flag = false;
    update_flag = false;
  }

  function data_init() {
    rbt = new RBTree(function (a, b) {
      return a.value - b.value;
    });
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
    prev_rbt = [];
    prev_graph = [];
    prev_tasks = [];
    prev_show = [];
    prev_flags = [];
    prev_curtask = [];
    prev_count = 0;
    current_show = "";
    setClockShow(0);
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
    console.log(se, timeslice);
    if (se.timeslice !== timeslice) {
      if (prev_count === 0)
        results += `Update ${key}'s timeslice from ${se.timeslice.toFixed(
          3
        )} to ${timeslice.toFixed(3)}\n`;
      current_show += `Update ${key}'s timeslice from ${se.timeslice.toFixed(
        3
      )} to ${timeslice.toFixed(3)}\n\n`;
    }
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
      if (prev_count === 0)
        results += `${current_task} has finished execution\n`;
      current_show += `${current_task} has finished execution\n`;
      // console.log(current_task, " has finished execution");
      tasks.delete(current_task);
      current_task = "";
      sched_flag = true;
    } else if (clock - se.exec_start >= se.timeslice) {
      //ran out of timeslice
      if (prev_count === 0)
        results += `${current_task} has finished its timeslice of ${se.timeslice.toFixed(
          3
        )}\n\n`;
      current_show += `${current_task} has finished its timeslice of ${se.timeslice.toFixed(
        3
      )}\n\n`;
      // console.log(current_task, " has finished its timeslice of ${se.timeslice}\n");
      update_vruntime(current_task);
      current_task = "";
      sched_flag = true;
    }
  }

  function update_vruntime(key) {
    var vruntime = calc_vruntime(key);
    if (prev_count === 0)
      results += `Update ${key}'s vruntime to: ${vruntime.toFixed(
        3
      )}\nInsert ${key} to rbt\n`;
    current_show += `Update ${key}'s vruntime to: ${vruntime.toFixed(
      3
    )} \nInsert ${key} to rbt\n\n`;
    // console.log("Update ", key, "'s vruntime to : ", vruntime);
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
    rbt.insert({ key: key, value: vruntime });
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
    var min = rbt.min(); //get smallest vruntime from rbt
    if (!min) {
      finish_flag = true;
      return;
    }
    // current_show += "Schedule triggered\n\n";
    var se = tasks.get(min.key); //get schedule entity that has smallest vruntime

    if (se.sum_exec_runtime === 0) update_slice_init(min.key);
    else update_slice(min.key);

    if (prev_count === 0)
      results += `${min.key} has the smallest vruntime: ${se.vruntime.toFixed(
        3
      )}\n`;
    current_show += `${
      min.key
    } has the smallest vruntime: ${se.vruntime.toFixed(3)}\n\n`;
    // console.log(min.key, " has the smallest vruntime: ", se.vruntime);

    se = tasks.get(min.key); //get updated schedule entity
    rbt.remove(min); //remove schedule entity from rbt
    current_show += `Remove ${
      min.key
    } from rbt and execute it for timeslice: ${se.timeslice.toFixed(3)}\n\n`;
    if (prev_count === 0)
      results += `Remove ${
        min.key
      } from rbt and execute it for timeslice: ${se.timeslice.toFixed(3)}\n`;
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
    console.log("\n\n");

    if (prev_count === 0) {
      results += `Scheduler Init\n`;
      results += `Constants are listed below: \n`;
      results += `sched_latency: ${sched_latency}\n`;
      results += `sched_min_granularity: ${sched_min_granularity}\n`;
    }
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
            1. First line defines
            <span className="enlarge-text"> the total number of tasks</span>,
            <span className="enlarge-text"> total runtime</span>.
          </p>
          <p>
            2. Then each line defines the tasks in the order of:
            <span className="enlarge-text"> task name</span>,
            <span className="enlarge-text"> arrival time</span>,
            <span className="enlarge-text"> burst time</span>,
            <span className="enlarge-text"> nice value</span>.
          </p>
          <p>
            3. The red black tree below would describe the status at
            <span className="enlarge-text"> the end</span> of each clock.
          </p>
          <p>
            4. You can <span className="enlarge-text">hover</span> the mouse on
            the node to see data about it.
          </p>
        </div>

        <textarea
          type="text"
          ref={showRef}
          id="tasks"
          name="tasks"
          className="card"
          value={defValShow}
          onChange={(e) => {
            setDefValShow(e.target.value);
          }}
        ></textarea>

        <div className="default_value">
          <button onClick={() => setDefValShow(def_val[0])}>3 Tasks</button>
          <button className="btn" onClick={() => setDefValShow(def_val[1])}>
            4 Tasks
          </button>
          <button onClick={() => setDefValShow(def_val[2])}>5 Tasks</button>
        </div>

        <button onClick={handleSimulate}>Simulate</button>

        <p className="description" id="RB-Tree">
          RB-Tree
        </p>
        <div className="rbt">
          <div className="clock-container">
            <p className="clock">{clock}</p>
            <p className="enlarge-text">
              Current Task: {current_task === "" ? "X" : current_task}
            </p>
            {hoverShow && (
              <div>
                <p className="enlarge-text">
                  Hovering Node : <span>{nodeShow}</span>
                </p>
                <p>
                  vruntime: <span>{vrtShow.toFixed(3)}</span>
                </p>
                <p>
                  timeslice: <span>{timesliceShow.toFixed(3)}</span>
                </p>
                <p>
                  nice: <span>{niceShow}</span>
                </p>
              </div>
            )}
          </div>

          <Graph
            key={uuidv4}
            graph={graphData}
            options={options}
            events={events}
          />
          <div className="task">
            <textarea
              readOnly
              defaultValue={current_show}
              className="popup"
            ></textarea>
          </div>
        </div>
        <div>
          <button className="btn" onClick={handlePrev}>
            Prev Clock
          </button>
          <button className="btn" onClick={handleNext}>
            Next Clock
          </button>
        </div>

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
