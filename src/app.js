import { h, render } from 'preact-cycle';

const ADD_TRACKER_ITEM = ({
  // jshint ignore:start
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
  // jshint ignore:end
});

const SET_TRACKER_TEXT = ({
  // jshint ignore:start
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
  // jshint ignore:end
});

const fromEvent = (prev, event) => event.target.value;

const Tracker = ({tracker:{items, inputText}}, {mutation}) => (
  // jshint ignore:start
  <tracker>
    {items.map(item => <item>{item}</item>)}
    <TrackerInput inputText={inputText} />
  </tracker>
  // jshint ignore:end
);

const TrackerInput = ({inputText}, {mutation}) => (
  // jshint ignore:start
  <tracker-input>
    <form onSubmit={mutation(ADD_TRACKER_ITEM)} action="javascript:">
      <input placeholder="New item..." value={inputText} onInput={mutation(SET_TRACKER_TEXT)} autoFocus />
    </form>
  </tracker-input>
  // jshint ignore:end
);

const Info = ({items}, {info: {metrics}}) => (
  // jshint ignore:start
  <info>
    <headers>
      {metrics.map(metric => <Metric metric={metric} />)}
    </headers>
    <bars>
      {metrics.map(metric => <Bar value={Math.random() * 100} />)}
    </bars>
  </info>
  // jshint ignore:end
);

const Metric = ({metric: {name, units}}) => (
  // jshint ignore:start
  <metric>{name} ({units[0]})</metric>
  // jshint ignore:end
);

const Bar = ({value}) => (
  // jshint ignore:start
  <bar style={{'height': `${value}%`}}>bar</bar>
  // jshint ignore:end
);

const SideBySide = ({tracker, info}) => (
  // jshint ignore:start
  <side-by-side>
    <Tracker tracker={tracker} />
    <Info info={info} />
  </side-by-side>
  // jshint ignore:end
);

render(
  // jshint ignore:start
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
  // jshint ignore:end
);