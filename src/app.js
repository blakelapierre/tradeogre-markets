import { h, render } from 'preact-cycle';

const ADD_TRACKER_ITEM = ({
  tracker: {
    items,
    inputText,
    ...trackerProps
  }, ...props
}) => ({
  tracker: {
    items: items.concat(inputText),
    inputText: '',
    ...trackerProps
  }, ...props
});

const SET_TRACKER_TEXT = ({
  tracker: {
    inputText,
    ...trackerProps
  },
  ...props
}, event) => ({
  tracker: {
    inputText: event.target.value,
    ...trackerProps
  },
  ...props
});

const fromEvent = (prev, event) => event.target.value;

const Tracker = ({tracker:{items, inputText}}, {mutation}) => (
  <tracker>
    {items.map(item => <item>{item}</item>)}
    <TrackerInput inputText={inputText} />
  </tracker>
);

const TrackerInput = ({inputText}, {mutation}) => (
  <tracker-input>
    <form onSubmit={mutation(ADD_TRACKER_ITEM)} action="javascript:">
      <input placeholder="New item..." value={inputText} onInput={mutation(SET_TRACKER_TEXT)} autoFocus />
    </form>
  </tracker-input>
);

const Info = ({items}, {info: {metrics}}) => (
  <info>
    <headers>
      {metrics.map(metric => <Metric metric={metric} />)}
    </headers>
    <bars>
      {metrics.map(metric => <Bar value={Math.random() * 100} />)}
    </bars>
  </info>
);

const Metric = ({metric: {name, units}}) => (
  <metric>{name} ({units[0]})</metric>
);

const Bar = ({value}) => (
  <bar style={{'height': `${value}%`}}>bar</bar>
);

const SideBySide = ({tracker, info}) => (
  <side-by-side>
    <Tracker tracker={tracker} />
    <Info info={info} />
  </side-by-side>
);

render(
  SideBySide, {
    tracker: {items: [], text: ''},
    info: {
      items: [],
      metrics: [{
        name: 'Calories',
        units: ['kcal']
      },{
        name: 'Saturated Fat',
        units: ['g'],
        group: 'Total Fat'
      },{
        name: 'Trans Fat',
        units: ['g']
      },{
        name: 'Monounsaturated Fat',
        units: ['g'],
        group: 'Unsaturated Fat'
      },{
        name: 'Polyunsaturated Fat',
        units: ['g'],
        group: 'Unsaturated Fat'
      },{
        name: 'Sugars',
        units: ['g']
      },{
        name: 'Soluble Fiber',
        units: ['g']
      },{
        name: 'Insoluble Fiber',
        units: ['g']
      },{
        name: 'Other Carbohydrates',
        units: ['g']
      },{
        name: 'Protein',
        units: ['g']
      },{
        name: 'Sodium',
        units: ['mg']
      },{
        name: 'Potassium',
        units: ['mg']
      }]
    },
  }, document.body
);