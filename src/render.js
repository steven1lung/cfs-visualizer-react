import Graph from "react-graph-vis";
import { RBTree } from "./rbt";
import React, { useState } from "react";

export default class Tree extends React.Component {
  constructor() {
    super();
    this.state = {
      options: {
        nodes: {
          borderWidth: 2,
          font: "80px arial white",
          shape: "circle",
        },
        layout: {
          hierarchical: {
            enabled: true,
            sortMethod: "directed",
          },
        },
        edges: {
          color: "#000000",
          smooth: true,
          width: 5,
        },
        height: "100%",
        width: "100%",
        manipulation: {
          enabled: false,
          initiallyActive: false,
          editEdge: false,
          deleteNode: false,
          deleteEdge: false,
        },
        interaction: {
          dragNodes: false,
          dragView: false,
          hideEdgesOnDrag: false,
          hideNodesOnDrag: false,
          hover: false,
          hoverConnectedEdges: false,
          keyboard: {
            enabled: false,
          },
          multiselect: false,
          navigationButtons: false,
          selectable: false,
          selectConnectedEdges: false,
          zoomView: false,
        },
        physics: false,
      },
    };
  }

  render() {
    var nodes = [
      { id: 1, label: "A", color: "black" },
      { id: 2, label: "B", color: "red" },
      { id: 3, label: "C", color: "red" },
      { id: 4, label: "D", color: "black" },
      { id: 5, label: "E", color: "black" },
      { id: 6, label: "F", color: "black" },
    ];

    var edges = [
      { from: 1, to: 2 },
      { from: 1, to: 3 },
      { from: 2, to: 4 },
      { from: 2, to: 5 },
      { from: 3, to: 6 },
      { from: 3, to: 7 },
    ];
    return (
      <Graph
        graph={{ nodes: nodes, edges: edges }}
        options={this.state.options}
      />
    );
  }
}
