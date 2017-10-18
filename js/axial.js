(function () {
  let _axis = {};

  function _setAxis(axis) {
    return _axis = _initAxis(axis);
  }

  function _initAxis(axis) {
    if (axis.__axis_init === true) {
      return axis;
    }

    const subscribers = [];

    if (!axis.hasOwnProperty('$')) {
      axis.$ = {};
    }

    axis.__axis_subscribers = subscribers;

    axis.__axis_bind = function (obj) {
      subscribers.push(obj);
    };

    axis.__axis_unbind = function (obj) {
      const index = subscribers.indexOf(obj);
      subscribers.splice(index, 1);
    };

    axis.set = function (a, b) {
      const state = this.$;

      const log = this.__axis_log;

      if (typeof a === 'object' && !Array.isArray(a) && a !== null) {
        // merge partial state with current store
        log.push({type: 'partial', value: a});
        const partialState = a;
        for (let key in partialState) {
          state[key] = partialState[key];
        }
      } else if (typeof a === 'string') {
        // key value, set object at path
        log.push({type: 'keyval', key: a, value: b});
        _setObjectAtPath(state, a, b);
      } else if (typeof a === 'function') {
        // invoke function where "this" context is store (must be function, not arrow-type as context setting is required)
        log.push({type: 'function', value: a});
        a.apply(state, Array.isArray(b) ? b : []);
      }

      subscribers.forEach(component => {
        component.setState(state);
      });

      return true;
    };

    axis.__axis_log = [];

    axis.__axis_init = true;

    if (typeof axis.init === 'function') {
      axis.init();
    }

    return axis;
  }

  function _setObjectAtPath(obj, path, value) {
    let ref = obj;
    let steps = path.split('.');
    let l = steps.length - 1;
    let k = null;
    for (let i = 0; i < l; i++) {
      k = steps[i];
      if (!ref.hasOwnProperty(k)) {
        ref[k] = {};
      }
      ref = ref[k];
    }
    ref[steps[l]] = value;
  }

  const ReactComponent = typeof React.PureComponent !== 'undefined' ? React.PureComponent : React.Component;

  class StateComponent extends ReactComponent {
    constructor (props) {
      super(props);

      let axis = _axis;

      if (props.hasOwnProperty('axis')) {
        axis = props.axis;
      }

      this.setAxis(axis);

      const componentWillMount = this.componentWillMount;
      const componentWillUnmount = this.componentWillUnmount;

      this.componentWillMount = () => {
        this.__axis.__axis_bind(this);
        if (typeof componentWillMount === 'function') {
          componentWillMount();
        }
      };

      this.componentWillUnmount = () => {
        this.__axis.__axis_unbind(this);
        if (typeof componentWillUnmount === 'function') {
          componentWillUnmount();
        }
      };
    }

    setAxis (axis) {
      if (this.__axis) {
        for (let key in this.__axis) {
          if (this.hasOwnProperty(key)) {
            delete this[key];
          }
        }
      }

      // copy axis keys
      for (let key in axis) {
        if (this.hasOwnProperty(key)) {
          throw new Error('Cannot override existing key');
        } else {
          if (key !== '$') {
            this[key] = axis[key];
          }
        }
      }

      _initAxis(axis);

      this.__axis = axis;
    }

    set (a, b) {
      this.__axis.set.apply(null, arguments);
    }

    get $() {
      return this.__axis.$;
    }

    set $(state) {
      this.__axis.$ = state;
    }
  }

  const module = {
    Component: StateComponent,
    setAxis: _setAxis,
    set () {
      _axis.set.apply(null, arguments);
    }
  };

  // read-only accessor to current store
  Object.defineProperty(module, 'axis', {
    get() {
      return _axis;
    }
  });

  window.Axial = module;
})();