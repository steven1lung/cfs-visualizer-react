export const options = {
  nodes: {
    borderWidth: 2,
    font: "30px arial white",
    shape: "circle",
  },
  layout: {
    hierarchical: {
      sortMethod: "directed",
    },
  },
  edges: {
    color: "#000000",
    smooth: true,
    width: 1,
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
};
