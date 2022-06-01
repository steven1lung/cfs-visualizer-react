import "./styles/rbt.css";
const RED = true;
const BLACK = false;
class Node {
  constructor(key, value) {
    this.key = key;
    this.value = value;
    this.left = null;
    this.right = null;
    this.color = RED;
    this.parent = null;
  }
}
export class RBTree {
  constructor() {
    this.root = null;
    this.size = 0;
  }
  /**
  The insert of a red black tree requires 3 stages:
  1. perform a standard bst insert and set color to red
  2. if the inserted node is root, change color to black
  3. check if rbtree needs to be balanced
  */
  insert(key, value) {
    if (!this.root) {
      this.root = new Node(key, value);
      this.root.color = BLACK;
    } else {
      let node = this.__insert(key, value);
      this.__insert_fix(node);
      //   console.log(node);
    }
    console.log("finished insert " + value);
    this.size++;
  }

  __insert(key, value) {
    let node = this.root;
    while (node) {
      if (value < node.value) {
        if (!node.left) {
          node.left = new Node(key, value);
          node.left.parent = node;
          return node.left;
        }
        node = node.left;
      } else {
        if (!node.right) {
          node.right = new Node(key, value);
          node.right.parent = node;
          return node.right;
        }
        node = node.right;
      }
    }
  }

  __insert_fix(node) {
    let parent = null;
    let grand = null;
    while (node != this.root && node.color == RED && node.parent.color == RED) {
      parent = node.parent;
      grand = node.parent.parent;
      if (parent == grand.left) {
        let uncle = grand.right;
        if (uncle != null && uncle.color == RED) {
          grand.color = RED;
          parent.color = BLACK;
          uncle.color = BLACK;
          node = grand;
        } else {
          if (node == parent.right) {
            this.rotate_left(parent);
            node = parent;
            parent = node.parent;
          }

          this.rotate_right(grand);
          let tmp = grand.color;
          grand.color = parent.color;
          parent.color = tmp;

          node = parent;
        }
      } else {
        let uncle = grand.left;
        if (uncle != null && uncle.color == RED) {
          grand.color = RED;
          parent.color = BLACK;
          uncle.color = BLACK;
          node = grand;
        } else {
          if (node == parent.left) {
            this.rotate_right(parent);
            node = parent;
            parent = node.parent;
          }
          this.rotate_left(grand);
          let tmp = grand.color;
          grand.color = parent.color;
          parent.color = tmp;

          node = parent;
        }
      }
    }
    this.root.color = BLACK;
  }

  rotate_left(node) {
    let right_p = node.right;
    node.right = right_p.left;
    if (node.right != null) node.right.parent = node;
    right_p.parent = node.parent;
    if (node.parent == null) this.root = right_p;
    else if (node == node.parent.left) node.parent.left = right_p;
    else node.parent.right = right_p;

    right_p.left = node;
    node.parent = right_p;
  }
  rotate_right(node) {
    let left_p = node.left;
    node.left = left_p.right;
    if (node.left != null) {
      node.left.parent = node;
    }
    left_p.parent = node.parent;
    if (node.parent == null) this.root = left_p;
    else if (node == node.parent.left) node.parent.left = left_p;
    else node.parent.right = left_p;

    left_p.right = node;
    node.parent = left_p;
  }

  Node_div() {
    var rd = [];
    for (var i = 0; i < 3; ++i) {
      rd.push(
        <div className="node" key={i}>
          A
        </div>
      );
    }
    return <div className="container">{rd}</div>;
  }

  get_min() {
    var node = this.root;
    while (node.left) node = node.left;
    return node.key;
  }

  printTree(node) {
    if (!node) return;
    this.printTree(node.left);
    console.log(node.key, " ", node.value);
    this.printTree(node.right);
  }
}

// const bst = new RBTree();
// bst.insert(123);
// bst.insert(3);
// bst.insert(-2);
// bst.insert(9123);
// bst.insert(230);
// bst.insert(-90);
// console.log(bst.root);
// printTree(bst.root);
