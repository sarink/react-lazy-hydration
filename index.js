'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var _extends = require('@babel/runtime/helpers/extends');
var _objectWithoutPropertiesLoose = require('@babel/runtime/helpers/objectWithoutPropertiesLoose');
var React = require('react');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var _extends__default = /*#__PURE__*/_interopDefaultLegacy(_extends);
var _objectWithoutPropertiesLoose__default = /*#__PURE__*/_interopDefaultLegacy(_objectWithoutPropertiesLoose);

var isBrowser = typeof document !== "undefined";

var event = "hydrate";
var io = ( isBrowser) && IntersectionObserver ? new IntersectionObserver(function (entries) {
  entries.forEach(function (entry) {
    if (entry.isIntersecting || entry.intersectionRatio > 0) {
      entry.target.dispatchEvent(new CustomEvent(event));
    }
  });
}, {
  rootMargin: "150px"
}) : null; // React currently throws a warning when using useLayoutEffect on the server.

var useIsomorphicLayoutEffect =  isBrowser ? React.useLayoutEffect : React.useEffect;

var LazyHydrate = function LazyHydrate(props) {
  var childRef = React.useRef(null); // Always render on server

  var _React$useState = React.useState(!( isBrowser)),
      hydrated = _React$useState[0],
      setHydrated = _React$useState[1];

  var noWrapper = props.noWrapper,
      ssrOnly = props.ssrOnly,
      whenIdle = props.whenIdle,
      whenVisible = props.whenVisible,
      promise = props.promise,
      _props$on = props.on,
      on = _props$on === void 0 ? [] : _props$on,
      children = props.children,
      didHydrate = props.didHydrate,
      listenOnEl = props.listenOnEl,
      rest = _objectWithoutPropertiesLoose__default['default'](props, ["noWrapper", "ssrOnly", "whenIdle", "whenVisible", "promise", "on", "children", "didHydrate", "listenOnEl"]);

  if ('production' !== process.env.NODE_ENV && !ssrOnly && !whenIdle && !whenVisible && !on.length && !promise) {
    console.error("LazyHydration: Enable atleast one trigger for hydration.\n" + "If you don't want to hydrate, use ssrOnly");
  }

  useIsomorphicLayoutEffect(function () {
    var _childRef$current;

    // No SSR Content
    if (!((_childRef$current = childRef.current) == null ? void 0 : _childRef$current.hasChildNodes())) {
      setHydrated(true);
    }
  }, []);
  React.useEffect(function () {
    if (ssrOnly || hydrated) return;
    var cleanupFns = [];

    function cleanup() {
      while (cleanupFns.length) {
        cleanupFns.pop()();
      }
    }

    function hydrate() {
      setHydrated(true);
      if (didHydrate) didHydrate();
    }

    if (promise) {
      promise.then(hydrate)["catch"](hydrate);
    }

    if (whenIdle) {
      if (window.requestIdleCallback) {
        var idleCallbackId = window.requestIdleCallback(hydrate, {
          timeout: 500
        });
        cleanupFns.push(function () {
          if (window.cancelIdleCallback) {
            window.cancelIdleCallback(idleCallbackId);
          }
        });
      } else {
        var id = setTimeout(hydrate, 2000);
        cleanupFns.push(function () {
          clearTimeout(id);
        });
      }
    }

    var events = Array.isArray(on) ? on.slice() : [on];

    if (whenVisible) {
      var _childRef$current2;

      if (io && ((_childRef$current2 = childRef.current) == null ? void 0 : _childRef$current2.childElementCount)) {
        // As root node does not have any box model, it cannot intersect.
        var el = childRef.current.children[0];
        io.observe(el);
        events.push(event);
        cleanupFns.push(function () {
          io.unobserve(el);
        });
      } else {
        return hydrate();
      }
    }

    var elToListenOn = listenOnEl || childRef.current;

    if (elToListenOn) {
      events.forEach(function (event) {
        elToListenOn.addEventListener(event, hydrate, {
          once: true,
          capture: true,
          passive: true
        });
        cleanupFns.push(function () {
          elToListenOn.removeEventListener(event, hydrate, {
            capture: true
          });
        });
      });
    }

    return cleanup;
  }, [hydrated, on, ssrOnly, whenIdle, whenVisible, didHydrate, promise]);

  if (hydrated) {
    if (noWrapper) {
      return /*#__PURE__*/React.createElement(React.Fragment, null, children);
    }

    return /*#__PURE__*/React.createElement("div", _extends__default['default']({
      ref: childRef,
      style: {
        display: "contents"
      }
    }, rest), children);
  } else {
    return /*#__PURE__*/React.createElement("div", _extends__default['default']({
      ref: childRef,
      style: {
        display: "contents"
      },
      suppressHydrationWarning: true
    }, rest, {
      dangerouslySetInnerHTML: {
        __html: ""
      }
    }));
  }
};

exports.default = LazyHydrate;
