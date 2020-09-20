import { spread, assign, insert, createComponent, dynamicProperty } from "solid-js/dom";

function h() {
    let args = [].slice.call(arguments),
    first = args.shift(),
    e = { type: first, children: [], attributes: {}, $h: true };
    if (typeof first === "function") {
      let props,
      next = args[0];
      if (next == null || typeof next === "object" && !Array.isArray(next) && !(next instanceof Element)) props = args.shift();
      props || (props = {});
      e.attributes = props;
      props.children = (args.length > 1 ? args : args[0]) || props.children;
      return e;
    }
    function item(l) {
      const type = typeof l;
      if (l == null) ;else
      if ("string" === type || l instanceof Element || "function" === type) {
        e.children.push(l);
      } else if ("number" === type || "boolean" === type || l instanceof Date || l instanceof RegExp) {
        e.children.push(l.toString());
      } else if (Array.isArray(l)) {
        for (let i = 0; i < l.length; i++) item(l[i]);
      } else if ("object" === type) {
        if (l.$h) {
          e.children.push(l);
        } else {
          Object.assign(e.attributes, l);
        }
      }
    }
    while (args.length) item(args.shift());
    return e;
  }
  
  function createVDomEvaluator(r) {
    let gid = 0;
    let cache = [];
  
    function renderVDomTreeStatic(x, level) {
      if (typeof x.type === "string") {
        let e = document.createElement(x.type);
        let attrclone = {};
        for (const attr in x.attributes) {
          let val = x.attributes[attr];
          if (typeof val === "string") attrclone[attr] = val;
        }
        r.assign(e, attrclone, e instanceof SVGElement, true);
        for (const y of x.children) {
          if (typeof y === "string") {
            e.appendChild(document.createTextNode(y));
          } else {
            renderVDomTreeStatic(y, e);
          }
        }
        if (level) level.appendChild(e);
        return e;
      }
    }
    function reactifyChildren(x, e) {
      let attrclone = {};
      let dynamic = false;
      for (const attr in x.attributes) {
        let val = x.attributes[attr];
        if (typeof val !== "string") attrclone[attr] = val;
        if (typeof val === "function" && attr !== "ref" && attr.slice(0, 2) !== "on") {
          r.dynamicProperty(attrclone, attr);
          dynamic = true;
        }
      }
      if (Object.keys(attrclone).length)
      dynamic ? r.spread(e, attrclone, e instanceof SVGElement, !!x.children.length) :
      r.assign(e, attrclone, e instanceof SVGElement, !!x.children.length);
      let walk = e.firstChild;
      for (const y of x.children) {
        if (typeof y !== "string") {
          if (typeof y.type === "string") {
            reactifyChildren(y, walk);
          } else if (typeof y.type === "function") {
            for (const k in y.attributes) {
              if (typeof y.attributes[k] === "function" && !y.attributes[k].length) r.dynamicProperty(y.attributes, k);
            }
            r.insert(e, r.createComponent(y.type, y.attributes), walk);
          } else {
            r.insert(e, y, walk);
          }
        }
        walk = walk && walk.nextSibling || e.firstChild;
      }
      return e;
    }
  
    function $(component) {
      let id = gid++;
      return props => {
        let vdomTree = component(props);
        if (!cache[id]) {
          let x = renderVDomTreeStatic(vdomTree);
          if (x) cache[id] = x;
        }
        let cloned = cache[id].cloneNode(true);
        reactifyChildren(vdomTree, cloned);
        return cloned;
      };
    }
    function once(component) {
      return props => {
        let vdomTree = component(props);
        let x = renderVDomTreeStatic(vdomTree);
        reactifyChildren(vdomTree, x);
        return x;
      };
    }
  
    return [$, once];
  }
  
  

  
const [$,once]= createVDomEvaluator({
  spread,
  assign,
  insert,
  createComponent,
  dynamicProperty
});
export{$,once,h};