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
    // console.log("finished insert " + value);
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

  remove() {
    const delete_node = this.get_min(this.root);
    if (delete_node == null) return;

    var x;
    var y = delete_node;
    var prev_color = y.color;
    if (this.isNull(delete_node.left)) {
      x = delete_node.right;
      this.transplant(delete_node, delete_node.right);
    } else if (this.isNull(delete_node.right)) {
      x = delete_node.left;
      this.transplant(delete_node, delete_node.left);
    } else {
      y = this.get_min(delete_node.right);
      prev_color = y.color;
      x = y.right;

      if (y.parent == delete_node) {
        if (x) x.parent = y;
      } else {
        this.transplant(y, y.right);
        y.right = delete_node.right;
        y.right.parent = y;
      }
      this.transplant(delete_node, y);
      y.left = delete_node.left;
      y.left.parent = y;
      y.color = delete_node.color;
    }
    if (prev_color == BLACK) {
      this.__remove_fix(x);
    }
    this.size--;
  }

  transplant(a, b) {
    if (a.parent == null) this.root = b;
    else if (a == a.parent.left) a.parent.left = b;
    else a.parent.right = b;
    if (b) b.parent = a.parent;
  }

  __remove_fix(node) {
    if (!node) return;
    while (node !== this.root && node.color == BLACK) {
      if (node == node.parent.left) {
        var w = node.parent.right;
        if (w.color == RED) {
          w.color = BLACK;
          this.rotate_left(node.parent);
          w = node.parent.right;
        }
        if (w.color == BLACK && w.right.color == BLACK) {
          w.color = RED;
          node = node.parent;
          continue;
        } else if (w.right.color == BLACK) {
          w.left.color = BLACK;
          w.color = RED;
          w = node.parent.right;
        }
        if (w.right.color == RED) {
          w.color = node.parent.color;
          node.parent.color = BLACK;
          w.right.color = BLACK;
          this.rotate_left(node.parent);
          node = this.root;
        }
      } else {
        var w = node.parent.left;
        if (w.color == RED) {
          w.color = BLACK;
          node.parent.color = RED;
          this.rotate_right(node.parent);
          w = node.parent.left;
        }
        if (w.right.color == BLACK && w.left.color == BLACK) {
          w.color = RED;
          node = node.parent;
        } else if (w.left.color == BLACK) {
          w.right.color = BLACK;
          w.color = RED;
          this.rotate_left(w);
          w = node.parent.left;
        }
        if (w.left.color == RED) {
          w.color = node.parent.color;
          node.parent.color = BLACK;
          w.left.color = BLACK;
          this.rotate_right(node.parent);
          node = this.root;
        }
      }
    }
    if (node) node.color = BLACK;
  }

  search(key, value) {
    var node = this.root;
    while (node != null) {
      if (key == node.key) return node;
      else if (value < node.value) node = node.left;
      else if (value > node.value) node = node.right;
      else return null;
    }
  }

  isNull(node) {
    return (
      node == null ||
      (node.key == null &&
        node.value == null &&
        node.color == BLACK &&
        node.left == null &&
        node.right == null)
    );
  }

  get_min(node) {
    if (node == null || node == undefined) return;
    while (!this.isNull(node.left)) node = node.left;
    return node;
  }

  printTree(node) {
    if (!node) return;
    this.printTree(node.left);
    console.log(node.key, " ", node.value);
    this.printTree(node.right);
  }
}

// const bst = new RBTree();
// bst.insert("B", 123);
// bst.insert("B", 3);
// bst.insert("A", -2);
// bst.insert("A", 9123);
// bst.insert("A", 230);
// bst.insert("A", -90);

// bst.printTree(bst.root);
// console.log("\n\n\n");
// bst.remove("A", 230);
// bst.remove("A", -2);
// bst.remove("A", 123);
// bst.printTree(bst.root);
