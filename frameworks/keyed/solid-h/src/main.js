// @ts-check
import { createSignal, createSelector, batch, For } from 'solid-js';
import { render } from 'solid-js/dom';
import h from 'solid-js/h';

let idCounter = 1;
const adjectives = ["pretty", "large", "big", "small", "tall", "short", "long", "handsome", "plain", "quaint", "clean", "elegant", "easy", "angry", "crazy", "helpful", "mushy", "odd", "unsightly", "adorable", "important", "inexpensive", "cheap", "expensive", "fancy"],
  colours = ["red", "yellow", "blue", "green", "pink", "brown", "purple", "brown", "white", "black", "orange"],
  nouns = ["table", "chair", "house", "bbq", "desk", "car", "pony", "cookie", "sandwich", "burger", "pizza", "mouse", "keyboard"];

function _random (max) { return Math.round(Math.random() * 1000) % max; };

function buildData(count) {
  let data = new Array(count);
  for (let i = 0; i < count; i++) {
    const [label, setLabel] = createSignal(`${adjectives[_random(adjectives.length)]} ${colours[_random(colours.length)]} ${nouns[_random(nouns.length)]}`);
    data[i] = {
      id: idCounter++,
      label, setLabel
    }
  }
  return data;
}

const Button = ({ id, text, fn }) =>
  h('.col-sm-6.smallpad',
    h(`button#${id}.btn.btn-primary.btn-block`, {
      type: 'button', onClick: fn
    }, text)
  );

const App = () => {
  const [data, setData] = createSignal([]),
    [selected, setSelected] = createSignal(null, true),
    isSelected = createSelector(selected);

  return h('.container', [
    h('.jumbotron', h('.row', [
      h('.col-md-6', h('h1', 'SolidJS Keyed')),
      h('.col-md-6', h('.row', [
        Button({ id: 'run', text: 'Create 1,000 rows', fn: run }),
        Button({ id: 'runlots', text: 'Create 10,000 rows', fn: runLots }),
        Button({ id: 'add', text: 'Append 1,000 rows', fn: add }),
        Button({ id: 'update', text: 'Update every 10th row', fn: update }),
        Button({ id: 'clear', text: 'Clear', fn: clear }),
        Button({ id: 'swaprows', text: 'Swap Rows', fn: swapRows })
      ]))
    ])),
    h('table.table.table-hover.table-striped.test-data', h('tbody',
      h(For, {each: data}, row => {
        let rowId = row.id;
        return h('tr', {class: ()=>isSelected(rowId)?"danger":""}, [
          h('td.col-md-1', row.id),
          h('td.col-md-4', h('a', {onClick: [setSelected, rowId]}, row.label)),
          h('td.col-md-1', h('a', {onClick: [remove, rowId]}, h('span.glyphicon.glyphicon-remove', {'aria-hidden': true}))),
          h('td.col-md-6')
        ])
      })
    )),
    h('span.preloadicon.glyphicon.glyphicon-remove', {'aria-hidden': true})
  ]);

  function remove(id) {
    const d = data();
    d.splice(d.findIndex(d => d.id === id), 1);
    setData(d);
  }

  function run() {
    batch(() => {
      setData(buildData(1000));
      setSelected(null);
    });
  }

  function runLots() {
    batch(() => {
      setData(buildData(10000));
      setSelected(null);
    });
  }

  function add() { setData(data().concat(buildData(1000))); }

  function update() {
    batch(() => {
      const d = data();
      let index = 0;
      while (index < d.length) {
        d[index].setLabel(d[index].label() + ' !!!');
        index += 10;
      }
    });
  }

  function swapRows() {
    const d = data();
    if (d.length > 998) {
      let tmp = d[1];
      d[1] = d[998];
      d[998] = tmp;
      setData(d);
    }
  }

  function clear() {
    batch(() => {
      setData([]);
      setSelected(null);
    });
  }
}

render(App, document.getElementById("main"));
