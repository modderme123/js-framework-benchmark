import { spread, assign, insert, createComponent, dynamicProperty } from "solid-js/dom";

function isStatic(l) {
  const type = typeof l;
  return "string" === type || "number" === type || "boolean" === type || l instanceof Date || l instanceof RegExp;
}
function staticAttr(l) {
  return typeof l !== "function" && typeof l !== "object";
}
function isStaticVirtualNode(l) {
  return typeof l.type === "string";
}
function isVirtualNode(l) {
  return l.$h;
}
function isPojo(obj) {
  if (obj === null || typeof obj !== "object") {
    return false;
  }
  return Object.getPrototypeOf(obj) === Object.prototype;
}

function h(type, props, ...children) {
  if (props === undefined) props = {};
  if (!isPojo(props) || isVirtualNode(props)) {
    children.unshift(props);
    props = {};
  }  return { type, children: children.flat(), attributes: props, $h: true };
}

function createVDomEvaluator(r) {
  let gid = 0;
  let cache = [];



  function renderVDomTreeStatic(x, level) {
    if (isStatic(x)) {
      let node = document.createTextNode(x.toString());
      if (level) level.appendChild(node);
      return node;
    } else if (isStaticVirtualNode(x)) {
      let e = document.createElement(x.type);
      let attrclone = {};
      for (const attr in x.attributes) {
        let val = x.attributes[attr];
        if (staticAttr(val)) attrclone[attr] = val;
      }
      r.assign(e, attrclone, e instanceof SVGElement, true);
      for (const y of x.children) {
        renderVDomTreeStatic(y, e);
      }
      if (level) level.appendChild(e);
      return e;
    } else if (Array.isArray(x)) {
      return x.map(y => renderVDomTreeStatic(y));
    }
  }

  function reactifyChildren(x, e) {
    if (isStatic(x)) return e;
    if (x instanceof Element) return x;
    if (typeof x === "function") return r.createComponent(x, undefined);
    let attrclone = {};
    let exists = false,
    dynamic = false;
    for (const attr in x.attributes) {
      let val = x.attributes[attr];
      if (!staticAttr(val)) {
        attrclone[attr] = val;
        exists = true;
      }
      if (typeof val === "function" && attr !== "ref" && attr.slice(0, 2) !== "on" && attr !== "children") {
        r.dynamicProperty(attrclone, attr);
        dynamic = true;
      }
    }
    if (exists)
    dynamic ?
    r.spread(e, attrclone, e instanceof SVGElement, !!x.children.length) :
    r.assign(e, attrclone, e instanceof SVGElement, !!x.children.length);
    let walk = e?.firstChild;
    let multiExpression = x.children.length <= 1 ? undefined : null;
    for (const y of x.children) {
      if (!isStatic(y)) {
        if (isVirtualNode(y)) {
          if (typeof y.type === "string") {
            reactifyChildren(y, walk);
            walk = walk && walk.nextSibling;
          } else {
            // for (const k in y.attributes) {
            //   if (typeof y.attributes[k] === "function" && !y.attributes[k].length && k !== "children")
            //   r.dynamicProperty(y.attributes, k);
            // }
            y.attributes.children = y.attributes.children || y.children;
            if (Array.isArray(y.attributes.children) && y.attributes.children.length == 1)
            y.attributes.children = y.attributes.children[0];
            r.insert(e, r.createComponent(y.type, y.attributes), walk || multiExpression);
          }
        } else {
          r.insert(e, y, walk || multiExpression);
        }
      }
    }
    return e;
  }
  function $(component) {
    let id = gid++,
    called = false;
    return props => {
      let vdomTree = component(props);
      if (!called) {
        cache[id] = renderVDomTreeStatic(vdomTree);
        called = true;
      }
      let cached = cache[id];
      if (Array.isArray(vdomTree)) {
        let vt = vdomTree;
        return cached.map((x, i) => {
          let cloned = x?.cloneNode(true);
          return reactifyChildren(vt[i], cloned);
        });
      }
      let cloned = cached?.cloneNode(true);
      return reactifyChildren(vdomTree, cloned);
    };
  }



  function once(component) {
    if (Array.isArray(component)) {
      return renderVDomTreeStatic(component).
      map((y, i) => reactifyChildren(component[i], y));
    }
    let x = renderVDomTreeStatic(component);
    return reactifyChildren(component, x);
  }

  return [$, once];
}


const [$, once] = createVDomEvaluator({
  spread,
  assign,
  insert,
  createComponent,
  dynamicProperty
});
export {$, once, h};