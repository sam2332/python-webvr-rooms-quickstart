(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.RayInput = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
'use strict';

var has = Object.prototype.hasOwnProperty;

//
// We store our EE objects in a plain object whose properties are event names.
// If `Object.create(null)` is not supported we prefix the event names with a
// `~` to make sure that the built-in object properties are not overridden or
// used as an attack vector.
// We also assume that `Object.create(null)` is available when the event name
// is an ES6 Symbol.
//
var prefix = typeof Object.create !== 'function' ? '~' : false;

/**
 * Representation of a single EventEmitter function.
 *
 * @param {Function} fn Event handler to be called.
 * @param {Mixed} context Context for function execution.
 * @param {Boolean} [once=false] Only emit once
 * @api private
 */
function EE(fn, context, once) {
  this.fn = fn;
  this.context = context;
  this.once = once || false;
}

/**
 * Minimal EventEmitter interface that is molded against the Node.js
 * EventEmitter interface.
 *
 * @constructor
 * @api public
 */
function EventEmitter() { /* Nothing to set */ }

/**
 * Hold the assigned EventEmitters by name.
 *
 * @type {Object}
 * @private
 */
EventEmitter.prototype._events = undefined;

/**
 * Return an array listing the events for which the emitter has registered
 * listeners.
 *
 * @returns {Array}
 * @api public
 */
EventEmitter.prototype.eventNames = function eventNames() {
  var events = this._events
    , names = []
    , name;

  if (!events) return names;

  for (name in events) {
    if (has.call(events, name)) names.push(prefix ? name.slice(1) : name);
  }

  if (Object.getOwnPropertySymbols) {
    return names.concat(Object.getOwnPropertySymbols(events));
  }

  return names;
};

/**
 * Return a list of assigned event listeners.
 *
 * @param {String} event The events that should be listed.
 * @param {Boolean} exists We only need to know if there are listeners.
 * @returns {Array|Boolean}
 * @api public
 */
EventEmitter.prototype.listeners = function listeners(event, exists) {
  var evt = prefix ? prefix + event : event
    , available = this._events && this._events[evt];

  if (exists) return !!available;
  if (!available) return [];
  if (available.fn) return [available.fn];

  for (var i = 0, l = available.length, ee = new Array(l); i < l; i++) {
    ee[i] = available[i].fn;
  }

  return ee;
};

/**
 * Emit an event to all registered event listeners.
 *
 * @param {String} event The name of the event.
 * @returns {Boolean} Indication if we've emitted an event.
 * @api public
 */
EventEmitter.prototype.emit = function emit(event, a1, a2, a3, a4, a5) {
  var evt = prefix ? prefix + event : event;

  if (!this._events || !this._events[evt]) return false;

  var listeners = this._events[evt]
    , len = arguments.length
    , args
    , i;

  if ('function' === typeof listeners.fn) {
    if (listeners.once) this.removeListener(event, listeners.fn, undefined, true);

    switch (len) {
      case 1: return listeners.fn.call(listeners.context), true;
      case 2: return listeners.fn.call(listeners.context, a1), true;
      case 3: return listeners.fn.call(listeners.context, a1, a2), true;
      case 4: return listeners.fn.call(listeners.context, a1, a2, a3), true;
      case 5: return listeners.fn.call(listeners.context, a1, a2, a3, a4), true;
      case 6: return listeners.fn.call(listeners.context, a1, a2, a3, a4, a5), true;
    }

    for (i = 1, args = new Array(len -1); i < len; i++) {
      args[i - 1] = arguments[i];
    }

    listeners.fn.apply(listeners.context, args);
  } else {
    var length = listeners.length
      , j;

    for (i = 0; i < length; i++) {
      if (listeners[i].once) this.removeListener(event, listeners[i].fn, undefined, true);

      switch (len) {
        case 1: listeners[i].fn.call(listeners[i].context); break;
        case 2: listeners[i].fn.call(listeners[i].context, a1); break;
        case 3: listeners[i].fn.call(listeners[i].context, a1, a2); break;
        default:
          if (!args) for (j = 1, args = new Array(len -1); j < len; j++) {
            args[j - 1] = arguments[j];
          }

          listeners[i].fn.apply(listeners[i].context, args);
      }
    }
  }

  return true;
};

/**
 * Register a new EventListener for the given event.
 *
 * @param {String} event Name of the event.
 * @param {Function} fn Callback function.
 * @param {Mixed} [context=this] The context of the function.
 * @api public
 */
EventEmitter.prototype.on = function on(event, fn, context) {
  var listener = new EE(fn, context || this)
    , evt = prefix ? prefix + event : event;

  if (!this._events) this._events = prefix ? {} : Object.create(null);
  if (!this._events[evt]) this._events[evt] = listener;
  else {
    if (!this._events[evt].fn) this._events[evt].push(listener);
    else this._events[evt] = [
      this._events[evt], listener
    ];
  }

  return this;
};

/**
 * Add an EventListener that's only called once.
 *
 * @param {String} event Name of the event.
 * @param {Function} fn Callback function.
 * @param {Mixed} [context=this] The context of the function.
 * @api public
 */
EventEmitter.prototype.once = function once(event, fn, context) {
  var listener = new EE(fn, context || this, true)
    , evt = prefix ? prefix + event : event;

  if (!this._events) this._events = prefix ? {} : Object.create(null);
  if (!this._events[evt]) this._events[evt] = listener;
  else {
    if (!this._events[evt].fn) this._events[evt].push(listener);
    else this._events[evt] = [
      this._events[evt], listener
    ];
  }

  return this;
};

/**
 * Remove event listeners.
 *
 * @param {String} event The event we want to remove.
 * @param {Function} fn The listener that we need to find.
 * @param {Mixed} context Only remove listeners matching this context.
 * @param {Boolean} once Only remove once listeners.
 * @api public
 */
EventEmitter.prototype.removeListener = function removeListener(event, fn, context, once) {
  var evt = prefix ? prefix + event : event;

  if (!this._events || !this._events[evt]) return this;

  var listeners = this._events[evt]
    , events = [];

  if (fn) {
    if (listeners.fn) {
      if (
           listeners.fn !== fn
        || (once && !listeners.once)
        || (context && listeners.context !== context)
      ) {
        events.push(listeners);
      }
    } else {
      for (var i = 0, length = listeners.length; i < length; i++) {
        if (
             listeners[i].fn !== fn
          || (once && !listeners[i].once)
          || (context && listeners[i].context !== context)
        ) {
          events.push(listeners[i]);
        }
      }
    }
  }

  //
  // Reset the array, or remove it completely if we have no more listeners.
  //
  if (events.length) {
    this._events[evt] = events.length === 1 ? events[0] : events;
  } else {
    delete this._events[evt];
  }

  return this;
};

/**
 * Remove all listeners or only the listeners for the specified event.
 *
 * @param {String} event The event want to remove all listeners for.
 * @api public
 */
EventEmitter.prototype.removeAllListeners = function removeAllListeners(event) {
  if (!this._events) return this;

  if (event) delete this._events[prefix ? prefix + event : event];
  else this._events = prefix ? {} : Object.create(null);

  return this;
};

//
// Alias methods names because people roll like that.
//
EventEmitter.prototype.off = EventEmitter.prototype.removeListener;
EventEmitter.prototype.addListener = EventEmitter.prototype.on;

//
// This function doesn't apply anymore.
//
EventEmitter.prototype.setMaxListeners = function setMaxListeners() {
  return this;
};

//
// Expose the prefix.
//
EventEmitter.prefixed = prefix;

//
// Expose the module.
//
if ('undefined' !== typeof module) {
  module.exports = EventEmitter;
}

},{}],2:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/*
 * Copyright 2016 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var HEAD_ELBOW_OFFSET_RIGHTHANDED = new THREE.Vector3(0.155, -0.465, -0.15);
var HEAD_ELBOW_OFFSET_LEFTHANDED = new THREE.Vector3(-0.155, -0.465, -0.15);
var headElbowOffset = HEAD_ELBOW_OFFSET_RIGHTHANDED;
var ELBOW_WRIST_OFFSET = new THREE.Vector3(0, 0, -0.25);
var WRIST_CONTROLLER_OFFSET = new THREE.Vector3(0, 0, 0.05);
var ARM_EXTENSION_OFFSET = new THREE.Vector3(-0.08, 0.14, 0.08);

var ELBOW_BEND_RATIO = 0.4; // 40% elbow, 60% wrist.
var EXTENSION_RATIO_WEIGHT = 0.4;

var MIN_ANGULAR_SPEED = 0.61; // 35 degrees per second (in radians).

/**
 * Represents the arm model for the Daydream controller. Feed it a camera and
 * the controller. Update it on a RAF.
 *
 * Get the model's pose using getPose().
 */

var OrientationArmModel = function () {
  function OrientationArmModel() {
    _classCallCheck(this, OrientationArmModel);

    this.isLeftHanded = false;

    // Current and previous controller orientations.
    this.controllerQ = new THREE.Quaternion();
    this.lastControllerQ = new THREE.Quaternion();

    // Current and previous head orientations.
    this.headQ = new THREE.Quaternion();

    // Current head position.
    this.headPos = new THREE.Vector3();

    // Positions of other joints (mostly for debugging).
    this.elbowPos = new THREE.Vector3();
    this.wristPos = new THREE.Vector3();

    // Current and previous times the model was updated.
    this.time = null;
    this.lastTime = null;

    // Root rotation.
    this.rootQ = new THREE.Quaternion();

    // Current pose that this arm model calculates.
    this.pose = {
      orientation: new THREE.Quaternion(),
      position: new THREE.Vector3()
    };
  }

  /**
   * Methods to set controller and head pose (in world coordinates).
   */


  _createClass(OrientationArmModel, [{
    key: 'setControllerOrientation',
    value: function setControllerOrientation(quaternion) {
      this.lastControllerQ.copy(this.controllerQ);
      this.controllerQ.copy(quaternion);
    }
  }, {
    key: 'setHeadOrientation',
    value: function setHeadOrientation(quaternion) {
      this.headQ.copy(quaternion);
    }
  }, {
    key: 'setHeadPosition',
    value: function setHeadPosition(position) {
      this.headPos.copy(position);
    }
  }, {
    key: 'setLeftHanded',
    value: function setLeftHanded(isLeftHanded) {
      this.isLeftHanded = isLeftHanded;
      if (isLeftHanded) {
        headElbowOffset = HEAD_ELBOW_OFFSET_LEFTHANDED;
      } else {
        headElbowOffset = HEAD_ELBOW_OFFSET_RIGHTHANDED;
      }
    }

    /**
     * Called on a RAF.
     */

  }, {
    key: 'update',
    value: function update() {
      this.time = performance.now();

      // If the controller's angular velocity is above a certain amount, we can
      // assume torso rotation and move the elbow joint relative to the
      // camera orientation.
      var headYawQ = this.getHeadYawOrientation_();
      var timeDelta = (this.time - this.lastTime) / 1000;
      var angleDelta = this.quatAngle_(this.lastControllerQ, this.controllerQ);
      var controllerAngularSpeed = angleDelta / timeDelta;
      if (controllerAngularSpeed > MIN_ANGULAR_SPEED) {
        // Attenuate the Root rotation slightly.
        this.rootQ.slerp(headYawQ, angleDelta / 10);
      } else {
        this.rootQ.copy(headYawQ);
      }

      // We want to move the elbow up and to the center as the user points the
      // controller upwards, so that they can easily see the controller and its
      // tool tips.
      var controllerEuler = new THREE.Euler().setFromQuaternion(this.controllerQ, 'YXZ');
      var controllerXDeg = THREE.Math.radToDeg(controllerEuler.x);
      var extensionRatio = this.clamp_((controllerXDeg - 11) / (50 - 11), 0, 1);

      // Controller orientation in camera space.
      var controllerCameraQ = this.rootQ.clone().inverse();
      controllerCameraQ.multiply(this.controllerQ);

      // Calculate elbow position.
      var elbowPos = this.elbowPos;
      elbowPos.copy(this.headPos).add(headElbowOffset);
      var elbowOffset = new THREE.Vector3().copy(ARM_EXTENSION_OFFSET);
      elbowOffset.multiplyScalar(extensionRatio);
      elbowPos.add(elbowOffset);

      // Calculate joint angles. Generally 40% of rotation applied to elbow, 60%
      // to wrist, but if controller is raised higher, more rotation comes from
      // the wrist.
      var totalAngle = this.quatAngle_(controllerCameraQ, new THREE.Quaternion());
      var totalAngleDeg = THREE.Math.radToDeg(totalAngle);
      var lerpSuppression = 1 - Math.pow(totalAngleDeg / 180, 4); // TODO(smus): ???

      var elbowRatio = ELBOW_BEND_RATIO;
      var wristRatio = 1 - ELBOW_BEND_RATIO;
      var lerpValue = lerpSuppression * (elbowRatio + wristRatio * extensionRatio * EXTENSION_RATIO_WEIGHT);

      var wristQ = new THREE.Quaternion().slerp(controllerCameraQ, lerpValue);
      var invWristQ = wristQ.inverse();
      var elbowQ = controllerCameraQ.clone().multiply(invWristQ);

      // Calculate our final controller position based on all our joint rotations
      // and lengths.
      /*
      position_ =
        root_rot_ * (
          controller_root_offset_ +
      2:      (arm_extension_ * amt_extension) +
      1:      elbow_rot * (kControllerForearm + (wrist_rot * kControllerPosition))
        );
      */
      var wristPos = this.wristPos;
      wristPos.copy(WRIST_CONTROLLER_OFFSET);
      wristPos.applyQuaternion(wristQ);
      wristPos.add(ELBOW_WRIST_OFFSET);
      wristPos.applyQuaternion(elbowQ);
      wristPos.add(this.elbowPos);

      var offset = new THREE.Vector3().copy(ARM_EXTENSION_OFFSET);
      offset.multiplyScalar(extensionRatio);

      var position = new THREE.Vector3().copy(this.wristPos);
      position.add(offset);
      position.applyQuaternion(this.rootQ);

      var orientation = new THREE.Quaternion().copy(this.controllerQ);

      // Set the resulting pose orientation and position.
      this.pose.orientation.copy(orientation);
      this.pose.position.copy(position);

      this.lastTime = this.time;
    }

    /**
     * Returns the pose calculated by the model.
     */

  }, {
    key: 'getPose',
    value: function getPose() {
      return this.pose;
    }

    /**
     * Debug methods for rendering the arm model.
     */

  }, {
    key: 'getForearmLength',
    value: function getForearmLength() {
      return ELBOW_WRIST_OFFSET.length();
    }
  }, {
    key: 'getElbowPosition',
    value: function getElbowPosition() {
      var out = this.elbowPos.clone();
      return out.applyQuaternion(this.rootQ);
    }
  }, {
    key: 'getWristPosition',
    value: function getWristPosition() {
      var out = this.wristPos.clone();
      return out.applyQuaternion(this.rootQ);
    }
  }, {
    key: 'getHeadYawOrientation_',
    value: function getHeadYawOrientation_() {
      var headEuler = new THREE.Euler().setFromQuaternion(this.headQ, 'YXZ');
      headEuler.x = 0;
      headEuler.z = 0;
      var destinationQ = new THREE.Quaternion().setFromEuler(headEuler);
      return destinationQ;
    }
  }, {
    key: 'clamp_',
    value: function clamp_(value, min, max) {
      return Math.min(Math.max(value, min), max);
    }
  }, {
    key: 'quatAngle_',
    value: function quatAngle_(q1, q2) {
      var vec1 = new THREE.Vector3(0, 0, -1);
      var vec2 = new THREE.Vector3(0, 0, -1);
      vec1.applyQuaternion(q1);
      vec2.applyQuaternion(q2);
      return vec1.angleTo(vec2);
    }
  }]);

  return OrientationArmModel;
}();

exports.default = OrientationArmModel;

},{}],3:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _eventemitter = require('eventemitter3');

var _eventemitter2 = _interopRequireDefault(_eventemitter);

var _rayInteractionModes = require('./ray-interaction-modes');

var _rayInteractionModes2 = _interopRequireDefault(_rayInteractionModes);

var _util = require('./util');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /*
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * Copyright 2016 Google Inc. All Rights Reserved.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * Licensed under the Apache License, Version 2.0 (the "License");
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * you may not use this file except in compliance with the License.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * You may obtain a copy of the License at
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                *
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                *     http://www.apache.org/licenses/LICENSE-2.0
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                *
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * Unless required by applicable law or agreed to in writing, software
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * distributed under the License is distributed on an "AS IS" BASIS,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * See the License for the specific language governing permissions and
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * limitations under the License.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                */

var DRAG_DISTANCE_PX = 10;

/**
 * Enumerates all possible interaction modes. Sets up all event handlers (mouse,
 * touch, etc), interfaces with gamepad API.
 *
 * Emits events:
 *    action: Input is activated (mousedown, touchstart, daydream click, vive
 *    trigger).
 *    release: Input is deactivated (mouseup, touchend, daydream release, vive
 *    release).
 *    cancel: Input is canceled (eg. we scrolled instead of tapping on
 *    mobile/desktop).
 *    pointermove(2D position): The pointer is moved (mouse or touch).
 */

var RayController = function (_EventEmitter) {
  _inherits(RayController, _EventEmitter);

  function RayController(opt_el) {
    _classCallCheck(this, RayController);

    var _this = _possibleConstructorReturn(this, (RayController.__proto__ || Object.getPrototypeOf(RayController)).call(this));

    var el = opt_el || window;

    // Handle interactions.
    el.addEventListener('mousedown', _this.onMouseDown_.bind(_this));
    el.addEventListener('mousemove', _this.onMouseMove_.bind(_this));
    el.addEventListener('mouseup', _this.onMouseUp_.bind(_this));
    el.addEventListener('touchstart', _this.onTouchStart_.bind(_this));
    el.addEventListener('touchmove', _this.onTouchMove_.bind(_this));
    el.addEventListener('touchend', _this.onTouchEnd_.bind(_this));

    // The position of the pointer.
    _this.pointer = new THREE.Vector2();
    // The previous position of the pointer.
    _this.lastPointer = new THREE.Vector2();
    // Position of pointer in Normalized Device Coordinates (NDC).
    _this.pointerNdc = new THREE.Vector2();
    // How much we have dragged (if we are dragging).
    _this.dragDistance = 0;
    // Are we dragging or not.
    _this.isDragging = false;
    // Is pointer active or not.
    _this.isTouchActive = false;
    // Is this a synthetic mouse event?
    _this.isSyntheticMouseEvent = false;
    // Is lefthanded.
    _this.isLeftHanded = false;
    // Gamepad events.
    _this.gamepad = null;

    // VR Events.
    if (!navigator.getVRDisplays) {
      console.warn('WebVR API not available! Consider using the webvr-polyfill.');
    } else {
      navigator.getVRDisplays().then(function (displays) {
        _this.vrDisplay = displays[0];
      });
    }
    return _this;
  }

  _createClass(RayController, [{
    key: 'getInteractionMode',
    value: function getInteractionMode() {
      // TODO: Debugging only.
      //return InteractionModes.DAYDREAM;

      var gamepad = this.getVRGamepad_();

      this.gamepad = gamepad;
      if (gamepad) {
        if (gamepad.hand) {
          this.isLeftHanded = gamepad.hand === 'left';
        }
        var pose = gamepad.pose;

        if (!pose) {
          // Cardboard touch emulation reports as a 0-DOF
          // 1-button clicker gamepad.
          return _rayInteractionModes2.default.VR_0DOF;
        }

        // If there's a gamepad connected, determine if it's Daydream or a Vive.
        if (pose.hasPosition) {
          return _rayInteractionModes2.default.VR_6DOF;
        }

        if (pose.hasOrientation) {
          return _rayInteractionModes2.default.VR_3DOF;
        }
      } else {
        // If there's no gamepad, it might be Cardboard, magic window or desktop.
        if ((0, _util.isMobile)()) {
          // Either Cardboard or magic window, depending on whether we are
          // presenting.
          if (this.vrDisplay && this.vrDisplay.isPresenting) {
            return _rayInteractionModes2.default.VR_0DOF;
          } else {
            return _rayInteractionModes2.default.TOUCH;
          }
        } else {
          // We must be on desktop.
          return _rayInteractionModes2.default.MOUSE;
        }
      }
      // By default, use TOUCH.
      return _rayInteractionModes2.default.TOUCH;
    }
  }, {
    key: 'getGamepadPose',
    value: function getGamepadPose() {
      var gamepad = this.getVRGamepad_();
      return gamepad.pose || {};
    }

    /**
     * Get if there is an active touch event going on.
     * Only relevant on touch devices
     */

  }, {
    key: 'getIsTouchActive',
    value: function getIsTouchActive() {
      return this.isTouchActive;
    }

    /**
     * Checks if this click is the cardboard-compatible fallback
     * click on Daydream controllers so that we can deduplicate it.
     * This happens on Chrome <=61 when a Daydream controller
     * is active, it registers as a 3DOF device. Not applicable
     * for Chrome >= 62 or other browsers which don't do this.
     *
     * Also need to handle Daydream View on Chrome 61 which in
     * Cardboard mode exposes both the 0DOF clicker device and
     * the compatibility click.
     */

  }, {
    key: 'isCardboardCompatClick',
    value: function isCardboardCompatClick(e) {
      var mode = this.getInteractionMode();
      if ((mode == _rayInteractionModes2.default.VR_0DOF || mode == _rayInteractionModes2.default.VR_3DOF) && e.screenX == 0 && e.screenY == 0) {
        return true;
      }
      return false;
    }
  }, {
    key: 'setSize',
    value: function setSize(size) {
      this.size = size;
    }
  }, {
    key: 'update',
    value: function update() {
      var mode = this.getInteractionMode();
      if (mode == _rayInteractionModes2.default.VR_0DOF || mode == _rayInteractionModes2.default.VR_3DOF || mode == _rayInteractionModes2.default.VR_6DOF) {
        // If we're dealing with a gamepad, check every animation frame for a
        // pressed action.
        var isGamepadPressed = this.getGamepadButtonPressed_();
        if (isGamepadPressed && !this.wasGamepadPressed) {
          this.emit('raydown');
        }
        if (!isGamepadPressed && this.wasGamepadPressed) {
          this.emit('rayup');
        }
        this.wasGamepadPressed = isGamepadPressed;
      }
    }
  }, {
    key: 'getGamepadButtonPressed_',
    value: function getGamepadButtonPressed_() {
      var gamepad = this.getVRGamepad_();
      if (!gamepad) {
        // If there's no gamepad, the button was not pressed.
        return false;
      }
      // Check for clicks.
      for (var j = 0; j < gamepad.buttons.length; ++j) {
        if (gamepad.buttons[j].pressed) {
          return true;
        }
      }
      return false;
    }
  }, {
    key: 'onMouseDown_',
    value: function onMouseDown_(e) {
      if (this.isSyntheticMouseEvent) return;
      if (this.isCardboardCompatClick(e)) return;

      this.startDragging_(e);
      this.emit('raydown');
    }
  }, {
    key: 'onMouseMove_',
    value: function onMouseMove_(e) {
      if (this.isSyntheticMouseEvent) return;

      this.updatePointer_(e);
      this.updateDragDistance_();
      this.emit('pointermove', this.pointerNdc);
    }
  }, {
    key: 'onMouseUp_',
    value: function onMouseUp_(e) {
      var isSynthetic = this.isSyntheticMouseEvent;
      this.isSyntheticMouseEvent = false;
      if (isSynthetic) return;
      if (this.isCardboardCompatClick(e)) return;

      this.endDragging_();
    }
  }, {
    key: 'onTouchStart_',
    value: function onTouchStart_(e) {
      this.isTouchActive = true;
      var t = e.touches[0];
      this.startDragging_(t);
      this.updateTouchPointer_(e);

      this.emit('pointermove', this.pointerNdc);
      this.emit('raydown');
    }
  }, {
    key: 'onTouchMove_',
    value: function onTouchMove_(e) {
      this.updateTouchPointer_(e);
      this.updateDragDistance_();
    }
  }, {
    key: 'onTouchEnd_',
    value: function onTouchEnd_(e) {
      this.endDragging_();

      // Suppress duplicate events from synthetic mouse events.
      this.isSyntheticMouseEvent = true;
      this.isTouchActive = false;
    }
  }, {
    key: 'updateTouchPointer_',
    value: function updateTouchPointer_(e) {
      // If there's no touches array, ignore.
      if (e.touches.length === 0) {
        console.warn('Received touch event with no touches.');
        return;
      }
      var t = e.touches[0];
      this.updatePointer_(t);
    }
  }, {
    key: 'updatePointer_',
    value: function updatePointer_(e) {
      // How much the pointer moved.
      this.pointer.set(e.clientX, e.clientY);
      this.pointerNdc.x = e.clientX / this.size.width * 2 - 1;
      this.pointerNdc.y = -(e.clientY / this.size.height) * 2 + 1;
    }
  }, {
    key: 'updateDragDistance_',
    value: function updateDragDistance_() {
      if (this.isDragging) {
        var distance = this.lastPointer.sub(this.pointer).length();
        this.dragDistance += distance;
        this.lastPointer.copy(this.pointer);

        //console.log('dragDistance', this.dragDistance);
        if (this.dragDistance > DRAG_DISTANCE_PX) {
          this.emit('raycancel');
          this.isDragging = false;
        }
      }
    }
  }, {
    key: 'startDragging_',
    value: function startDragging_(e) {
      this.isDragging = true;
      this.lastPointer.set(e.clientX, e.clientY);
    }
  }, {
    key: 'endDragging_',
    value: function endDragging_() {
      if (this.dragDistance < DRAG_DISTANCE_PX) {
        this.emit('rayup');
      }
      this.dragDistance = 0;
      this.isDragging = false;
    }

    /**
     * Gets the first VR-enabled gamepad.
     */

  }, {
    key: 'getVRGamepad_',
    value: function getVRGamepad_() {
      // If there's no gamepad API, there's no gamepad.
      if (!navigator.getGamepads) {
        return null;
      }

      var gamepads = navigator.getGamepads();
      for (var i = 0; i < gamepads.length; ++i) {
        var gamepad = gamepads[i];

        // The array may contain undefined gamepads, so check for that as well as
        // a non-null pose. Clicker devices such as Cardboard button emulation
        // have a displayId but no pose.
        if (gamepad && (gamepad.pose || gamepad.displayId)) {
          return gamepad;
        }
      }
      return null;
    }
  }]);

  return RayController;
}(_eventemitter2.default);

exports.default = RayController;

},{"./ray-interaction-modes":5,"./util":7,"eventemitter3":1}],4:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _orientationArmModel = require('./orientation-arm-model');

var _orientationArmModel2 = _interopRequireDefault(_orientationArmModel);

var _eventemitter = require('eventemitter3');

var _eventemitter2 = _interopRequireDefault(_eventemitter);

var _rayRenderer = require('./ray-renderer');

var _rayRenderer2 = _interopRequireDefault(_rayRenderer);

var _rayController = require('./ray-controller');

var _rayController2 = _interopRequireDefault(_rayController);

var _rayInteractionModes = require('./ray-interaction-modes');

var _rayInteractionModes2 = _interopRequireDefault(_rayInteractionModes);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /*
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * Copyright 2016 Google Inc. All Rights Reserved.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * Licensed under the Apache License, Version 2.0 (the "License");
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * you may not use this file except in compliance with the License.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * You may obtain a copy of the License at
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                *
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                *     http://www.apache.org/licenses/LICENSE-2.0
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                *
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * Unless required by applicable law or agreed to in writing, software
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * distributed under the License is distributed on an "AS IS" BASIS,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * See the License for the specific language governing permissions and
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * limitations under the License.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                */

/**
 * API wrapper for the input library.
 */
var RayInput = function (_EventEmitter) {
  _inherits(RayInput, _EventEmitter);

  function RayInput(camera, opt_el) {
    _classCallCheck(this, RayInput);

    var _this = _possibleConstructorReturn(this, (RayInput.__proto__ || Object.getPrototypeOf(RayInput)).call(this));

    _this.camera = camera;
    _this.renderer = new _rayRenderer2.default(camera);
    _this.controller = new _rayController2.default(opt_el);

    // Arm model needed to transform controller orientation into proper pose.
    _this.armModel = new _orientationArmModel2.default();

    _this.controller.on('raydown', _this.onRayDown_.bind(_this));
    _this.controller.on('rayup', _this.onRayUp_.bind(_this));
    _this.controller.on('raycancel', _this.onRayCancel_.bind(_this));
    _this.controller.on('pointermove', _this.onPointerMove_.bind(_this));
    _this.renderer.on('rayover', function (mesh) {
      _this.emit('rayover', mesh);
    });
    _this.renderer.on('rayout', function (mesh) {
      _this.emit('rayout', mesh);
    });

    // By default, put the pointer offscreen.
    _this.pointerNdc = new THREE.Vector2(1, 1);

    // Event handlers.
    _this.handlers = {};
    return _this;
  }

  _createClass(RayInput, [{
    key: 'add',
    value: function add(object, handlers) {
      this.renderer.add(object, handlers);
      this.handlers[object.id] = handlers;
    }
  }, {
    key: 'remove',
    value: function remove(object) {
      this.renderer.remove(object);
      delete this.handlers[object.id];
    }
  }, {
    key: 'update',
    value: function update() {
      var lookAt = new THREE.Vector3(0, 0, -1);
      lookAt.applyQuaternion(this.camera.quaternion);

      var mode = this.controller.getInteractionMode();
      switch (mode) {
        case _rayInteractionModes2.default.MOUSE:
          // Desktop mouse mode, mouse coordinates are what matters.
          this.renderer.setPointer(this.pointerNdc);
          // Hide the ray and reticle.
          this.renderer.setRayVisibility(false);
          this.renderer.setReticleVisibility(false);

          // In mouse mode ray renderer is always active.
          this.renderer.setActive(true);
          break;

        case _rayInteractionModes2.default.TOUCH:
          // Mobile magic window mode. Touch coordinates matter, but we want to
          // hide the reticle.
          this.renderer.setPointer(this.pointerNdc);

          // Hide the ray and the reticle.
          this.renderer.setRayVisibility(false);
          this.renderer.setReticleVisibility(false);

          // In touch mode the ray renderer is only active on touch.
          this.renderer.setActive(this.controller.getIsTouchActive());
          break;

        case _rayInteractionModes2.default.VR_0DOF:
          // Cardboard mode, we're dealing with a gaze reticle.
          this.renderer.setPosition(this.camera.position);
          this.renderer.setOrientation(this.camera.quaternion);

          // Reticle only.
          this.renderer.setRayVisibility(false);
          this.renderer.setReticleVisibility(true);

          // Ray renderer always active.
          this.renderer.setActive(true);
          break;

        case _rayInteractionModes2.default.VR_3DOF:
          // Daydream, our origin is slightly off (depending on handedness).
          // But we should be using the orientation from the gamepad.
          // TODO(smus): Implement the real arm model.
          var pose = this.controller.getGamepadPose();

          // Debug only: use camera as input controller.
          //let controllerOrientation = this.camera.quaternion;
          var controllerOrientation = new THREE.Quaternion().fromArray(pose.orientation);

          // Transform the controller into the camera coordinate system.
          /*
          controllerOrientation.multiply(
              new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI));
          controllerOrientation.x *= -1;
          controllerOrientation.z *= -1;
          */

          // Feed camera and controller into the arm model.
          this.armModel.setHeadOrientation(this.camera.quaternion);
          this.armModel.setHeadPosition(this.camera.position);
          this.armModel.setControllerOrientation(controllerOrientation);
          this.armModel.setLeftHanded(this.controller.isLeftHanded);
          this.armModel.update();

          // Get resulting pose and configure the renderer.
          var modelPose = this.armModel.getPose();
          this.renderer.setPosition(modelPose.position);
          //this.renderer.setPosition(new THREE.Vector3());
          this.renderer.setOrientation(modelPose.orientation);
          //this.renderer.setOrientation(controllerOrientation);

          // Show ray and reticle.
          this.renderer.setRayVisibility(true);
          this.renderer.setReticleVisibility(true);

          // Ray renderer always active.
          this.renderer.setActive(true);
          break;

        case _rayInteractionModes2.default.VR_6DOF:
          // Vive, origin depends on the position of the controller.
          // TODO(smus)...
          var pose = this.controller.getGamepadPose();

          // Check that the pose is valid.
          if (!pose.orientation || !pose.position) {
            console.warn('Invalid gamepad pose. Can\'t update ray.');
            break;
          }
          var orientation = new THREE.Quaternion().fromArray(pose.orientation);
          var position = new THREE.Vector3().fromArray(pose.position);

          this.renderer.setOrientation(orientation);
          this.renderer.setPosition(position);

          // Show ray and reticle.
          this.renderer.setRayVisibility(true);
          this.renderer.setReticleVisibility(true);

          // Ray renderer always active.
          this.renderer.setActive(true);
          break;

        default:
          console.error('Unknown interaction mode.');
      }
      this.renderer.update();
      this.controller.update();
    }
  }, {
    key: 'setSize',
    value: function setSize(size) {
      this.controller.setSize(size);
    }
  }, {
    key: 'getMesh',
    value: function getMesh() {
      return this.renderer.getReticleRayMesh();
    }
  }, {
    key: 'getOrigin',
    value: function getOrigin() {
      return this.renderer.getOrigin();
    }
  }, {
    key: 'getDirection',
    value: function getDirection() {
      return this.renderer.getDirection();
    }
  }, {
    key: 'getRightDirection',
    value: function getRightDirection() {
      var lookAt = new THREE.Vector3(0, 0, -1);
      lookAt.applyQuaternion(this.camera.quaternion);
      return new THREE.Vector3().crossVectors(lookAt, this.camera.up);
    }
  }, {
    key: 'onRayDown_',
    value: function onRayDown_(e) {
      //console.log('onRayDown_');

      // Force the renderer to raycast.
      this.renderer.update();
      var mesh = this.renderer.getSelectedMesh();
      this.emit('raydown', mesh);

      this.renderer.setActive(true);
    }
  }, {
    key: 'onRayUp_',
    value: function onRayUp_(e) {
      //console.log('onRayUp_');
      var mesh = this.renderer.getSelectedMesh();
      this.emit('rayup', mesh);

      this.renderer.setActive(false);
    }
  }, {
    key: 'onRayCancel_',
    value: function onRayCancel_(e) {
      //console.log('onRayCancel_');
      var mesh = this.renderer.getSelectedMesh();
      this.emit('raycancel', mesh);
    }
  }, {
    key: 'onPointerMove_',
    value: function onPointerMove_(ndc) {
      this.pointerNdc.copy(ndc);
    }
  }]);

  return RayInput;
}(_eventemitter2.default);

exports.default = RayInput;

},{"./orientation-arm-model":2,"./ray-controller":3,"./ray-interaction-modes":5,"./ray-renderer":6,"eventemitter3":1}],5:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
/*
 * Copyright 2016 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var InteractionModes = {
  MOUSE: 1,
  TOUCH: 2,
  VR_0DOF: 3,
  VR_3DOF: 4,
  VR_6DOF: 5
};

exports.default = InteractionModes;

},{}],6:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _util = require('./util');

var _eventemitter = require('eventemitter3');

var _eventemitter2 = _interopRequireDefault(_eventemitter);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /*
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * Copyright 2016 Google Inc. All Rights Reserved.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * Licensed under the Apache License, Version 2.0 (the "License");
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * you may not use this file except in compliance with the License.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * You may obtain a copy of the License at
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                *
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                *     http://www.apache.org/licenses/LICENSE-2.0
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                *
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * Unless required by applicable law or agreed to in writing, software
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * distributed under the License is distributed on an "AS IS" BASIS,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * See the License for the specific language governing permissions and
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * limitations under the License.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                */

var RETICLE_DISTANCE = 3;
var INNER_RADIUS = 0.02;
var OUTER_RADIUS = 0.04;
var RAY_RADIUS = 0.02;
var GRADIENT_IMAGE = (0, _util.base64)('image/png', 'iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAABdklEQVR4nO3WwXHEQAwDQcin/FOWw+BjuiPYB2q4G2nP933P9SO4824zgDADiDOAuHfb3/UjuKMAcQYQZwBx/gBxChCnAHEKEKcAcQoQpwBxChCnAHEGEGcAcf4AcQoQZwBxBhBnAHEGEGcAcQYQZwBxBhBnAHEGEGcAcQYQZwBxBhBnAHHvtt/1I7ijAHEGEGcAcf4AcQoQZwBxTkCcAsQZQJwTEKcAcQoQpwBxBhDnBMQpQJwCxClAnALEKUCcAsQpQJwCxClAnALEKUCcAsQpQJwBxDkBcQoQpwBxChCnAHEKEKcAcQoQpwBxChCnAHEKEGcAcU5AnALEKUCcAsQZQJwTEKcAcQYQ5wTEKUCcAcQZQJw/QJwCxBlAnAHEGUCcAcQZQJwBxBlAnAHEGUCcAcQZQJwBxBlAnAHEGUDcu+25fgR3FCDOAOIMIM4fIE4B4hQgTgHiFCBOAeIUIE4B4hQgzgDiDCDOHyBOAeIMIM4A4v4B/5IF9eD6QxgAAAAASUVORK5CYII=');

/**
 * Handles ray input selection from frame of reference of an arbitrary object.
 *
 * The source of the ray is from various locations:
 *
 * Desktop: mouse.
 * Magic window: touch.
 * Cardboard: camera.
 * Daydream: 3DOF controller via gamepad (and show ray).
 * Vive: 6DOF controller via gamepad (and show ray).
 *
 * Emits selection events:
 *     rayover(mesh): This mesh was selected.
 *     rayout(mesh): This mesh was unselected.
 */

var RayRenderer = function (_EventEmitter) {
  _inherits(RayRenderer, _EventEmitter);

  function RayRenderer(camera, opt_params) {
    _classCallCheck(this, RayRenderer);

    var _this = _possibleConstructorReturn(this, (RayRenderer.__proto__ || Object.getPrototypeOf(RayRenderer)).call(this));

    _this.camera = camera;

    var params = opt_params || {};

    // Which objects are interactive (keyed on id).
    _this.meshes = {};

    // Which objects are currently selected (keyed on id).
    _this.selected = {};

    // The raycaster.
    _this.raycaster = new THREE.Raycaster();

    // Position and orientation, in addition.
    _this.position = new THREE.Vector3();
    _this.orientation = new THREE.Quaternion();

    _this.root = new THREE.Object3D();

    // Add the reticle mesh to the root of the object.
    _this.reticle = _this.createReticle_();
    _this.root.add(_this.reticle);

    // Add the ray to the root of the object.
    _this.ray = _this.createRay_();
    _this.root.add(_this.ray);

    // How far the reticle is currently from the reticle origin.
    _this.reticleDistance = RETICLE_DISTANCE;
    return _this;
  }

  /**
   * Register an object so that it can be interacted with.
   */


  _createClass(RayRenderer, [{
    key: 'add',
    value: function add(object) {
      this.meshes[object.id] = object;
    }

    /**
     * Prevent an object from being interacted with.
     */

  }, {
    key: 'remove',
    value: function remove(object) {
      var id = object.id;
      if (this.meshes[id]) {
        // If there's no existing mesh, we can't remove it.
        delete this.meshes[id];
      }
      // If the object is currently selected, remove it.
      if (this.selected[id]) {
        delete this.selected[object.id];
      }
    }
  }, {
    key: 'update',
    value: function update() {
      // Do the raycasting and issue various events as needed.
      for (var id in this.meshes) {
        var mesh = this.meshes[id];
        var intersects = this.raycaster.intersectObject(mesh, true);
        if (intersects.length > 1) {
          console.warn('Unexpected: multiple meshes intersected.');
        }
        var isIntersected = intersects.length > 0;
        var isSelected = this.selected[id];

        // If it's newly selected, send rayover.
        if (isIntersected && !isSelected) {
          this.selected[id] = true;
          if (this.isActive) {
            this.emit('rayover', mesh);
          }
        }

        // If it's no longer intersected, send rayout.
        if (!isIntersected && isSelected) {
          delete this.selected[id];
          this.moveReticle_(null);
          if (this.isActive) {
            this.emit('rayout', mesh);
          }
        }

        if (isIntersected) {
          this.moveReticle_(intersects);
        }
      }
    }

    /**
     * Sets the origin of the ray.
     * @param {Vector} vector Position of the origin of the picking ray.
     */

  }, {
    key: 'setPosition',
    value: function setPosition(vector) {
      this.position.copy(vector);
      this.raycaster.ray.origin.copy(vector);
      this.updateRaycaster_();
    }
  }, {
    key: 'getOrigin',
    value: function getOrigin() {
      return this.raycaster.ray.origin;
    }

    /**
     * Sets the direction of the ray.
     * @param {Vector} vector Unit vector corresponding to direction.
     */

  }, {
    key: 'setOrientation',
    value: function setOrientation(quaternion) {
      this.orientation.copy(quaternion);

      var pointAt = new THREE.Vector3(0, 0, -1).applyQuaternion(quaternion);
      this.raycaster.ray.direction.copy(pointAt);
      this.updateRaycaster_();
    }
  }, {
    key: 'getDirection',
    value: function getDirection() {
      return this.raycaster.ray.direction;
    }

    /**
     * Sets the pointer on the screen for camera + pointer based picking. This
     * superscedes origin and direction.
     *
     * @param {Vector2} vector The position of the pointer (screen coords).
     */

  }, {
    key: 'setPointer',
    value: function setPointer(vector) {
      this.raycaster.setFromCamera(vector, this.camera);
      this.updateRaycaster_();
    }

    /**
     * Gets the mesh, which includes reticle and/or ray. This mesh is then added
     * to the scene.
     */

  }, {
    key: 'getReticleRayMesh',
    value: function getReticleRayMesh() {
      return this.root;
    }

    /**
     * Gets the currently selected object in the scene.
     */

  }, {
    key: 'getSelectedMesh',
    value: function getSelectedMesh() {
      var count = 0;
      var mesh = null;
      for (var id in this.selected) {
        count += 1;
        mesh = this.meshes[id];
      }
      if (count > 1) {
        console.warn('More than one mesh selected.');
      }
      return mesh;
    }

    /**
     * Hides and shows the reticle.
     */

  }, {
    key: 'setReticleVisibility',
    value: function setReticleVisibility(isVisible) {
      this.reticle.visible = isVisible;
    }

    /**
     * Enables or disables the raycasting ray which gradually fades out from
     * the origin.
     */

  }, {
    key: 'setRayVisibility',
    value: function setRayVisibility(isVisible) {
      this.ray.visible = isVisible;
    }

    /**
     * Enables and disables the raycaster. For touch, where finger up means we
     * shouldn't be raycasting.
     */

  }, {
    key: 'setActive',
    value: function setActive(isActive) {
      // If nothing changed, do nothing.
      if (this.isActive == isActive) {
        return;
      }
      // TODO(smus): Show the ray or reticle adjust in response.
      this.isActive = isActive;

      if (!isActive) {
        this.moveReticle_(null);
        for (var id in this.selected) {
          var mesh = this.meshes[id];
          delete this.selected[id];
          this.emit('rayout', mesh);
        }
      }
    }
  }, {
    key: 'updateRaycaster_',
    value: function updateRaycaster_() {
      var ray = this.raycaster.ray;

      // Position the reticle at a distance, as calculated from the origin and
      // direction.
      var position = this.reticle.position;
      position.copy(ray.direction);
      position.multiplyScalar(this.reticleDistance);
      position.add(ray.origin);

      // Set position and orientation of the ray so that it goes from origin to
      // reticle.
      var delta = new THREE.Vector3().copy(ray.direction);
      delta.multiplyScalar(this.reticleDistance);
      this.ray.scale.y = delta.length();
      var arrow = new THREE.ArrowHelper(ray.direction, ray.origin);
      this.ray.rotation.copy(arrow.rotation);
      this.ray.position.addVectors(ray.origin, delta.multiplyScalar(0.5));
    }

    /**
     * Creates the geometry of the reticle.
     */

  }, {
    key: 'createReticle_',
    value: function createReticle_() {
      // Create a spherical reticle.
      var innerGeometry = new THREE.SphereGeometry(INNER_RADIUS, 32, 32);
      var innerMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.9
      });
      var inner = new THREE.Mesh(innerGeometry, innerMaterial);

      var outerGeometry = new THREE.SphereGeometry(OUTER_RADIUS, 32, 32);
      var outerMaterial = new THREE.MeshBasicMaterial({
        color: 0x333333,
        transparent: true,
        opacity: 0.3
      });
      var outer = new THREE.Mesh(outerGeometry, outerMaterial);

      var reticle = new THREE.Group();
      reticle.add(inner);
      reticle.add(outer);
      return reticle;
    }

    /**
     * Moves the reticle to a position so that it's just in front of the mesh that
     * it intersected with.
     */

  }, {
    key: 'moveReticle_',
    value: function moveReticle_(intersections) {
      // If no intersection, return the reticle to the default position.
      var distance = RETICLE_DISTANCE;
      if (intersections) {
        // Otherwise, determine the correct distance.
        var inter = intersections[0];
        distance = inter.distance;
      }

      this.reticleDistance = distance;
      this.updateRaycaster_();
      return;
    }
  }, {
    key: 'createRay_',
    value: function createRay_() {
      // Create a cylindrical ray.
      var geometry = new THREE.CylinderGeometry(RAY_RADIUS, RAY_RADIUS, 1, 32);
      var material = new THREE.MeshBasicMaterial({
        map: THREE.ImageUtils.loadTexture(GRADIENT_IMAGE),
        //color: 0xffffff,
        transparent: true,
        opacity: 0.3
      });
      var mesh = new THREE.Mesh(geometry, material);

      return mesh;
    }
  }]);

  return RayRenderer;
}(_eventemitter2.default);

exports.default = RayRenderer;

},{"./util":7,"eventemitter3":1}],7:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.isMobile = isMobile;
exports.base64 = base64;
/*
 * Copyright 2016 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

function isMobile() {
  var check = false;
  (function (a) {
    if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4))) check = true;
  })(navigator.userAgent || navigator.vendor || window.opera);
  return check;
}

function base64(mimeType, base64) {
  return 'data:' + mimeType + ';base64,' + base64;
}

},{}]},{},[4])(4)
});

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL1VzZXJzL3NydWRsb2ZmL0FwcERhdGEvUm9hbWluZy9ucG0vbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsIm5vZGVfbW9kdWxlcy9ldmVudGVtaXR0ZXIzL2luZGV4LmpzIiwic3JjL29yaWVudGF0aW9uLWFybS1tb2RlbC5qcyIsInNyYy9yYXktY29udHJvbGxlci5qcyIsInNyYy9yYXktaW5wdXQuanMiLCJzcmMvcmF5LWludGVyYWN0aW9uLW1vZGVzLmpzIiwic3JjL3JheS1yZW5kZXJlci5qcyIsInNyYy91dGlsLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7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QXFCLFVBQXJCLEdBQWtDLE1BQXpDO0FBQ0QiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpe2Z1bmN0aW9uIHIoZSxuLHQpe2Z1bmN0aW9uIG8oaSxmKXtpZighbltpXSl7aWYoIWVbaV0pe3ZhciBjPVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmU7aWYoIWYmJmMpcmV0dXJuIGMoaSwhMCk7aWYodSlyZXR1cm4gdShpLCEwKTt2YXIgYT1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK2krXCInXCIpO3Rocm93IGEuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixhfXZhciBwPW5baV09e2V4cG9ydHM6e319O2VbaV1bMF0uY2FsbChwLmV4cG9ydHMsZnVuY3Rpb24ocil7dmFyIG49ZVtpXVsxXVtyXTtyZXR1cm4gbyhufHxyKX0scCxwLmV4cG9ydHMscixlLG4sdCl9cmV0dXJuIG5baV0uZXhwb3J0c31mb3IodmFyIHU9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZSxpPTA7aTx0Lmxlbmd0aDtpKyspbyh0W2ldKTtyZXR1cm4gb31yZXR1cm4gcn0pKCkiLCIndXNlIHN0cmljdCc7XG5cbnZhciBoYXMgPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5O1xuXG4vL1xuLy8gV2Ugc3RvcmUgb3VyIEVFIG9iamVjdHMgaW4gYSBwbGFpbiBvYmplY3Qgd2hvc2UgcHJvcGVydGllcyBhcmUgZXZlbnQgbmFtZXMuXG4vLyBJZiBgT2JqZWN0LmNyZWF0ZShudWxsKWAgaXMgbm90IHN1cHBvcnRlZCB3ZSBwcmVmaXggdGhlIGV2ZW50IG5hbWVzIHdpdGggYVxuLy8gYH5gIHRvIG1ha2Ugc3VyZSB0aGF0IHRoZSBidWlsdC1pbiBvYmplY3QgcHJvcGVydGllcyBhcmUgbm90IG92ZXJyaWRkZW4gb3Jcbi8vIHVzZWQgYXMgYW4gYXR0YWNrIHZlY3Rvci5cbi8vIFdlIGFsc28gYXNzdW1lIHRoYXQgYE9iamVjdC5jcmVhdGUobnVsbClgIGlzIGF2YWlsYWJsZSB3aGVuIHRoZSBldmVudCBuYW1lXG4vLyBpcyBhbiBFUzYgU3ltYm9sLlxuLy9cbnZhciBwcmVmaXggPSB0eXBlb2YgT2JqZWN0LmNyZWF0ZSAhPT0gJ2Z1bmN0aW9uJyA/ICd+JyA6IGZhbHNlO1xuXG4vKipcbiAqIFJlcHJlc2VudGF0aW9uIG9mIGEgc2luZ2xlIEV2ZW50RW1pdHRlciBmdW5jdGlvbi5cbiAqXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmbiBFdmVudCBoYW5kbGVyIHRvIGJlIGNhbGxlZC5cbiAqIEBwYXJhbSB7TWl4ZWR9IGNvbnRleHQgQ29udGV4dCBmb3IgZnVuY3Rpb24gZXhlY3V0aW9uLlxuICogQHBhcmFtIHtCb29sZWFufSBbb25jZT1mYWxzZV0gT25seSBlbWl0IG9uY2VcbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5mdW5jdGlvbiBFRShmbiwgY29udGV4dCwgb25jZSkge1xuICB0aGlzLmZuID0gZm47XG4gIHRoaXMuY29udGV4dCA9IGNvbnRleHQ7XG4gIHRoaXMub25jZSA9IG9uY2UgfHwgZmFsc2U7XG59XG5cbi8qKlxuICogTWluaW1hbCBFdmVudEVtaXR0ZXIgaW50ZXJmYWNlIHRoYXQgaXMgbW9sZGVkIGFnYWluc3QgdGhlIE5vZGUuanNcbiAqIEV2ZW50RW1pdHRlciBpbnRlcmZhY2UuXG4gKlxuICogQGNvbnN0cnVjdG9yXG4gKiBAYXBpIHB1YmxpY1xuICovXG5mdW5jdGlvbiBFdmVudEVtaXR0ZXIoKSB7IC8qIE5vdGhpbmcgdG8gc2V0ICovIH1cblxuLyoqXG4gKiBIb2xkIHRoZSBhc3NpZ25lZCBFdmVudEVtaXR0ZXJzIGJ5IG5hbWUuXG4gKlxuICogQHR5cGUge09iamVjdH1cbiAqIEBwcml2YXRlXG4gKi9cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuX2V2ZW50cyA9IHVuZGVmaW5lZDtcblxuLyoqXG4gKiBSZXR1cm4gYW4gYXJyYXkgbGlzdGluZyB0aGUgZXZlbnRzIGZvciB3aGljaCB0aGUgZW1pdHRlciBoYXMgcmVnaXN0ZXJlZFxuICogbGlzdGVuZXJzLlxuICpcbiAqIEByZXR1cm5zIHtBcnJheX1cbiAqIEBhcGkgcHVibGljXG4gKi9cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuZXZlbnROYW1lcyA9IGZ1bmN0aW9uIGV2ZW50TmFtZXMoKSB7XG4gIHZhciBldmVudHMgPSB0aGlzLl9ldmVudHNcbiAgICAsIG5hbWVzID0gW11cbiAgICAsIG5hbWU7XG5cbiAgaWYgKCFldmVudHMpIHJldHVybiBuYW1lcztcblxuICBmb3IgKG5hbWUgaW4gZXZlbnRzKSB7XG4gICAgaWYgKGhhcy5jYWxsKGV2ZW50cywgbmFtZSkpIG5hbWVzLnB1c2gocHJlZml4ID8gbmFtZS5zbGljZSgxKSA6IG5hbWUpO1xuICB9XG5cbiAgaWYgKE9iamVjdC5nZXRPd25Qcm9wZXJ0eVN5bWJvbHMpIHtcbiAgICByZXR1cm4gbmFtZXMuY29uY2F0KE9iamVjdC5nZXRPd25Qcm9wZXJ0eVN5bWJvbHMoZXZlbnRzKSk7XG4gIH1cblxuICByZXR1cm4gbmFtZXM7XG59O1xuXG4vKipcbiAqIFJldHVybiBhIGxpc3Qgb2YgYXNzaWduZWQgZXZlbnQgbGlzdGVuZXJzLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBldmVudCBUaGUgZXZlbnRzIHRoYXQgc2hvdWxkIGJlIGxpc3RlZC5cbiAqIEBwYXJhbSB7Qm9vbGVhbn0gZXhpc3RzIFdlIG9ubHkgbmVlZCB0byBrbm93IGlmIHRoZXJlIGFyZSBsaXN0ZW5lcnMuXG4gKiBAcmV0dXJucyB7QXJyYXl8Qm9vbGVhbn1cbiAqIEBhcGkgcHVibGljXG4gKi9cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUubGlzdGVuZXJzID0gZnVuY3Rpb24gbGlzdGVuZXJzKGV2ZW50LCBleGlzdHMpIHtcbiAgdmFyIGV2dCA9IHByZWZpeCA/IHByZWZpeCArIGV2ZW50IDogZXZlbnRcbiAgICAsIGF2YWlsYWJsZSA9IHRoaXMuX2V2ZW50cyAmJiB0aGlzLl9ldmVudHNbZXZ0XTtcblxuICBpZiAoZXhpc3RzKSByZXR1cm4gISFhdmFpbGFibGU7XG4gIGlmICghYXZhaWxhYmxlKSByZXR1cm4gW107XG4gIGlmIChhdmFpbGFibGUuZm4pIHJldHVybiBbYXZhaWxhYmxlLmZuXTtcblxuICBmb3IgKHZhciBpID0gMCwgbCA9IGF2YWlsYWJsZS5sZW5ndGgsIGVlID0gbmV3IEFycmF5KGwpOyBpIDwgbDsgaSsrKSB7XG4gICAgZWVbaV0gPSBhdmFpbGFibGVbaV0uZm47XG4gIH1cblxuICByZXR1cm4gZWU7XG59O1xuXG4vKipcbiAqIEVtaXQgYW4gZXZlbnQgdG8gYWxsIHJlZ2lzdGVyZWQgZXZlbnQgbGlzdGVuZXJzLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBldmVudCBUaGUgbmFtZSBvZiB0aGUgZXZlbnQuXG4gKiBAcmV0dXJucyB7Qm9vbGVhbn0gSW5kaWNhdGlvbiBpZiB3ZSd2ZSBlbWl0dGVkIGFuIGV2ZW50LlxuICogQGFwaSBwdWJsaWNcbiAqL1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5lbWl0ID0gZnVuY3Rpb24gZW1pdChldmVudCwgYTEsIGEyLCBhMywgYTQsIGE1KSB7XG4gIHZhciBldnQgPSBwcmVmaXggPyBwcmVmaXggKyBldmVudCA6IGV2ZW50O1xuXG4gIGlmICghdGhpcy5fZXZlbnRzIHx8ICF0aGlzLl9ldmVudHNbZXZ0XSkgcmV0dXJuIGZhbHNlO1xuXG4gIHZhciBsaXN0ZW5lcnMgPSB0aGlzLl9ldmVudHNbZXZ0XVxuICAgICwgbGVuID0gYXJndW1lbnRzLmxlbmd0aFxuICAgICwgYXJnc1xuICAgICwgaTtcblxuICBpZiAoJ2Z1bmN0aW9uJyA9PT0gdHlwZW9mIGxpc3RlbmVycy5mbikge1xuICAgIGlmIChsaXN0ZW5lcnMub25jZSkgdGhpcy5yZW1vdmVMaXN0ZW5lcihldmVudCwgbGlzdGVuZXJzLmZuLCB1bmRlZmluZWQsIHRydWUpO1xuXG4gICAgc3dpdGNoIChsZW4pIHtcbiAgICAgIGNhc2UgMTogcmV0dXJuIGxpc3RlbmVycy5mbi5jYWxsKGxpc3RlbmVycy5jb250ZXh0KSwgdHJ1ZTtcbiAgICAgIGNhc2UgMjogcmV0dXJuIGxpc3RlbmVycy5mbi5jYWxsKGxpc3RlbmVycy5jb250ZXh0LCBhMSksIHRydWU7XG4gICAgICBjYXNlIDM6IHJldHVybiBsaXN0ZW5lcnMuZm4uY2FsbChsaXN0ZW5lcnMuY29udGV4dCwgYTEsIGEyKSwgdHJ1ZTtcbiAgICAgIGNhc2UgNDogcmV0dXJuIGxpc3RlbmVycy5mbi5jYWxsKGxpc3RlbmVycy5jb250ZXh0LCBhMSwgYTIsIGEzKSwgdHJ1ZTtcbiAgICAgIGNhc2UgNTogcmV0dXJuIGxpc3RlbmVycy5mbi5jYWxsKGxpc3RlbmVycy5jb250ZXh0LCBhMSwgYTIsIGEzLCBhNCksIHRydWU7XG4gICAgICBjYXNlIDY6IHJldHVybiBsaXN0ZW5lcnMuZm4uY2FsbChsaXN0ZW5lcnMuY29udGV4dCwgYTEsIGEyLCBhMywgYTQsIGE1KSwgdHJ1ZTtcbiAgICB9XG5cbiAgICBmb3IgKGkgPSAxLCBhcmdzID0gbmV3IEFycmF5KGxlbiAtMSk7IGkgPCBsZW47IGkrKykge1xuICAgICAgYXJnc1tpIC0gMV0gPSBhcmd1bWVudHNbaV07XG4gICAgfVxuXG4gICAgbGlzdGVuZXJzLmZuLmFwcGx5KGxpc3RlbmVycy5jb250ZXh0LCBhcmdzKTtcbiAgfSBlbHNlIHtcbiAgICB2YXIgbGVuZ3RoID0gbGlzdGVuZXJzLmxlbmd0aFxuICAgICAgLCBqO1xuXG4gICAgZm9yIChpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAobGlzdGVuZXJzW2ldLm9uY2UpIHRoaXMucmVtb3ZlTGlzdGVuZXIoZXZlbnQsIGxpc3RlbmVyc1tpXS5mbiwgdW5kZWZpbmVkLCB0cnVlKTtcblxuICAgICAgc3dpdGNoIChsZW4pIHtcbiAgICAgICAgY2FzZSAxOiBsaXN0ZW5lcnNbaV0uZm4uY2FsbChsaXN0ZW5lcnNbaV0uY29udGV4dCk7IGJyZWFrO1xuICAgICAgICBjYXNlIDI6IGxpc3RlbmVyc1tpXS5mbi5jYWxsKGxpc3RlbmVyc1tpXS5jb250ZXh0LCBhMSk7IGJyZWFrO1xuICAgICAgICBjYXNlIDM6IGxpc3RlbmVyc1tpXS5mbi5jYWxsKGxpc3RlbmVyc1tpXS5jb250ZXh0LCBhMSwgYTIpOyBicmVhaztcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICBpZiAoIWFyZ3MpIGZvciAoaiA9IDEsIGFyZ3MgPSBuZXcgQXJyYXkobGVuIC0xKTsgaiA8IGxlbjsgaisrKSB7XG4gICAgICAgICAgICBhcmdzW2ogLSAxXSA9IGFyZ3VtZW50c1tqXTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBsaXN0ZW5lcnNbaV0uZm4uYXBwbHkobGlzdGVuZXJzW2ldLmNvbnRleHQsIGFyZ3MpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiB0cnVlO1xufTtcblxuLyoqXG4gKiBSZWdpc3RlciBhIG5ldyBFdmVudExpc3RlbmVyIGZvciB0aGUgZ2l2ZW4gZXZlbnQuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50IE5hbWUgb2YgdGhlIGV2ZW50LlxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm4gQ2FsbGJhY2sgZnVuY3Rpb24uXG4gKiBAcGFyYW0ge01peGVkfSBbY29udGV4dD10aGlzXSBUaGUgY29udGV4dCBvZiB0aGUgZnVuY3Rpb24uXG4gKiBAYXBpIHB1YmxpY1xuICovXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLm9uID0gZnVuY3Rpb24gb24oZXZlbnQsIGZuLCBjb250ZXh0KSB7XG4gIHZhciBsaXN0ZW5lciA9IG5ldyBFRShmbiwgY29udGV4dCB8fCB0aGlzKVxuICAgICwgZXZ0ID0gcHJlZml4ID8gcHJlZml4ICsgZXZlbnQgOiBldmVudDtcblxuICBpZiAoIXRoaXMuX2V2ZW50cykgdGhpcy5fZXZlbnRzID0gcHJlZml4ID8ge30gOiBPYmplY3QuY3JlYXRlKG51bGwpO1xuICBpZiAoIXRoaXMuX2V2ZW50c1tldnRdKSB0aGlzLl9ldmVudHNbZXZ0XSA9IGxpc3RlbmVyO1xuICBlbHNlIHtcbiAgICBpZiAoIXRoaXMuX2V2ZW50c1tldnRdLmZuKSB0aGlzLl9ldmVudHNbZXZ0XS5wdXNoKGxpc3RlbmVyKTtcbiAgICBlbHNlIHRoaXMuX2V2ZW50c1tldnRdID0gW1xuICAgICAgdGhpcy5fZXZlbnRzW2V2dF0sIGxpc3RlbmVyXG4gICAgXTtcbiAgfVxuXG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBBZGQgYW4gRXZlbnRMaXN0ZW5lciB0aGF0J3Mgb25seSBjYWxsZWQgb25jZS5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gZXZlbnQgTmFtZSBvZiB0aGUgZXZlbnQuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmbiBDYWxsYmFjayBmdW5jdGlvbi5cbiAqIEBwYXJhbSB7TWl4ZWR9IFtjb250ZXh0PXRoaXNdIFRoZSBjb250ZXh0IG9mIHRoZSBmdW5jdGlvbi5cbiAqIEBhcGkgcHVibGljXG4gKi9cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUub25jZSA9IGZ1bmN0aW9uIG9uY2UoZXZlbnQsIGZuLCBjb250ZXh0KSB7XG4gIHZhciBsaXN0ZW5lciA9IG5ldyBFRShmbiwgY29udGV4dCB8fCB0aGlzLCB0cnVlKVxuICAgICwgZXZ0ID0gcHJlZml4ID8gcHJlZml4ICsgZXZlbnQgOiBldmVudDtcblxuICBpZiAoIXRoaXMuX2V2ZW50cykgdGhpcy5fZXZlbnRzID0gcHJlZml4ID8ge30gOiBPYmplY3QuY3JlYXRlKG51bGwpO1xuICBpZiAoIXRoaXMuX2V2ZW50c1tldnRdKSB0aGlzLl9ldmVudHNbZXZ0XSA9IGxpc3RlbmVyO1xuICBlbHNlIHtcbiAgICBpZiAoIXRoaXMuX2V2ZW50c1tldnRdLmZuKSB0aGlzLl9ldmVudHNbZXZ0XS5wdXNoKGxpc3RlbmVyKTtcbiAgICBlbHNlIHRoaXMuX2V2ZW50c1tldnRdID0gW1xuICAgICAgdGhpcy5fZXZlbnRzW2V2dF0sIGxpc3RlbmVyXG4gICAgXTtcbiAgfVxuXG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBSZW1vdmUgZXZlbnQgbGlzdGVuZXJzLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBldmVudCBUaGUgZXZlbnQgd2Ugd2FudCB0byByZW1vdmUuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmbiBUaGUgbGlzdGVuZXIgdGhhdCB3ZSBuZWVkIHRvIGZpbmQuXG4gKiBAcGFyYW0ge01peGVkfSBjb250ZXh0IE9ubHkgcmVtb3ZlIGxpc3RlbmVycyBtYXRjaGluZyB0aGlzIGNvbnRleHQuXG4gKiBAcGFyYW0ge0Jvb2xlYW59IG9uY2UgT25seSByZW1vdmUgb25jZSBsaXN0ZW5lcnMuXG4gKiBAYXBpIHB1YmxpY1xuICovXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnJlbW92ZUxpc3RlbmVyID0gZnVuY3Rpb24gcmVtb3ZlTGlzdGVuZXIoZXZlbnQsIGZuLCBjb250ZXh0LCBvbmNlKSB7XG4gIHZhciBldnQgPSBwcmVmaXggPyBwcmVmaXggKyBldmVudCA6IGV2ZW50O1xuXG4gIGlmICghdGhpcy5fZXZlbnRzIHx8ICF0aGlzLl9ldmVudHNbZXZ0XSkgcmV0dXJuIHRoaXM7XG5cbiAgdmFyIGxpc3RlbmVycyA9IHRoaXMuX2V2ZW50c1tldnRdXG4gICAgLCBldmVudHMgPSBbXTtcblxuICBpZiAoZm4pIHtcbiAgICBpZiAobGlzdGVuZXJzLmZuKSB7XG4gICAgICBpZiAoXG4gICAgICAgICAgIGxpc3RlbmVycy5mbiAhPT0gZm5cbiAgICAgICAgfHwgKG9uY2UgJiYgIWxpc3RlbmVycy5vbmNlKVxuICAgICAgICB8fCAoY29udGV4dCAmJiBsaXN0ZW5lcnMuY29udGV4dCAhPT0gY29udGV4dClcbiAgICAgICkge1xuICAgICAgICBldmVudHMucHVzaChsaXN0ZW5lcnMpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBmb3IgKHZhciBpID0gMCwgbGVuZ3RoID0gbGlzdGVuZXJzLmxlbmd0aDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmIChcbiAgICAgICAgICAgICBsaXN0ZW5lcnNbaV0uZm4gIT09IGZuXG4gICAgICAgICAgfHwgKG9uY2UgJiYgIWxpc3RlbmVyc1tpXS5vbmNlKVxuICAgICAgICAgIHx8IChjb250ZXh0ICYmIGxpc3RlbmVyc1tpXS5jb250ZXh0ICE9PSBjb250ZXh0KVxuICAgICAgICApIHtcbiAgICAgICAgICBldmVudHMucHVzaChsaXN0ZW5lcnNbaV0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLy9cbiAgLy8gUmVzZXQgdGhlIGFycmF5LCBvciByZW1vdmUgaXQgY29tcGxldGVseSBpZiB3ZSBoYXZlIG5vIG1vcmUgbGlzdGVuZXJzLlxuICAvL1xuICBpZiAoZXZlbnRzLmxlbmd0aCkge1xuICAgIHRoaXMuX2V2ZW50c1tldnRdID0gZXZlbnRzLmxlbmd0aCA9PT0gMSA/IGV2ZW50c1swXSA6IGV2ZW50cztcbiAgfSBlbHNlIHtcbiAgICBkZWxldGUgdGhpcy5fZXZlbnRzW2V2dF07XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogUmVtb3ZlIGFsbCBsaXN0ZW5lcnMgb3Igb25seSB0aGUgbGlzdGVuZXJzIGZvciB0aGUgc3BlY2lmaWVkIGV2ZW50LlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBldmVudCBUaGUgZXZlbnQgd2FudCB0byByZW1vdmUgYWxsIGxpc3RlbmVycyBmb3IuXG4gKiBAYXBpIHB1YmxpY1xuICovXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnJlbW92ZUFsbExpc3RlbmVycyA9IGZ1bmN0aW9uIHJlbW92ZUFsbExpc3RlbmVycyhldmVudCkge1xuICBpZiAoIXRoaXMuX2V2ZW50cykgcmV0dXJuIHRoaXM7XG5cbiAgaWYgKGV2ZW50KSBkZWxldGUgdGhpcy5fZXZlbnRzW3ByZWZpeCA/IHByZWZpeCArIGV2ZW50IDogZXZlbnRdO1xuICBlbHNlIHRoaXMuX2V2ZW50cyA9IHByZWZpeCA/IHt9IDogT2JqZWN0LmNyZWF0ZShudWxsKTtcblxuICByZXR1cm4gdGhpcztcbn07XG5cbi8vXG4vLyBBbGlhcyBtZXRob2RzIG5hbWVzIGJlY2F1c2UgcGVvcGxlIHJvbGwgbGlrZSB0aGF0LlxuLy9cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUub2ZmID0gRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5yZW1vdmVMaXN0ZW5lcjtcbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuYWRkTGlzdGVuZXIgPSBFdmVudEVtaXR0ZXIucHJvdG90eXBlLm9uO1xuXG4vL1xuLy8gVGhpcyBmdW5jdGlvbiBkb2Vzbid0IGFwcGx5IGFueW1vcmUuXG4vL1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5zZXRNYXhMaXN0ZW5lcnMgPSBmdW5jdGlvbiBzZXRNYXhMaXN0ZW5lcnMoKSB7XG4gIHJldHVybiB0aGlzO1xufTtcblxuLy9cbi8vIEV4cG9zZSB0aGUgcHJlZml4LlxuLy9cbkV2ZW50RW1pdHRlci5wcmVmaXhlZCA9IHByZWZpeDtcblxuLy9cbi8vIEV4cG9zZSB0aGUgbW9kdWxlLlxuLy9cbmlmICgndW5kZWZpbmVkJyAhPT0gdHlwZW9mIG1vZHVsZSkge1xuICBtb2R1bGUuZXhwb3J0cyA9IEV2ZW50RW1pdHRlcjtcbn1cbiIsIi8qXG4gKiBDb3B5cmlnaHQgMjAxNiBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbmNvbnN0IEhFQURfRUxCT1dfT0ZGU0VUX1JJR0hUSEFOREVEID0gbmV3IFRIUkVFLlZlY3RvcjMoMC4xNTUsIC0wLjQ2NSwgLTAuMTUpO1xuY29uc3QgSEVBRF9FTEJPV19PRkZTRVRfTEVGVEhBTkRFRCA9IG5ldyBUSFJFRS5WZWN0b3IzKC0wLjE1NSwgLTAuNDY1LCAtMC4xNSk7XG5sZXQgaGVhZEVsYm93T2Zmc2V0ID0gSEVBRF9FTEJPV19PRkZTRVRfUklHSFRIQU5ERUQ7XG5jb25zdCBFTEJPV19XUklTVF9PRkZTRVQgPSBuZXcgVEhSRUUuVmVjdG9yMygwLCAwLCAtMC4yNSk7XG5jb25zdCBXUklTVF9DT05UUk9MTEVSX09GRlNFVCA9IG5ldyBUSFJFRS5WZWN0b3IzKDAsIDAsIDAuMDUpO1xuY29uc3QgQVJNX0VYVEVOU0lPTl9PRkZTRVQgPSBuZXcgVEhSRUUuVmVjdG9yMygtMC4wOCwgMC4xNCwgMC4wOCk7XG5cbmNvbnN0IEVMQk9XX0JFTkRfUkFUSU8gPSAwLjQ7IC8vIDQwJSBlbGJvdywgNjAlIHdyaXN0LlxuY29uc3QgRVhURU5TSU9OX1JBVElPX1dFSUdIVCA9IDAuNDtcblxuY29uc3QgTUlOX0FOR1VMQVJfU1BFRUQgPSAwLjYxOyAvLyAzNSBkZWdyZWVzIHBlciBzZWNvbmQgKGluIHJhZGlhbnMpLlxuXG4vKipcbiAqIFJlcHJlc2VudHMgdGhlIGFybSBtb2RlbCBmb3IgdGhlIERheWRyZWFtIGNvbnRyb2xsZXIuIEZlZWQgaXQgYSBjYW1lcmEgYW5kXG4gKiB0aGUgY29udHJvbGxlci4gVXBkYXRlIGl0IG9uIGEgUkFGLlxuICpcbiAqIEdldCB0aGUgbW9kZWwncyBwb3NlIHVzaW5nIGdldFBvc2UoKS5cbiAqL1xuZXhwb3J0IGRlZmF1bHQgY2xhc3MgT3JpZW50YXRpb25Bcm1Nb2RlbCB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHRoaXMuaXNMZWZ0SGFuZGVkID0gZmFsc2U7XG5cbiAgICAvLyBDdXJyZW50IGFuZCBwcmV2aW91cyBjb250cm9sbGVyIG9yaWVudGF0aW9ucy5cbiAgICB0aGlzLmNvbnRyb2xsZXJRID0gbmV3IFRIUkVFLlF1YXRlcm5pb24oKTtcbiAgICB0aGlzLmxhc3RDb250cm9sbGVyUSA9IG5ldyBUSFJFRS5RdWF0ZXJuaW9uKCk7XG5cbiAgICAvLyBDdXJyZW50IGFuZCBwcmV2aW91cyBoZWFkIG9yaWVudGF0aW9ucy5cbiAgICB0aGlzLmhlYWRRID0gbmV3IFRIUkVFLlF1YXRlcm5pb24oKTtcblxuICAgIC8vIEN1cnJlbnQgaGVhZCBwb3NpdGlvbi5cbiAgICB0aGlzLmhlYWRQb3MgPSBuZXcgVEhSRUUuVmVjdG9yMygpO1xuXG4gICAgLy8gUG9zaXRpb25zIG9mIG90aGVyIGpvaW50cyAobW9zdGx5IGZvciBkZWJ1Z2dpbmcpLlxuICAgIHRoaXMuZWxib3dQb3MgPSBuZXcgVEhSRUUuVmVjdG9yMygpO1xuICAgIHRoaXMud3Jpc3RQb3MgPSBuZXcgVEhSRUUuVmVjdG9yMygpO1xuXG4gICAgLy8gQ3VycmVudCBhbmQgcHJldmlvdXMgdGltZXMgdGhlIG1vZGVsIHdhcyB1cGRhdGVkLlxuICAgIHRoaXMudGltZSA9IG51bGw7XG4gICAgdGhpcy5sYXN0VGltZSA9IG51bGw7XG5cbiAgICAvLyBSb290IHJvdGF0aW9uLlxuICAgIHRoaXMucm9vdFEgPSBuZXcgVEhSRUUuUXVhdGVybmlvbigpO1xuXG4gICAgLy8gQ3VycmVudCBwb3NlIHRoYXQgdGhpcyBhcm0gbW9kZWwgY2FsY3VsYXRlcy5cbiAgICB0aGlzLnBvc2UgPSB7XG4gICAgICBvcmllbnRhdGlvbjogbmV3IFRIUkVFLlF1YXRlcm5pb24oKSxcbiAgICAgIHBvc2l0aW9uOiBuZXcgVEhSRUUuVmVjdG9yMygpXG4gICAgfTtcbiAgfVxuXG4gIC8qKlxuICAgKiBNZXRob2RzIHRvIHNldCBjb250cm9sbGVyIGFuZCBoZWFkIHBvc2UgKGluIHdvcmxkIGNvb3JkaW5hdGVzKS5cbiAgICovXG4gIHNldENvbnRyb2xsZXJPcmllbnRhdGlvbihxdWF0ZXJuaW9uKSB7XG4gICAgdGhpcy5sYXN0Q29udHJvbGxlclEuY29weSh0aGlzLmNvbnRyb2xsZXJRKTtcbiAgICB0aGlzLmNvbnRyb2xsZXJRLmNvcHkocXVhdGVybmlvbik7XG4gIH1cblxuICBzZXRIZWFkT3JpZW50YXRpb24ocXVhdGVybmlvbikge1xuICAgIHRoaXMuaGVhZFEuY29weShxdWF0ZXJuaW9uKTtcbiAgfVxuXG4gIHNldEhlYWRQb3NpdGlvbihwb3NpdGlvbikge1xuICAgIHRoaXMuaGVhZFBvcy5jb3B5KHBvc2l0aW9uKTtcbiAgfVxuXG4gIHNldExlZnRIYW5kZWQoaXNMZWZ0SGFuZGVkKSB7XG4gICAgdGhpcy5pc0xlZnRIYW5kZWQgPSBpc0xlZnRIYW5kZWQ7XG4gICAgaWYgKGlzTGVmdEhhbmRlZCkge1xuICAgICAgaGVhZEVsYm93T2Zmc2V0ID0gSEVBRF9FTEJPV19PRkZTRVRfTEVGVEhBTkRFRDtcbiAgICB9ZWxzZXtcbiAgICAgIGhlYWRFbGJvd09mZnNldCA9IEhFQURfRUxCT1dfT0ZGU0VUX1JJR0hUSEFOREVEO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBDYWxsZWQgb24gYSBSQUYuXG4gICAqL1xuICB1cGRhdGUoKSB7XG4gICAgdGhpcy50aW1lID0gcGVyZm9ybWFuY2Uubm93KCk7XG5cbiAgICAvLyBJZiB0aGUgY29udHJvbGxlcidzIGFuZ3VsYXIgdmVsb2NpdHkgaXMgYWJvdmUgYSBjZXJ0YWluIGFtb3VudCwgd2UgY2FuXG4gICAgLy8gYXNzdW1lIHRvcnNvIHJvdGF0aW9uIGFuZCBtb3ZlIHRoZSBlbGJvdyBqb2ludCByZWxhdGl2ZSB0byB0aGVcbiAgICAvLyBjYW1lcmEgb3JpZW50YXRpb24uXG4gICAgbGV0IGhlYWRZYXdRID0gdGhpcy5nZXRIZWFkWWF3T3JpZW50YXRpb25fKCk7XG4gICAgbGV0IHRpbWVEZWx0YSA9ICh0aGlzLnRpbWUgLSB0aGlzLmxhc3RUaW1lKSAvIDEwMDA7XG4gICAgbGV0IGFuZ2xlRGVsdGEgPSB0aGlzLnF1YXRBbmdsZV8odGhpcy5sYXN0Q29udHJvbGxlclEsIHRoaXMuY29udHJvbGxlclEpO1xuICAgIGxldCBjb250cm9sbGVyQW5ndWxhclNwZWVkID0gYW5nbGVEZWx0YSAvIHRpbWVEZWx0YTtcbiAgICBpZiAoY29udHJvbGxlckFuZ3VsYXJTcGVlZCA+IE1JTl9BTkdVTEFSX1NQRUVEKSB7XG4gICAgICAvLyBBdHRlbnVhdGUgdGhlIFJvb3Qgcm90YXRpb24gc2xpZ2h0bHkuXG4gICAgICB0aGlzLnJvb3RRLnNsZXJwKGhlYWRZYXdRLCBhbmdsZURlbHRhIC8gMTApXG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMucm9vdFEuY29weShoZWFkWWF3USk7XG4gICAgfVxuXG4gICAgLy8gV2Ugd2FudCB0byBtb3ZlIHRoZSBlbGJvdyB1cCBhbmQgdG8gdGhlIGNlbnRlciBhcyB0aGUgdXNlciBwb2ludHMgdGhlXG4gICAgLy8gY29udHJvbGxlciB1cHdhcmRzLCBzbyB0aGF0IHRoZXkgY2FuIGVhc2lseSBzZWUgdGhlIGNvbnRyb2xsZXIgYW5kIGl0c1xuICAgIC8vIHRvb2wgdGlwcy5cbiAgICBsZXQgY29udHJvbGxlckV1bGVyID0gbmV3IFRIUkVFLkV1bGVyKCkuc2V0RnJvbVF1YXRlcm5pb24odGhpcy5jb250cm9sbGVyUSwgJ1lYWicpO1xuICAgIGxldCBjb250cm9sbGVyWERlZyA9IFRIUkVFLk1hdGgucmFkVG9EZWcoY29udHJvbGxlckV1bGVyLngpO1xuICAgIGxldCBleHRlbnNpb25SYXRpbyA9IHRoaXMuY2xhbXBfKChjb250cm9sbGVyWERlZyAtIDExKSAvICg1MCAtIDExKSwgMCwgMSk7XG5cbiAgICAvLyBDb250cm9sbGVyIG9yaWVudGF0aW9uIGluIGNhbWVyYSBzcGFjZS5cbiAgICBsZXQgY29udHJvbGxlckNhbWVyYVEgPSB0aGlzLnJvb3RRLmNsb25lKCkuaW52ZXJzZSgpO1xuICAgIGNvbnRyb2xsZXJDYW1lcmFRLm11bHRpcGx5KHRoaXMuY29udHJvbGxlclEpO1xuXG4gICAgLy8gQ2FsY3VsYXRlIGVsYm93IHBvc2l0aW9uLlxuICAgIGxldCBlbGJvd1BvcyA9IHRoaXMuZWxib3dQb3M7XG4gICAgZWxib3dQb3MuY29weSh0aGlzLmhlYWRQb3MpLmFkZChoZWFkRWxib3dPZmZzZXQpO1xuICAgIGxldCBlbGJvd09mZnNldCA9IG5ldyBUSFJFRS5WZWN0b3IzKCkuY29weShBUk1fRVhURU5TSU9OX09GRlNFVCk7XG4gICAgZWxib3dPZmZzZXQubXVsdGlwbHlTY2FsYXIoZXh0ZW5zaW9uUmF0aW8pO1xuICAgIGVsYm93UG9zLmFkZChlbGJvd09mZnNldCk7XG5cbiAgICAvLyBDYWxjdWxhdGUgam9pbnQgYW5nbGVzLiBHZW5lcmFsbHkgNDAlIG9mIHJvdGF0aW9uIGFwcGxpZWQgdG8gZWxib3csIDYwJVxuICAgIC8vIHRvIHdyaXN0LCBidXQgaWYgY29udHJvbGxlciBpcyByYWlzZWQgaGlnaGVyLCBtb3JlIHJvdGF0aW9uIGNvbWVzIGZyb21cbiAgICAvLyB0aGUgd3Jpc3QuXG4gICAgbGV0IHRvdGFsQW5nbGUgPSB0aGlzLnF1YXRBbmdsZV8oY29udHJvbGxlckNhbWVyYVEsIG5ldyBUSFJFRS5RdWF0ZXJuaW9uKCkpO1xuICAgIGxldCB0b3RhbEFuZ2xlRGVnID0gVEhSRUUuTWF0aC5yYWRUb0RlZyh0b3RhbEFuZ2xlKTtcbiAgICBsZXQgbGVycFN1cHByZXNzaW9uID0gMSAtIE1hdGgucG93KHRvdGFsQW5nbGVEZWcgLyAxODAsIDQpOyAvLyBUT0RPKHNtdXMpOiA/Pz9cblxuICAgIGxldCBlbGJvd1JhdGlvID0gRUxCT1dfQkVORF9SQVRJTztcbiAgICBsZXQgd3Jpc3RSYXRpbyA9IDEgLSBFTEJPV19CRU5EX1JBVElPO1xuICAgIGxldCBsZXJwVmFsdWUgPSBsZXJwU3VwcHJlc3Npb24gKlxuICAgICAgICAoZWxib3dSYXRpbyArIHdyaXN0UmF0aW8gKiBleHRlbnNpb25SYXRpbyAqIEVYVEVOU0lPTl9SQVRJT19XRUlHSFQpO1xuXG4gICAgbGV0IHdyaXN0USA9IG5ldyBUSFJFRS5RdWF0ZXJuaW9uKCkuc2xlcnAoY29udHJvbGxlckNhbWVyYVEsIGxlcnBWYWx1ZSk7XG4gICAgbGV0IGludldyaXN0USA9IHdyaXN0US5pbnZlcnNlKCk7XG4gICAgbGV0IGVsYm93USA9IGNvbnRyb2xsZXJDYW1lcmFRLmNsb25lKCkubXVsdGlwbHkoaW52V3Jpc3RRKTtcblxuICAgIC8vIENhbGN1bGF0ZSBvdXIgZmluYWwgY29udHJvbGxlciBwb3NpdGlvbiBiYXNlZCBvbiBhbGwgb3VyIGpvaW50IHJvdGF0aW9uc1xuICAgIC8vIGFuZCBsZW5ndGhzLlxuICAgIC8qXG4gICAgcG9zaXRpb25fID1cbiAgICAgIHJvb3Rfcm90XyAqIChcbiAgICAgICAgY29udHJvbGxlcl9yb290X29mZnNldF8gK1xuMjogICAgICAoYXJtX2V4dGVuc2lvbl8gKiBhbXRfZXh0ZW5zaW9uKSArXG4xOiAgICAgIGVsYm93X3JvdCAqIChrQ29udHJvbGxlckZvcmVhcm0gKyAod3Jpc3Rfcm90ICoga0NvbnRyb2xsZXJQb3NpdGlvbikpXG4gICAgICApO1xuICAgICovXG4gICAgbGV0IHdyaXN0UG9zID0gdGhpcy53cmlzdFBvcztcbiAgICB3cmlzdFBvcy5jb3B5KFdSSVNUX0NPTlRST0xMRVJfT0ZGU0VUKTtcbiAgICB3cmlzdFBvcy5hcHBseVF1YXRlcm5pb24od3Jpc3RRKTtcbiAgICB3cmlzdFBvcy5hZGQoRUxCT1dfV1JJU1RfT0ZGU0VUKTtcbiAgICB3cmlzdFBvcy5hcHBseVF1YXRlcm5pb24oZWxib3dRKTtcbiAgICB3cmlzdFBvcy5hZGQodGhpcy5lbGJvd1Bvcyk7XG5cbiAgICBsZXQgb2Zmc2V0ID0gbmV3IFRIUkVFLlZlY3RvcjMoKS5jb3B5KEFSTV9FWFRFTlNJT05fT0ZGU0VUKTtcbiAgICBvZmZzZXQubXVsdGlwbHlTY2FsYXIoZXh0ZW5zaW9uUmF0aW8pO1xuXG4gICAgbGV0IHBvc2l0aW9uID0gbmV3IFRIUkVFLlZlY3RvcjMoKS5jb3B5KHRoaXMud3Jpc3RQb3MpO1xuICAgIHBvc2l0aW9uLmFkZChvZmZzZXQpO1xuICAgIHBvc2l0aW9uLmFwcGx5UXVhdGVybmlvbih0aGlzLnJvb3RRKTtcblxuICAgIGxldCBvcmllbnRhdGlvbiA9IG5ldyBUSFJFRS5RdWF0ZXJuaW9uKCkuY29weSh0aGlzLmNvbnRyb2xsZXJRKTtcblxuICAgIC8vIFNldCB0aGUgcmVzdWx0aW5nIHBvc2Ugb3JpZW50YXRpb24gYW5kIHBvc2l0aW9uLlxuICAgIHRoaXMucG9zZS5vcmllbnRhdGlvbi5jb3B5KG9yaWVudGF0aW9uKTtcbiAgICB0aGlzLnBvc2UucG9zaXRpb24uY29weShwb3NpdGlvbik7XG5cbiAgICB0aGlzLmxhc3RUaW1lID0gdGhpcy50aW1lO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIHBvc2UgY2FsY3VsYXRlZCBieSB0aGUgbW9kZWwuXG4gICAqL1xuICBnZXRQb3NlKCkge1xuICAgIHJldHVybiB0aGlzLnBvc2U7XG4gIH1cblxuICAvKipcbiAgICogRGVidWcgbWV0aG9kcyBmb3IgcmVuZGVyaW5nIHRoZSBhcm0gbW9kZWwuXG4gICAqL1xuICBnZXRGb3JlYXJtTGVuZ3RoKCkge1xuICAgIHJldHVybiBFTEJPV19XUklTVF9PRkZTRVQubGVuZ3RoKCk7XG4gIH1cblxuICBnZXRFbGJvd1Bvc2l0aW9uKCkge1xuICAgIGxldCBvdXQgPSB0aGlzLmVsYm93UG9zLmNsb25lKCk7XG4gICAgcmV0dXJuIG91dC5hcHBseVF1YXRlcm5pb24odGhpcy5yb290USk7XG4gIH1cblxuICBnZXRXcmlzdFBvc2l0aW9uKCkge1xuICAgIGxldCBvdXQgPSB0aGlzLndyaXN0UG9zLmNsb25lKCk7XG4gICAgcmV0dXJuIG91dC5hcHBseVF1YXRlcm5pb24odGhpcy5yb290USk7XG4gIH1cblxuICBnZXRIZWFkWWF3T3JpZW50YXRpb25fKCkge1xuICAgIGxldCBoZWFkRXVsZXIgPSBuZXcgVEhSRUUuRXVsZXIoKS5zZXRGcm9tUXVhdGVybmlvbih0aGlzLmhlYWRRLCAnWVhaJyk7XG4gICAgaGVhZEV1bGVyLnggPSAwO1xuICAgIGhlYWRFdWxlci56ID0gMDtcbiAgICBsZXQgZGVzdGluYXRpb25RID0gbmV3IFRIUkVFLlF1YXRlcm5pb24oKS5zZXRGcm9tRXVsZXIoaGVhZEV1bGVyKTtcbiAgICByZXR1cm4gZGVzdGluYXRpb25RO1xuICB9XG5cbiAgY2xhbXBfKHZhbHVlLCBtaW4sIG1heCkge1xuICAgIHJldHVybiBNYXRoLm1pbihNYXRoLm1heCh2YWx1ZSwgbWluKSwgbWF4KTtcbiAgfVxuXG4gIHF1YXRBbmdsZV8ocTEsIHEyKSB7XG4gICAgbGV0IHZlYzEgPSBuZXcgVEhSRUUuVmVjdG9yMygwLCAwLCAtMSk7XG4gICAgbGV0IHZlYzIgPSBuZXcgVEhSRUUuVmVjdG9yMygwLCAwLCAtMSk7XG4gICAgdmVjMS5hcHBseVF1YXRlcm5pb24ocTEpO1xuICAgIHZlYzIuYXBwbHlRdWF0ZXJuaW9uKHEyKTtcbiAgICByZXR1cm4gdmVjMS5hbmdsZVRvKHZlYzIpO1xuICB9XG59XG4iLCIvKlxuICogQ29weXJpZ2h0IDIwMTYgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG5pbXBvcnQgRXZlbnRFbWl0dGVyIGZyb20gJ2V2ZW50ZW1pdHRlcjMnXG5pbXBvcnQgSW50ZXJhY3Rpb25Nb2RlcyBmcm9tICcuL3JheS1pbnRlcmFjdGlvbi1tb2RlcydcbmltcG9ydCB7aXNNb2JpbGV9IGZyb20gJy4vdXRpbCdcblxuY29uc3QgRFJBR19ESVNUQU5DRV9QWCA9IDEwO1xuXG4vKipcbiAqIEVudW1lcmF0ZXMgYWxsIHBvc3NpYmxlIGludGVyYWN0aW9uIG1vZGVzLiBTZXRzIHVwIGFsbCBldmVudCBoYW5kbGVycyAobW91c2UsXG4gKiB0b3VjaCwgZXRjKSwgaW50ZXJmYWNlcyB3aXRoIGdhbWVwYWQgQVBJLlxuICpcbiAqIEVtaXRzIGV2ZW50czpcbiAqICAgIGFjdGlvbjogSW5wdXQgaXMgYWN0aXZhdGVkIChtb3VzZWRvd24sIHRvdWNoc3RhcnQsIGRheWRyZWFtIGNsaWNrLCB2aXZlXG4gKiAgICB0cmlnZ2VyKS5cbiAqICAgIHJlbGVhc2U6IElucHV0IGlzIGRlYWN0aXZhdGVkIChtb3VzZXVwLCB0b3VjaGVuZCwgZGF5ZHJlYW0gcmVsZWFzZSwgdml2ZVxuICogICAgcmVsZWFzZSkuXG4gKiAgICBjYW5jZWw6IElucHV0IGlzIGNhbmNlbGVkIChlZy4gd2Ugc2Nyb2xsZWQgaW5zdGVhZCBvZiB0YXBwaW5nIG9uXG4gKiAgICBtb2JpbGUvZGVza3RvcCkuXG4gKiAgICBwb2ludGVybW92ZSgyRCBwb3NpdGlvbik6IFRoZSBwb2ludGVyIGlzIG1vdmVkIChtb3VzZSBvciB0b3VjaCkuXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFJheUNvbnRyb2xsZXIgZXh0ZW5kcyBFdmVudEVtaXR0ZXIge1xuICBjb25zdHJ1Y3RvcihvcHRfZWwpIHtcbiAgICBzdXBlcigpO1xuICAgIGxldCBlbCA9IG9wdF9lbCB8fCB3aW5kb3c7XG5cbiAgICAvLyBIYW5kbGUgaW50ZXJhY3Rpb25zLlxuICAgIGVsLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIHRoaXMub25Nb3VzZURvd25fLmJpbmQodGhpcykpO1xuICAgIGVsLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlbW92ZScsIHRoaXMub25Nb3VzZU1vdmVfLmJpbmQodGhpcykpO1xuICAgIGVsLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNldXAnLCB0aGlzLm9uTW91c2VVcF8uYmluZCh0aGlzKSk7XG4gICAgZWwuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hzdGFydCcsIHRoaXMub25Ub3VjaFN0YXJ0Xy5iaW5kKHRoaXMpKTtcbiAgICBlbC5hZGRFdmVudExpc3RlbmVyKCd0b3VjaG1vdmUnLCB0aGlzLm9uVG91Y2hNb3ZlXy5iaW5kKHRoaXMpKTtcbiAgICBlbC5hZGRFdmVudExpc3RlbmVyKCd0b3VjaGVuZCcsIHRoaXMub25Ub3VjaEVuZF8uYmluZCh0aGlzKSk7XG5cbiAgICAvLyBUaGUgcG9zaXRpb24gb2YgdGhlIHBvaW50ZXIuXG4gICAgdGhpcy5wb2ludGVyID0gbmV3IFRIUkVFLlZlY3RvcjIoKTtcbiAgICAvLyBUaGUgcHJldmlvdXMgcG9zaXRpb24gb2YgdGhlIHBvaW50ZXIuXG4gICAgdGhpcy5sYXN0UG9pbnRlciA9IG5ldyBUSFJFRS5WZWN0b3IyKCk7XG4gICAgLy8gUG9zaXRpb24gb2YgcG9pbnRlciBpbiBOb3JtYWxpemVkIERldmljZSBDb29yZGluYXRlcyAoTkRDKS5cbiAgICB0aGlzLnBvaW50ZXJOZGMgPSBuZXcgVEhSRUUuVmVjdG9yMigpO1xuICAgIC8vIEhvdyBtdWNoIHdlIGhhdmUgZHJhZ2dlZCAoaWYgd2UgYXJlIGRyYWdnaW5nKS5cbiAgICB0aGlzLmRyYWdEaXN0YW5jZSA9IDA7XG4gICAgLy8gQXJlIHdlIGRyYWdnaW5nIG9yIG5vdC5cbiAgICB0aGlzLmlzRHJhZ2dpbmcgPSBmYWxzZTtcbiAgICAvLyBJcyBwb2ludGVyIGFjdGl2ZSBvciBub3QuXG4gICAgdGhpcy5pc1RvdWNoQWN0aXZlID0gZmFsc2U7XG4gICAgLy8gSXMgdGhpcyBhIHN5bnRoZXRpYyBtb3VzZSBldmVudD9cbiAgICB0aGlzLmlzU3ludGhldGljTW91c2VFdmVudCA9IGZhbHNlO1xuICAgIC8vIElzIGxlZnRoYW5kZWQuXG4gICAgdGhpcy5pc0xlZnRIYW5kZWQgPSBmYWxzZTtcbiAgICAvLyBHYW1lcGFkIGV2ZW50cy5cbiAgICB0aGlzLmdhbWVwYWQgPSBudWxsO1xuXG4gICAgLy8gVlIgRXZlbnRzLlxuICAgIGlmICghbmF2aWdhdG9yLmdldFZSRGlzcGxheXMpIHtcbiAgICAgIGNvbnNvbGUud2FybignV2ViVlIgQVBJIG5vdCBhdmFpbGFibGUhIENvbnNpZGVyIHVzaW5nIHRoZSB3ZWJ2ci1wb2x5ZmlsbC4nKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbmF2aWdhdG9yLmdldFZSRGlzcGxheXMoKS50aGVuKChkaXNwbGF5cykgPT4ge1xuICAgICAgICB0aGlzLnZyRGlzcGxheSA9IGRpc3BsYXlzWzBdO1xuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgZ2V0SW50ZXJhY3Rpb25Nb2RlKCkge1xuICAgIC8vIFRPRE86IERlYnVnZ2luZyBvbmx5LlxuICAgIC8vcmV0dXJuIEludGVyYWN0aW9uTW9kZXMuREFZRFJFQU07XG5cbiAgICB2YXIgZ2FtZXBhZCA9IHRoaXMuZ2V0VlJHYW1lcGFkXygpO1xuXG4gICAgdGhpcy5nYW1lcGFkID0gZ2FtZXBhZDtcbiAgICBpZiAoZ2FtZXBhZCkge1xuICAgICAgaWYoZ2FtZXBhZC5oYW5kKSB7XG4gICAgICAgIHRoaXMuaXNMZWZ0SGFuZGVkID0gKGdhbWVwYWQuaGFuZCA9PT0gJ2xlZnQnKTtcbiAgICAgIH1cbiAgICAgIGxldCBwb3NlID0gZ2FtZXBhZC5wb3NlO1xuXG4gICAgICBpZiAoIXBvc2UpIHtcbiAgICAgICAgLy8gQ2FyZGJvYXJkIHRvdWNoIGVtdWxhdGlvbiByZXBvcnRzIGFzIGEgMC1ET0ZcbiAgICAgICAgLy8gMS1idXR0b24gY2xpY2tlciBnYW1lcGFkLlxuICAgICAgICByZXR1cm4gSW50ZXJhY3Rpb25Nb2Rlcy5WUl8wRE9GO1xuICAgICAgfVxuXG4gICAgICAvLyBJZiB0aGVyZSdzIGEgZ2FtZXBhZCBjb25uZWN0ZWQsIGRldGVybWluZSBpZiBpdCdzIERheWRyZWFtIG9yIGEgVml2ZS5cbiAgICAgIGlmIChwb3NlLmhhc1Bvc2l0aW9uKSB7XG4gICAgICAgIHJldHVybiBJbnRlcmFjdGlvbk1vZGVzLlZSXzZET0Y7XG4gICAgICB9XG5cbiAgICAgIGlmIChwb3NlLmhhc09yaWVudGF0aW9uKSB7XG4gICAgICAgIHJldHVybiBJbnRlcmFjdGlvbk1vZGVzLlZSXzNET0Y7XG4gICAgICB9XG5cbiAgICB9IGVsc2Uge1xuICAgICAgLy8gSWYgdGhlcmUncyBubyBnYW1lcGFkLCBpdCBtaWdodCBiZSBDYXJkYm9hcmQsIG1hZ2ljIHdpbmRvdyBvciBkZXNrdG9wLlxuICAgICAgaWYgKGlzTW9iaWxlKCkpIHtcbiAgICAgICAgLy8gRWl0aGVyIENhcmRib2FyZCBvciBtYWdpYyB3aW5kb3csIGRlcGVuZGluZyBvbiB3aGV0aGVyIHdlIGFyZVxuICAgICAgICAvLyBwcmVzZW50aW5nLlxuICAgICAgICBpZiAodGhpcy52ckRpc3BsYXkgJiYgdGhpcy52ckRpc3BsYXkuaXNQcmVzZW50aW5nKSB7XG4gICAgICAgICAgcmV0dXJuIEludGVyYWN0aW9uTW9kZXMuVlJfMERPRjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gSW50ZXJhY3Rpb25Nb2Rlcy5UT1VDSDtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gV2UgbXVzdCBiZSBvbiBkZXNrdG9wLlxuICAgICAgICByZXR1cm4gSW50ZXJhY3Rpb25Nb2Rlcy5NT1VTRTtcbiAgICAgIH1cbiAgICB9XG4gICAgLy8gQnkgZGVmYXVsdCwgdXNlIFRPVUNILlxuICAgIHJldHVybiBJbnRlcmFjdGlvbk1vZGVzLlRPVUNIO1xuICB9XG5cbiAgZ2V0R2FtZXBhZFBvc2UoKSB7XG4gICAgdmFyIGdhbWVwYWQgPSB0aGlzLmdldFZSR2FtZXBhZF8oKTtcbiAgICByZXR1cm4gZ2FtZXBhZC5wb3NlIHx8IHt9O1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCBpZiB0aGVyZSBpcyBhbiBhY3RpdmUgdG91Y2ggZXZlbnQgZ29pbmcgb24uXG4gICAqIE9ubHkgcmVsZXZhbnQgb24gdG91Y2ggZGV2aWNlc1xuICAgKi9cbiAgZ2V0SXNUb3VjaEFjdGl2ZSgpIHtcbiAgICByZXR1cm4gdGhpcy5pc1RvdWNoQWN0aXZlO1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrcyBpZiB0aGlzIGNsaWNrIGlzIHRoZSBjYXJkYm9hcmQtY29tcGF0aWJsZSBmYWxsYmFja1xuICAgKiBjbGljayBvbiBEYXlkcmVhbSBjb250cm9sbGVycyBzbyB0aGF0IHdlIGNhbiBkZWR1cGxpY2F0ZSBpdC5cbiAgICogVGhpcyBoYXBwZW5zIG9uIENocm9tZSA8PTYxIHdoZW4gYSBEYXlkcmVhbSBjb250cm9sbGVyXG4gICAqIGlzIGFjdGl2ZSwgaXQgcmVnaXN0ZXJzIGFzIGEgM0RPRiBkZXZpY2UuIE5vdCBhcHBsaWNhYmxlXG4gICAqIGZvciBDaHJvbWUgPj0gNjIgb3Igb3RoZXIgYnJvd3NlcnMgd2hpY2ggZG9uJ3QgZG8gdGhpcy5cbiAgICpcbiAgICogQWxzbyBuZWVkIHRvIGhhbmRsZSBEYXlkcmVhbSBWaWV3IG9uIENocm9tZSA2MSB3aGljaCBpblxuICAgKiBDYXJkYm9hcmQgbW9kZSBleHBvc2VzIGJvdGggdGhlIDBET0YgY2xpY2tlciBkZXZpY2UgYW5kXG4gICAqIHRoZSBjb21wYXRpYmlsaXR5IGNsaWNrLlxuICAgKi9cbiAgaXNDYXJkYm9hcmRDb21wYXRDbGljayhlKSB7XG4gICAgbGV0IG1vZGUgPSB0aGlzLmdldEludGVyYWN0aW9uTW9kZSgpO1xuICAgIGlmICgobW9kZSA9PSBJbnRlcmFjdGlvbk1vZGVzLlZSXzBET0YgfHwgbW9kZSA9PSBJbnRlcmFjdGlvbk1vZGVzLlZSXzNET0YpICYmXG4gICAgICAgIGUuc2NyZWVuWCA9PSAwICYmIGUuc2NyZWVuWSA9PSAwKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgc2V0U2l6ZShzaXplKSB7XG4gICAgdGhpcy5zaXplID0gc2l6ZTtcbiAgfVxuXG4gIHVwZGF0ZSgpIHtcbiAgICBsZXQgbW9kZSA9IHRoaXMuZ2V0SW50ZXJhY3Rpb25Nb2RlKCk7XG4gICAgaWYgKG1vZGUgPT0gSW50ZXJhY3Rpb25Nb2Rlcy5WUl8wRE9GIHx8XG4gICAgICAgIG1vZGUgPT0gSW50ZXJhY3Rpb25Nb2Rlcy5WUl8zRE9GIHx8XG4gICAgICAgIG1vZGUgPT0gSW50ZXJhY3Rpb25Nb2Rlcy5WUl82RE9GKSB7XG4gICAgICAvLyBJZiB3ZSdyZSBkZWFsaW5nIHdpdGggYSBnYW1lcGFkLCBjaGVjayBldmVyeSBhbmltYXRpb24gZnJhbWUgZm9yIGFcbiAgICAgIC8vIHByZXNzZWQgYWN0aW9uLlxuICAgICAgbGV0IGlzR2FtZXBhZFByZXNzZWQgPSB0aGlzLmdldEdhbWVwYWRCdXR0b25QcmVzc2VkXygpO1xuICAgICAgaWYgKGlzR2FtZXBhZFByZXNzZWQgJiYgIXRoaXMud2FzR2FtZXBhZFByZXNzZWQpIHtcbiAgICAgICAgdGhpcy5lbWl0KCdyYXlkb3duJyk7XG4gICAgICB9XG4gICAgICBpZiAoIWlzR2FtZXBhZFByZXNzZWQgJiYgdGhpcy53YXNHYW1lcGFkUHJlc3NlZCkge1xuICAgICAgICB0aGlzLmVtaXQoJ3JheXVwJyk7XG4gICAgICB9XG4gICAgICB0aGlzLndhc0dhbWVwYWRQcmVzc2VkID0gaXNHYW1lcGFkUHJlc3NlZDtcbiAgICB9XG4gIH1cblxuICBnZXRHYW1lcGFkQnV0dG9uUHJlc3NlZF8oKSB7XG4gICAgdmFyIGdhbWVwYWQgPSB0aGlzLmdldFZSR2FtZXBhZF8oKTtcbiAgICBpZiAoIWdhbWVwYWQpIHtcbiAgICAgIC8vIElmIHRoZXJlJ3Mgbm8gZ2FtZXBhZCwgdGhlIGJ1dHRvbiB3YXMgbm90IHByZXNzZWQuXG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIC8vIENoZWNrIGZvciBjbGlja3MuXG4gICAgZm9yICh2YXIgaiA9IDA7IGogPCBnYW1lcGFkLmJ1dHRvbnMubGVuZ3RoOyArK2opIHtcbiAgICAgIGlmIChnYW1lcGFkLmJ1dHRvbnNbal0ucHJlc3NlZCkge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgb25Nb3VzZURvd25fKGUpIHtcbiAgICBpZiAodGhpcy5pc1N5bnRoZXRpY01vdXNlRXZlbnQpIHJldHVybjtcbiAgICBpZiAodGhpcy5pc0NhcmRib2FyZENvbXBhdENsaWNrKGUpKSByZXR1cm47XG5cbiAgICB0aGlzLnN0YXJ0RHJhZ2dpbmdfKGUpO1xuICAgIHRoaXMuZW1pdCgncmF5ZG93bicpO1xuICB9XG5cbiAgb25Nb3VzZU1vdmVfKGUpIHtcbiAgICBpZiAodGhpcy5pc1N5bnRoZXRpY01vdXNlRXZlbnQpIHJldHVybjtcblxuICAgIHRoaXMudXBkYXRlUG9pbnRlcl8oZSk7XG4gICAgdGhpcy51cGRhdGVEcmFnRGlzdGFuY2VfKCk7XG4gICAgdGhpcy5lbWl0KCdwb2ludGVybW92ZScsIHRoaXMucG9pbnRlck5kYyk7XG4gIH1cblxuICBvbk1vdXNlVXBfKGUpIHtcbiAgICB2YXIgaXNTeW50aGV0aWMgPSB0aGlzLmlzU3ludGhldGljTW91c2VFdmVudDtcbiAgICB0aGlzLmlzU3ludGhldGljTW91c2VFdmVudCA9IGZhbHNlO1xuICAgIGlmIChpc1N5bnRoZXRpYykgcmV0dXJuO1xuICAgIGlmICh0aGlzLmlzQ2FyZGJvYXJkQ29tcGF0Q2xpY2soZSkpIHJldHVybjtcblxuICAgIHRoaXMuZW5kRHJhZ2dpbmdfKCk7XG4gIH1cblxuICBvblRvdWNoU3RhcnRfKGUpIHtcbiAgICB0aGlzLmlzVG91Y2hBY3RpdmUgPSB0cnVlO1xuICAgIHZhciB0ID0gZS50b3VjaGVzWzBdO1xuICAgIHRoaXMuc3RhcnREcmFnZ2luZ18odCk7XG4gICAgdGhpcy51cGRhdGVUb3VjaFBvaW50ZXJfKGUpO1xuXG4gICAgdGhpcy5lbWl0KCdwb2ludGVybW92ZScsIHRoaXMucG9pbnRlck5kYyk7XG4gICAgdGhpcy5lbWl0KCdyYXlkb3duJyk7XG4gIH1cblxuICBvblRvdWNoTW92ZV8oZSkge1xuICAgIHRoaXMudXBkYXRlVG91Y2hQb2ludGVyXyhlKTtcbiAgICB0aGlzLnVwZGF0ZURyYWdEaXN0YW5jZV8oKTtcbiAgfVxuXG4gIG9uVG91Y2hFbmRfKGUpIHtcbiAgICB0aGlzLmVuZERyYWdnaW5nXygpO1xuXG4gICAgLy8gU3VwcHJlc3MgZHVwbGljYXRlIGV2ZW50cyBmcm9tIHN5bnRoZXRpYyBtb3VzZSBldmVudHMuXG4gICAgdGhpcy5pc1N5bnRoZXRpY01vdXNlRXZlbnQgPSB0cnVlO1xuICAgIHRoaXMuaXNUb3VjaEFjdGl2ZSA9IGZhbHNlO1xuICB9XG5cbiAgdXBkYXRlVG91Y2hQb2ludGVyXyhlKSB7XG4gICAgLy8gSWYgdGhlcmUncyBubyB0b3VjaGVzIGFycmF5LCBpZ25vcmUuXG4gICAgaWYgKGUudG91Y2hlcy5sZW5ndGggPT09IDApIHtcbiAgICAgIGNvbnNvbGUud2FybignUmVjZWl2ZWQgdG91Y2ggZXZlbnQgd2l0aCBubyB0b3VjaGVzLicpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgdCA9IGUudG91Y2hlc1swXTtcbiAgICB0aGlzLnVwZGF0ZVBvaW50ZXJfKHQpO1xuICB9XG5cbiAgdXBkYXRlUG9pbnRlcl8oZSkge1xuICAgIC8vIEhvdyBtdWNoIHRoZSBwb2ludGVyIG1vdmVkLlxuICAgIHRoaXMucG9pbnRlci5zZXQoZS5jbGllbnRYLCBlLmNsaWVudFkpO1xuICAgIHRoaXMucG9pbnRlck5kYy54ID0gKGUuY2xpZW50WCAvIHRoaXMuc2l6ZS53aWR0aCkgKiAyIC0gMTtcbiAgICB0aGlzLnBvaW50ZXJOZGMueSA9IC0gKGUuY2xpZW50WSAvIHRoaXMuc2l6ZS5oZWlnaHQpICogMiArIDE7XG4gIH1cblxuICB1cGRhdGVEcmFnRGlzdGFuY2VfKCkge1xuICAgIGlmICh0aGlzLmlzRHJhZ2dpbmcpIHtcbiAgICAgIHZhciBkaXN0YW5jZSA9IHRoaXMubGFzdFBvaW50ZXIuc3ViKHRoaXMucG9pbnRlcikubGVuZ3RoKCk7XG4gICAgICB0aGlzLmRyYWdEaXN0YW5jZSArPSBkaXN0YW5jZTtcbiAgICAgIHRoaXMubGFzdFBvaW50ZXIuY29weSh0aGlzLnBvaW50ZXIpO1xuXG5cbiAgICAgIC8vY29uc29sZS5sb2coJ2RyYWdEaXN0YW5jZScsIHRoaXMuZHJhZ0Rpc3RhbmNlKTtcbiAgICAgIGlmICh0aGlzLmRyYWdEaXN0YW5jZSA+IERSQUdfRElTVEFOQ0VfUFgpIHtcbiAgICAgICAgdGhpcy5lbWl0KCdyYXljYW5jZWwnKTtcbiAgICAgICAgdGhpcy5pc0RyYWdnaW5nID0gZmFsc2U7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgc3RhcnREcmFnZ2luZ18oZSkge1xuICAgIHRoaXMuaXNEcmFnZ2luZyA9IHRydWU7XG4gICAgdGhpcy5sYXN0UG9pbnRlci5zZXQoZS5jbGllbnRYLCBlLmNsaWVudFkpO1xuICB9XG5cbiAgZW5kRHJhZ2dpbmdfKCkge1xuICAgIGlmICh0aGlzLmRyYWdEaXN0YW5jZSA8IERSQUdfRElTVEFOQ0VfUFgpIHtcbiAgICAgIHRoaXMuZW1pdCgncmF5dXAnKTtcbiAgICB9XG4gICAgdGhpcy5kcmFnRGlzdGFuY2UgPSAwO1xuICAgIHRoaXMuaXNEcmFnZ2luZyA9IGZhbHNlO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGZpcnN0IFZSLWVuYWJsZWQgZ2FtZXBhZC5cbiAgICovXG4gIGdldFZSR2FtZXBhZF8oKSB7XG4gICAgLy8gSWYgdGhlcmUncyBubyBnYW1lcGFkIEFQSSwgdGhlcmUncyBubyBnYW1lcGFkLlxuICAgIGlmICghbmF2aWdhdG9yLmdldEdhbWVwYWRzKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICB2YXIgZ2FtZXBhZHMgPSBuYXZpZ2F0b3IuZ2V0R2FtZXBhZHMoKTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGdhbWVwYWRzLmxlbmd0aDsgKytpKSB7XG4gICAgICB2YXIgZ2FtZXBhZCA9IGdhbWVwYWRzW2ldO1xuXG4gICAgICAvLyBUaGUgYXJyYXkgbWF5IGNvbnRhaW4gdW5kZWZpbmVkIGdhbWVwYWRzLCBzbyBjaGVjayBmb3IgdGhhdCBhcyB3ZWxsIGFzXG4gICAgICAvLyBhIG5vbi1udWxsIHBvc2UuIENsaWNrZXIgZGV2aWNlcyBzdWNoIGFzIENhcmRib2FyZCBidXR0b24gZW11bGF0aW9uXG4gICAgICAvLyBoYXZlIGEgZGlzcGxheUlkIGJ1dCBubyBwb3NlLlxuICAgICAgaWYgKGdhbWVwYWQgJiYgKGdhbWVwYWQucG9zZSB8fCBnYW1lcGFkLmRpc3BsYXlJZCkpIHtcbiAgICAgICAgcmV0dXJuIGdhbWVwYWQ7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBudWxsO1xuICB9XG59XG4iLCIvKlxuICogQ29weXJpZ2h0IDIwMTYgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG5pbXBvcnQgT3JpZW50YXRpb25Bcm1Nb2RlbCBmcm9tICcuL29yaWVudGF0aW9uLWFybS1tb2RlbCdcbmltcG9ydCBFdmVudEVtaXR0ZXIgZnJvbSAnZXZlbnRlbWl0dGVyMydcbmltcG9ydCBSYXlSZW5kZXJlciBmcm9tICcuL3JheS1yZW5kZXJlcidcbmltcG9ydCBSYXlDb250cm9sbGVyIGZyb20gJy4vcmF5LWNvbnRyb2xsZXInXG5pbXBvcnQgSW50ZXJhY3Rpb25Nb2RlcyBmcm9tICcuL3JheS1pbnRlcmFjdGlvbi1tb2RlcydcblxuLyoqXG4gKiBBUEkgd3JhcHBlciBmb3IgdGhlIGlucHV0IGxpYnJhcnkuXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFJheUlucHV0IGV4dGVuZHMgRXZlbnRFbWl0dGVyIHtcbiAgY29uc3RydWN0b3IoY2FtZXJhLCBvcHRfZWwpIHtcbiAgICBzdXBlcigpO1xuXG4gICAgdGhpcy5jYW1lcmEgPSBjYW1lcmE7XG4gICAgdGhpcy5yZW5kZXJlciA9IG5ldyBSYXlSZW5kZXJlcihjYW1lcmEpO1xuICAgIHRoaXMuY29udHJvbGxlciA9IG5ldyBSYXlDb250cm9sbGVyKG9wdF9lbCk7XG5cbiAgICAvLyBBcm0gbW9kZWwgbmVlZGVkIHRvIHRyYW5zZm9ybSBjb250cm9sbGVyIG9yaWVudGF0aW9uIGludG8gcHJvcGVyIHBvc2UuXG4gICAgdGhpcy5hcm1Nb2RlbCA9IG5ldyBPcmllbnRhdGlvbkFybU1vZGVsKCk7XG5cbiAgICB0aGlzLmNvbnRyb2xsZXIub24oJ3JheWRvd24nLCB0aGlzLm9uUmF5RG93bl8uYmluZCh0aGlzKSk7XG4gICAgdGhpcy5jb250cm9sbGVyLm9uKCdyYXl1cCcsIHRoaXMub25SYXlVcF8uYmluZCh0aGlzKSk7XG4gICAgdGhpcy5jb250cm9sbGVyLm9uKCdyYXljYW5jZWwnLCB0aGlzLm9uUmF5Q2FuY2VsXy5iaW5kKHRoaXMpKTtcbiAgICB0aGlzLmNvbnRyb2xsZXIub24oJ3BvaW50ZXJtb3ZlJywgdGhpcy5vblBvaW50ZXJNb3ZlXy5iaW5kKHRoaXMpKTtcbiAgICB0aGlzLnJlbmRlcmVyLm9uKCdyYXlvdmVyJywgKG1lc2gpID0+IHsgdGhpcy5lbWl0KCdyYXlvdmVyJywgbWVzaCkgfSk7XG4gICAgdGhpcy5yZW5kZXJlci5vbigncmF5b3V0JywgKG1lc2gpID0+IHsgdGhpcy5lbWl0KCdyYXlvdXQnLCBtZXNoKSB9KTtcblxuICAgIC8vIEJ5IGRlZmF1bHQsIHB1dCB0aGUgcG9pbnRlciBvZmZzY3JlZW4uXG4gICAgdGhpcy5wb2ludGVyTmRjID0gbmV3IFRIUkVFLlZlY3RvcjIoMSwgMSk7XG5cbiAgICAvLyBFdmVudCBoYW5kbGVycy5cbiAgICB0aGlzLmhhbmRsZXJzID0ge307XG4gIH1cblxuICBhZGQob2JqZWN0LCBoYW5kbGVycykge1xuICAgIHRoaXMucmVuZGVyZXIuYWRkKG9iamVjdCwgaGFuZGxlcnMpO1xuICAgIHRoaXMuaGFuZGxlcnNbb2JqZWN0LmlkXSA9IGhhbmRsZXJzO1xuICB9XG5cbiAgcmVtb3ZlKG9iamVjdCkge1xuICAgIHRoaXMucmVuZGVyZXIucmVtb3ZlKG9iamVjdCk7XG4gICAgZGVsZXRlIHRoaXMuaGFuZGxlcnNbb2JqZWN0LmlkXVxuICB9XG5cbiAgdXBkYXRlKCkge1xuICAgIGxldCBsb29rQXQgPSBuZXcgVEhSRUUuVmVjdG9yMygwLCAwLCAtMSk7XG4gICAgbG9va0F0LmFwcGx5UXVhdGVybmlvbih0aGlzLmNhbWVyYS5xdWF0ZXJuaW9uKTtcblxuICAgIGxldCBtb2RlID0gdGhpcy5jb250cm9sbGVyLmdldEludGVyYWN0aW9uTW9kZSgpO1xuICAgIHN3aXRjaCAobW9kZSkge1xuICAgICAgY2FzZSBJbnRlcmFjdGlvbk1vZGVzLk1PVVNFOlxuICAgICAgICAvLyBEZXNrdG9wIG1vdXNlIG1vZGUsIG1vdXNlIGNvb3JkaW5hdGVzIGFyZSB3aGF0IG1hdHRlcnMuXG4gICAgICAgIHRoaXMucmVuZGVyZXIuc2V0UG9pbnRlcih0aGlzLnBvaW50ZXJOZGMpO1xuICAgICAgICAvLyBIaWRlIHRoZSByYXkgYW5kIHJldGljbGUuXG4gICAgICAgIHRoaXMucmVuZGVyZXIuc2V0UmF5VmlzaWJpbGl0eShmYWxzZSk7XG4gICAgICAgIHRoaXMucmVuZGVyZXIuc2V0UmV0aWNsZVZpc2liaWxpdHkoZmFsc2UpO1xuXG4gICAgICAgIC8vIEluIG1vdXNlIG1vZGUgcmF5IHJlbmRlcmVyIGlzIGFsd2F5cyBhY3RpdmUuXG4gICAgICAgIHRoaXMucmVuZGVyZXIuc2V0QWN0aXZlKHRydWUpO1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSBJbnRlcmFjdGlvbk1vZGVzLlRPVUNIOlxuICAgICAgICAvLyBNb2JpbGUgbWFnaWMgd2luZG93IG1vZGUuIFRvdWNoIGNvb3JkaW5hdGVzIG1hdHRlciwgYnV0IHdlIHdhbnQgdG9cbiAgICAgICAgLy8gaGlkZSB0aGUgcmV0aWNsZS5cbiAgICAgICAgdGhpcy5yZW5kZXJlci5zZXRQb2ludGVyKHRoaXMucG9pbnRlck5kYyk7XG5cbiAgICAgICAgLy8gSGlkZSB0aGUgcmF5IGFuZCB0aGUgcmV0aWNsZS5cbiAgICAgICAgdGhpcy5yZW5kZXJlci5zZXRSYXlWaXNpYmlsaXR5KGZhbHNlKTtcbiAgICAgICAgdGhpcy5yZW5kZXJlci5zZXRSZXRpY2xlVmlzaWJpbGl0eShmYWxzZSk7XG5cbiAgICAgICAgLy8gSW4gdG91Y2ggbW9kZSB0aGUgcmF5IHJlbmRlcmVyIGlzIG9ubHkgYWN0aXZlIG9uIHRvdWNoLlxuICAgICAgICB0aGlzLnJlbmRlcmVyLnNldEFjdGl2ZSh0aGlzLmNvbnRyb2xsZXIuZ2V0SXNUb3VjaEFjdGl2ZSgpKTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgSW50ZXJhY3Rpb25Nb2Rlcy5WUl8wRE9GOlxuICAgICAgICAvLyBDYXJkYm9hcmQgbW9kZSwgd2UncmUgZGVhbGluZyB3aXRoIGEgZ2F6ZSByZXRpY2xlLlxuICAgICAgICB0aGlzLnJlbmRlcmVyLnNldFBvc2l0aW9uKHRoaXMuY2FtZXJhLnBvc2l0aW9uKTtcbiAgICAgICAgdGhpcy5yZW5kZXJlci5zZXRPcmllbnRhdGlvbih0aGlzLmNhbWVyYS5xdWF0ZXJuaW9uKTtcblxuICAgICAgICAvLyBSZXRpY2xlIG9ubHkuXG4gICAgICAgIHRoaXMucmVuZGVyZXIuc2V0UmF5VmlzaWJpbGl0eShmYWxzZSk7XG4gICAgICAgIHRoaXMucmVuZGVyZXIuc2V0UmV0aWNsZVZpc2liaWxpdHkodHJ1ZSk7XG5cbiAgICAgICAgLy8gUmF5IHJlbmRlcmVyIGFsd2F5cyBhY3RpdmUuXG4gICAgICAgIHRoaXMucmVuZGVyZXIuc2V0QWN0aXZlKHRydWUpO1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSBJbnRlcmFjdGlvbk1vZGVzLlZSXzNET0Y6XG4gICAgICAgIC8vIERheWRyZWFtLCBvdXIgb3JpZ2luIGlzIHNsaWdodGx5IG9mZiAoZGVwZW5kaW5nIG9uIGhhbmRlZG5lc3MpLlxuICAgICAgICAvLyBCdXQgd2Ugc2hvdWxkIGJlIHVzaW5nIHRoZSBvcmllbnRhdGlvbiBmcm9tIHRoZSBnYW1lcGFkLlxuICAgICAgICAvLyBUT0RPKHNtdXMpOiBJbXBsZW1lbnQgdGhlIHJlYWwgYXJtIG1vZGVsLlxuICAgICAgICB2YXIgcG9zZSA9IHRoaXMuY29udHJvbGxlci5nZXRHYW1lcGFkUG9zZSgpO1xuXG4gICAgICAgIC8vIERlYnVnIG9ubHk6IHVzZSBjYW1lcmEgYXMgaW5wdXQgY29udHJvbGxlci5cbiAgICAgICAgLy9sZXQgY29udHJvbGxlck9yaWVudGF0aW9uID0gdGhpcy5jYW1lcmEucXVhdGVybmlvbjtcbiAgICAgICAgbGV0IGNvbnRyb2xsZXJPcmllbnRhdGlvbiA9IG5ldyBUSFJFRS5RdWF0ZXJuaW9uKCkuZnJvbUFycmF5KHBvc2Uub3JpZW50YXRpb24pO1xuXG4gICAgICAgIC8vIFRyYW5zZm9ybSB0aGUgY29udHJvbGxlciBpbnRvIHRoZSBjYW1lcmEgY29vcmRpbmF0ZSBzeXN0ZW0uXG4gICAgICAgIC8qXG4gICAgICAgIGNvbnRyb2xsZXJPcmllbnRhdGlvbi5tdWx0aXBseShcbiAgICAgICAgICAgIG5ldyBUSFJFRS5RdWF0ZXJuaW9uKCkuc2V0RnJvbUF4aXNBbmdsZShuZXcgVEhSRUUuVmVjdG9yMygwLCAxLCAwKSwgTWF0aC5QSSkpO1xuICAgICAgICBjb250cm9sbGVyT3JpZW50YXRpb24ueCAqPSAtMTtcbiAgICAgICAgY29udHJvbGxlck9yaWVudGF0aW9uLnogKj0gLTE7XG4gICAgICAgICovXG5cbiAgICAgICAgLy8gRmVlZCBjYW1lcmEgYW5kIGNvbnRyb2xsZXIgaW50byB0aGUgYXJtIG1vZGVsLlxuICAgICAgICB0aGlzLmFybU1vZGVsLnNldEhlYWRPcmllbnRhdGlvbih0aGlzLmNhbWVyYS5xdWF0ZXJuaW9uKTtcbiAgICAgICAgdGhpcy5hcm1Nb2RlbC5zZXRIZWFkUG9zaXRpb24odGhpcy5jYW1lcmEucG9zaXRpb24pO1xuICAgICAgICB0aGlzLmFybU1vZGVsLnNldENvbnRyb2xsZXJPcmllbnRhdGlvbihjb250cm9sbGVyT3JpZW50YXRpb24pO1xuICAgICAgICB0aGlzLmFybU1vZGVsLnNldExlZnRIYW5kZWQodGhpcy5jb250cm9sbGVyLmlzTGVmdEhhbmRlZCk7XG4gICAgICAgIHRoaXMuYXJtTW9kZWwudXBkYXRlKCk7XG5cbiAgICAgICAgLy8gR2V0IHJlc3VsdGluZyBwb3NlIGFuZCBjb25maWd1cmUgdGhlIHJlbmRlcmVyLlxuICAgICAgICBsZXQgbW9kZWxQb3NlID0gdGhpcy5hcm1Nb2RlbC5nZXRQb3NlKCk7XG4gICAgICAgIHRoaXMucmVuZGVyZXIuc2V0UG9zaXRpb24obW9kZWxQb3NlLnBvc2l0aW9uKTtcbiAgICAgICAgLy90aGlzLnJlbmRlcmVyLnNldFBvc2l0aW9uKG5ldyBUSFJFRS5WZWN0b3IzKCkpO1xuICAgICAgICB0aGlzLnJlbmRlcmVyLnNldE9yaWVudGF0aW9uKG1vZGVsUG9zZS5vcmllbnRhdGlvbik7XG4gICAgICAgIC8vdGhpcy5yZW5kZXJlci5zZXRPcmllbnRhdGlvbihjb250cm9sbGVyT3JpZW50YXRpb24pO1xuXG4gICAgICAgIC8vIFNob3cgcmF5IGFuZCByZXRpY2xlLlxuICAgICAgICB0aGlzLnJlbmRlcmVyLnNldFJheVZpc2liaWxpdHkodHJ1ZSk7XG4gICAgICAgIHRoaXMucmVuZGVyZXIuc2V0UmV0aWNsZVZpc2liaWxpdHkodHJ1ZSk7XG5cbiAgICAgICAgLy8gUmF5IHJlbmRlcmVyIGFsd2F5cyBhY3RpdmUuXG4gICAgICAgIHRoaXMucmVuZGVyZXIuc2V0QWN0aXZlKHRydWUpO1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSBJbnRlcmFjdGlvbk1vZGVzLlZSXzZET0Y6XG4gICAgICAgIC8vIFZpdmUsIG9yaWdpbiBkZXBlbmRzIG9uIHRoZSBwb3NpdGlvbiBvZiB0aGUgY29udHJvbGxlci5cbiAgICAgICAgLy8gVE9ETyhzbXVzKS4uLlxuICAgICAgICB2YXIgcG9zZSA9IHRoaXMuY29udHJvbGxlci5nZXRHYW1lcGFkUG9zZSgpO1xuXG4gICAgICAgIC8vIENoZWNrIHRoYXQgdGhlIHBvc2UgaXMgdmFsaWQuXG4gICAgICAgIGlmICghcG9zZS5vcmllbnRhdGlvbiB8fCAhcG9zZS5wb3NpdGlvbikge1xuICAgICAgICAgIGNvbnNvbGUud2FybignSW52YWxpZCBnYW1lcGFkIHBvc2UuIENhblxcJ3QgdXBkYXRlIHJheS4nKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBsZXQgb3JpZW50YXRpb24gPSBuZXcgVEhSRUUuUXVhdGVybmlvbigpLmZyb21BcnJheShwb3NlLm9yaWVudGF0aW9uKTtcbiAgICAgICAgbGV0IHBvc2l0aW9uID0gbmV3IFRIUkVFLlZlY3RvcjMoKS5mcm9tQXJyYXkocG9zZS5wb3NpdGlvbik7XG5cbiAgICAgICAgdGhpcy5yZW5kZXJlci5zZXRPcmllbnRhdGlvbihvcmllbnRhdGlvbik7XG4gICAgICAgIHRoaXMucmVuZGVyZXIuc2V0UG9zaXRpb24ocG9zaXRpb24pO1xuXG4gICAgICAgIC8vIFNob3cgcmF5IGFuZCByZXRpY2xlLlxuICAgICAgICB0aGlzLnJlbmRlcmVyLnNldFJheVZpc2liaWxpdHkodHJ1ZSk7XG4gICAgICAgIHRoaXMucmVuZGVyZXIuc2V0UmV0aWNsZVZpc2liaWxpdHkodHJ1ZSk7XG5cbiAgICAgICAgLy8gUmF5IHJlbmRlcmVyIGFsd2F5cyBhY3RpdmUuXG4gICAgICAgIHRoaXMucmVuZGVyZXIuc2V0QWN0aXZlKHRydWUpO1xuICAgICAgICBicmVhaztcblxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgY29uc29sZS5lcnJvcignVW5rbm93biBpbnRlcmFjdGlvbiBtb2RlLicpO1xuICAgIH1cbiAgICB0aGlzLnJlbmRlcmVyLnVwZGF0ZSgpO1xuICAgIHRoaXMuY29udHJvbGxlci51cGRhdGUoKTtcbiAgfVxuXG4gIHNldFNpemUoc2l6ZSkge1xuICAgIHRoaXMuY29udHJvbGxlci5zZXRTaXplKHNpemUpO1xuICB9XG5cbiAgZ2V0TWVzaCgpIHtcbiAgICByZXR1cm4gdGhpcy5yZW5kZXJlci5nZXRSZXRpY2xlUmF5TWVzaCgpO1xuICB9XG5cbiAgZ2V0T3JpZ2luKCkge1xuICAgIHJldHVybiB0aGlzLnJlbmRlcmVyLmdldE9yaWdpbigpO1xuICB9XG5cbiAgZ2V0RGlyZWN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLnJlbmRlcmVyLmdldERpcmVjdGlvbigpO1xuICB9XG5cbiAgZ2V0UmlnaHREaXJlY3Rpb24oKSB7XG4gICAgbGV0IGxvb2tBdCA9IG5ldyBUSFJFRS5WZWN0b3IzKDAsIDAsIC0xKTtcbiAgICBsb29rQXQuYXBwbHlRdWF0ZXJuaW9uKHRoaXMuY2FtZXJhLnF1YXRlcm5pb24pO1xuICAgIHJldHVybiBuZXcgVEhSRUUuVmVjdG9yMygpLmNyb3NzVmVjdG9ycyhsb29rQXQsIHRoaXMuY2FtZXJhLnVwKTtcbiAgfVxuXG4gIG9uUmF5RG93bl8oZSkge1xuICAgIC8vY29uc29sZS5sb2coJ29uUmF5RG93bl8nKTtcblxuICAgIC8vIEZvcmNlIHRoZSByZW5kZXJlciB0byByYXljYXN0LlxuICAgIHRoaXMucmVuZGVyZXIudXBkYXRlKCk7XG4gICAgbGV0IG1lc2ggPSB0aGlzLnJlbmRlcmVyLmdldFNlbGVjdGVkTWVzaCgpO1xuICAgIHRoaXMuZW1pdCgncmF5ZG93bicsIG1lc2gpO1xuXG4gICAgdGhpcy5yZW5kZXJlci5zZXRBY3RpdmUodHJ1ZSk7XG4gIH1cblxuICBvblJheVVwXyhlKSB7XG4gICAgLy9jb25zb2xlLmxvZygnb25SYXlVcF8nKTtcbiAgICBsZXQgbWVzaCA9IHRoaXMucmVuZGVyZXIuZ2V0U2VsZWN0ZWRNZXNoKCk7XG4gICAgdGhpcy5lbWl0KCdyYXl1cCcsIG1lc2gpO1xuXG4gICAgdGhpcy5yZW5kZXJlci5zZXRBY3RpdmUoZmFsc2UpO1xuICB9XG5cbiAgb25SYXlDYW5jZWxfKGUpIHtcbiAgICAvL2NvbnNvbGUubG9nKCdvblJheUNhbmNlbF8nKTtcbiAgICBsZXQgbWVzaCA9IHRoaXMucmVuZGVyZXIuZ2V0U2VsZWN0ZWRNZXNoKCk7XG4gICAgdGhpcy5lbWl0KCdyYXljYW5jZWwnLCBtZXNoKTtcbiAgfVxuXG4gIG9uUG9pbnRlck1vdmVfKG5kYykge1xuICAgIHRoaXMucG9pbnRlck5kYy5jb3B5KG5kYyk7XG4gIH1cbn1cbiIsIi8qXG4gKiBDb3B5cmlnaHQgMjAxNiBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbnZhciBJbnRlcmFjdGlvbk1vZGVzID0ge1xuICBNT1VTRTogMSxcbiAgVE9VQ0g6IDIsXG4gIFZSXzBET0Y6IDMsXG4gIFZSXzNET0Y6IDQsXG4gIFZSXzZET0Y6IDVcbn07XG5cbmV4cG9ydCB7IEludGVyYWN0aW9uTW9kZXMgYXMgZGVmYXVsdCB9O1xuIiwiLypcbiAqIENvcHlyaWdodCAyMDE2IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuaW1wb3J0IHtiYXNlNjR9IGZyb20gJy4vdXRpbCdcbmltcG9ydCBFdmVudEVtaXR0ZXIgZnJvbSAnZXZlbnRlbWl0dGVyMydcblxuY29uc3QgUkVUSUNMRV9ESVNUQU5DRSA9IDM7XG5jb25zdCBJTk5FUl9SQURJVVMgPSAwLjAyO1xuY29uc3QgT1VURVJfUkFESVVTID0gMC4wNDtcbmNvbnN0IFJBWV9SQURJVVMgPSAwLjAyO1xuY29uc3QgR1JBRElFTlRfSU1BR0UgPSBiYXNlNjQoJ2ltYWdlL3BuZycsICdpVkJPUncwS0dnb0FBQUFOU1VoRVVnQUFBSUFBQUFDQUNBWUFBQUREUG1ITEFBQUJka2xFUVZSNG5PM1d3WEhFUUF3RFFjaW4vRk9XdytCanVpUFlCMnE0RzJuUDkzM1A5U080ODI0emdEQURpRE9BdUhmYjMvVWp1S01BY1FZUVp3QngvZ0J4Q2hDbkFIRUtFS2NBY1FvUXB3QnhDaENuQUhFR0VHY0FjZjRBY1FvUVp3QnhCaEJuQUhFR0VHY0FjUVlRWndCeEJoQm5BSEVHRUdjQWNRWVFad0J4QmhCbkFISHZ0dC8xSTdpakFIRUdFR2NBY2Y0QWNRb1Fad0J4VGtDY0FzUVpRSndURUtjQWNRb1Fwd0J4QmhEbkJNUXBRSndDeENsQW5BTEVLVUNjQXNRcFFKd0N4Q2xBbkFMRUtVQ2NBc1FwUUp3QnhEa0JjUW9RcHdCeENoQ25BSEVLRUtjQWNRb1Fwd0J4Q2hDbkFIRUtFR2NBY1U1QW5BTEVLVUNjQXNRWlFKd1RFS2NBY1FZUTV3VEVLVUNjQWNRWlFKdy9RSndDeEJsQW5BSEVHVUNjQWNRWlFKd0J4QmxBbkFIRUdVQ2NBY1FaUUp3QnhCbEFuQUhFR1VEY3UrMjVmZ1IzRkNET0FPSU1JTTRmSUU0QjRoUWdUZ0hpRkNCT0FlSVVJRTRCNGhRZ3pnRGlEQ0RPSHlCT0FlSU1JTTRBNHY0Qi81SUY5ZUQ2UXhnQUFBQUFTVVZPUks1Q1lJST0nKTtcblxuLyoqXG4gKiBIYW5kbGVzIHJheSBpbnB1dCBzZWxlY3Rpb24gZnJvbSBmcmFtZSBvZiByZWZlcmVuY2Ugb2YgYW4gYXJiaXRyYXJ5IG9iamVjdC5cbiAqXG4gKiBUaGUgc291cmNlIG9mIHRoZSByYXkgaXMgZnJvbSB2YXJpb3VzIGxvY2F0aW9uczpcbiAqXG4gKiBEZXNrdG9wOiBtb3VzZS5cbiAqIE1hZ2ljIHdpbmRvdzogdG91Y2guXG4gKiBDYXJkYm9hcmQ6IGNhbWVyYS5cbiAqIERheWRyZWFtOiAzRE9GIGNvbnRyb2xsZXIgdmlhIGdhbWVwYWQgKGFuZCBzaG93IHJheSkuXG4gKiBWaXZlOiA2RE9GIGNvbnRyb2xsZXIgdmlhIGdhbWVwYWQgKGFuZCBzaG93IHJheSkuXG4gKlxuICogRW1pdHMgc2VsZWN0aW9uIGV2ZW50czpcbiAqICAgICByYXlvdmVyKG1lc2gpOiBUaGlzIG1lc2ggd2FzIHNlbGVjdGVkLlxuICogICAgIHJheW91dChtZXNoKTogVGhpcyBtZXNoIHdhcyB1bnNlbGVjdGVkLlxuICovXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBSYXlSZW5kZXJlciBleHRlbmRzIEV2ZW50RW1pdHRlciB7XG4gIGNvbnN0cnVjdG9yKGNhbWVyYSwgb3B0X3BhcmFtcykge1xuICAgIHN1cGVyKCk7XG5cbiAgICB0aGlzLmNhbWVyYSA9IGNhbWVyYTtcblxuICAgIHZhciBwYXJhbXMgPSBvcHRfcGFyYW1zIHx8IHt9O1xuXG4gICAgLy8gV2hpY2ggb2JqZWN0cyBhcmUgaW50ZXJhY3RpdmUgKGtleWVkIG9uIGlkKS5cbiAgICB0aGlzLm1lc2hlcyA9IHt9O1xuXG4gICAgLy8gV2hpY2ggb2JqZWN0cyBhcmUgY3VycmVudGx5IHNlbGVjdGVkIChrZXllZCBvbiBpZCkuXG4gICAgdGhpcy5zZWxlY3RlZCA9IHt9O1xuXG4gICAgLy8gVGhlIHJheWNhc3Rlci5cbiAgICB0aGlzLnJheWNhc3RlciA9IG5ldyBUSFJFRS5SYXljYXN0ZXIoKTtcblxuICAgIC8vIFBvc2l0aW9uIGFuZCBvcmllbnRhdGlvbiwgaW4gYWRkaXRpb24uXG4gICAgdGhpcy5wb3NpdGlvbiA9IG5ldyBUSFJFRS5WZWN0b3IzKCk7XG4gICAgdGhpcy5vcmllbnRhdGlvbiA9IG5ldyBUSFJFRS5RdWF0ZXJuaW9uKCk7XG5cbiAgICB0aGlzLnJvb3QgPSBuZXcgVEhSRUUuT2JqZWN0M0QoKTtcblxuICAgIC8vIEFkZCB0aGUgcmV0aWNsZSBtZXNoIHRvIHRoZSByb290IG9mIHRoZSBvYmplY3QuXG4gICAgdGhpcy5yZXRpY2xlID0gdGhpcy5jcmVhdGVSZXRpY2xlXygpO1xuICAgIHRoaXMucm9vdC5hZGQodGhpcy5yZXRpY2xlKTtcblxuICAgIC8vIEFkZCB0aGUgcmF5IHRvIHRoZSByb290IG9mIHRoZSBvYmplY3QuXG4gICAgdGhpcy5yYXkgPSB0aGlzLmNyZWF0ZVJheV8oKTtcbiAgICB0aGlzLnJvb3QuYWRkKHRoaXMucmF5KTtcblxuICAgIC8vIEhvdyBmYXIgdGhlIHJldGljbGUgaXMgY3VycmVudGx5IGZyb20gdGhlIHJldGljbGUgb3JpZ2luLlxuICAgIHRoaXMucmV0aWNsZURpc3RhbmNlID0gUkVUSUNMRV9ESVNUQU5DRTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZWdpc3RlciBhbiBvYmplY3Qgc28gdGhhdCBpdCBjYW4gYmUgaW50ZXJhY3RlZCB3aXRoLlxuICAgKi9cbiAgYWRkKG9iamVjdCkge1xuICAgIHRoaXMubWVzaGVzW29iamVjdC5pZF0gPSBvYmplY3Q7XG4gIH1cblxuICAvKipcbiAgICogUHJldmVudCBhbiBvYmplY3QgZnJvbSBiZWluZyBpbnRlcmFjdGVkIHdpdGguXG4gICAqL1xuICByZW1vdmUob2JqZWN0KSB7XG4gICAgdmFyIGlkID0gb2JqZWN0LmlkO1xuICAgIGlmICh0aGlzLm1lc2hlc1tpZF0pIHtcbiAgICAgIC8vIElmIHRoZXJlJ3Mgbm8gZXhpc3RpbmcgbWVzaCwgd2UgY2FuJ3QgcmVtb3ZlIGl0LlxuICAgICAgZGVsZXRlIHRoaXMubWVzaGVzW2lkXTtcbiAgICB9XG4gICAgLy8gSWYgdGhlIG9iamVjdCBpcyBjdXJyZW50bHkgc2VsZWN0ZWQsIHJlbW92ZSBpdC5cbiAgICBpZiAodGhpcy5zZWxlY3RlZFtpZF0pIHtcbiAgICAgIGRlbGV0ZSB0aGlzLnNlbGVjdGVkW29iamVjdC5pZF07XG4gICAgfVxuICB9XG5cbiAgdXBkYXRlKCkge1xuICAgIC8vIERvIHRoZSByYXljYXN0aW5nIGFuZCBpc3N1ZSB2YXJpb3VzIGV2ZW50cyBhcyBuZWVkZWQuXG4gICAgZm9yIChsZXQgaWQgaW4gdGhpcy5tZXNoZXMpIHtcbiAgICAgIGxldCBtZXNoID0gdGhpcy5tZXNoZXNbaWRdO1xuICAgICAgbGV0IGludGVyc2VjdHMgPSB0aGlzLnJheWNhc3Rlci5pbnRlcnNlY3RPYmplY3QobWVzaCwgdHJ1ZSk7XG4gICAgICBpZiAoaW50ZXJzZWN0cy5sZW5ndGggPiAxKSB7XG4gICAgICAgIGNvbnNvbGUud2FybignVW5leHBlY3RlZDogbXVsdGlwbGUgbWVzaGVzIGludGVyc2VjdGVkLicpO1xuICAgICAgfVxuICAgICAgbGV0IGlzSW50ZXJzZWN0ZWQgPSAoaW50ZXJzZWN0cy5sZW5ndGggPiAwKTtcbiAgICAgIGxldCBpc1NlbGVjdGVkID0gdGhpcy5zZWxlY3RlZFtpZF07XG5cbiAgICAgIC8vIElmIGl0J3MgbmV3bHkgc2VsZWN0ZWQsIHNlbmQgcmF5b3Zlci5cbiAgICAgIGlmIChpc0ludGVyc2VjdGVkICYmICFpc1NlbGVjdGVkKSB7XG4gICAgICAgIHRoaXMuc2VsZWN0ZWRbaWRdID0gdHJ1ZTtcbiAgICAgICAgaWYgKHRoaXMuaXNBY3RpdmUpIHtcbiAgICAgICAgICB0aGlzLmVtaXQoJ3JheW92ZXInLCBtZXNoKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBJZiBpdCdzIG5vIGxvbmdlciBpbnRlcnNlY3RlZCwgc2VuZCByYXlvdXQuXG4gICAgICBpZiAoIWlzSW50ZXJzZWN0ZWQgJiYgaXNTZWxlY3RlZCkge1xuICAgICAgICBkZWxldGUgdGhpcy5zZWxlY3RlZFtpZF07XG4gICAgICAgIHRoaXMubW92ZVJldGljbGVfKG51bGwpO1xuICAgICAgICBpZiAodGhpcy5pc0FjdGl2ZSkge1xuICAgICAgICAgIHRoaXMuZW1pdCgncmF5b3V0JywgbWVzaCk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKGlzSW50ZXJzZWN0ZWQpIHtcbiAgICAgICAgdGhpcy5tb3ZlUmV0aWNsZV8oaW50ZXJzZWN0cyk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIG9yaWdpbiBvZiB0aGUgcmF5LlxuICAgKiBAcGFyYW0ge1ZlY3Rvcn0gdmVjdG9yIFBvc2l0aW9uIG9mIHRoZSBvcmlnaW4gb2YgdGhlIHBpY2tpbmcgcmF5LlxuICAgKi9cbiAgc2V0UG9zaXRpb24odmVjdG9yKSB7XG4gICAgdGhpcy5wb3NpdGlvbi5jb3B5KHZlY3Rvcik7XG4gICAgdGhpcy5yYXljYXN0ZXIucmF5Lm9yaWdpbi5jb3B5KHZlY3Rvcik7XG4gICAgdGhpcy51cGRhdGVSYXljYXN0ZXJfKCk7XG4gIH1cblxuICBnZXRPcmlnaW4oKSB7XG4gICAgcmV0dXJuIHRoaXMucmF5Y2FzdGVyLnJheS5vcmlnaW47XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgZGlyZWN0aW9uIG9mIHRoZSByYXkuXG4gICAqIEBwYXJhbSB7VmVjdG9yfSB2ZWN0b3IgVW5pdCB2ZWN0b3IgY29ycmVzcG9uZGluZyB0byBkaXJlY3Rpb24uXG4gICAqL1xuICBzZXRPcmllbnRhdGlvbihxdWF0ZXJuaW9uKSB7XG4gICAgdGhpcy5vcmllbnRhdGlvbi5jb3B5KHF1YXRlcm5pb24pO1xuXG4gICAgdmFyIHBvaW50QXQgPSBuZXcgVEhSRUUuVmVjdG9yMygwLCAwLCAtMSkuYXBwbHlRdWF0ZXJuaW9uKHF1YXRlcm5pb24pO1xuICAgIHRoaXMucmF5Y2FzdGVyLnJheS5kaXJlY3Rpb24uY29weShwb2ludEF0KVxuICAgIHRoaXMudXBkYXRlUmF5Y2FzdGVyXygpO1xuICB9XG5cbiAgZ2V0RGlyZWN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLnJheWNhc3Rlci5yYXkuZGlyZWN0aW9uO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIHBvaW50ZXIgb24gdGhlIHNjcmVlbiBmb3IgY2FtZXJhICsgcG9pbnRlciBiYXNlZCBwaWNraW5nLiBUaGlzXG4gICAqIHN1cGVyc2NlZGVzIG9yaWdpbiBhbmQgZGlyZWN0aW9uLlxuICAgKlxuICAgKiBAcGFyYW0ge1ZlY3RvcjJ9IHZlY3RvciBUaGUgcG9zaXRpb24gb2YgdGhlIHBvaW50ZXIgKHNjcmVlbiBjb29yZHMpLlxuICAgKi9cbiAgc2V0UG9pbnRlcih2ZWN0b3IpIHtcbiAgICB0aGlzLnJheWNhc3Rlci5zZXRGcm9tQ2FtZXJhKHZlY3RvciwgdGhpcy5jYW1lcmEpO1xuICAgIHRoaXMudXBkYXRlUmF5Y2FzdGVyXygpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIG1lc2gsIHdoaWNoIGluY2x1ZGVzIHJldGljbGUgYW5kL29yIHJheS4gVGhpcyBtZXNoIGlzIHRoZW4gYWRkZWRcbiAgICogdG8gdGhlIHNjZW5lLlxuICAgKi9cbiAgZ2V0UmV0aWNsZVJheU1lc2goKSB7XG4gICAgcmV0dXJuIHRoaXMucm9vdDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBjdXJyZW50bHkgc2VsZWN0ZWQgb2JqZWN0IGluIHRoZSBzY2VuZS5cbiAgICovXG4gIGdldFNlbGVjdGVkTWVzaCgpIHtcbiAgICBsZXQgY291bnQgPSAwO1xuICAgIGxldCBtZXNoID0gbnVsbDtcbiAgICBmb3IgKHZhciBpZCBpbiB0aGlzLnNlbGVjdGVkKSB7XG4gICAgICBjb3VudCArPSAxO1xuICAgICAgbWVzaCA9IHRoaXMubWVzaGVzW2lkXTtcbiAgICB9XG4gICAgaWYgKGNvdW50ID4gMSkge1xuICAgICAgY29uc29sZS53YXJuKCdNb3JlIHRoYW4gb25lIG1lc2ggc2VsZWN0ZWQuJyk7XG4gICAgfVxuICAgIHJldHVybiBtZXNoO1xuICB9XG5cbiAgLyoqXG4gICAqIEhpZGVzIGFuZCBzaG93cyB0aGUgcmV0aWNsZS5cbiAgICovXG4gIHNldFJldGljbGVWaXNpYmlsaXR5KGlzVmlzaWJsZSkge1xuICAgIHRoaXMucmV0aWNsZS52aXNpYmxlID0gaXNWaXNpYmxlO1xuICB9XG5cbiAgLyoqXG4gICAqIEVuYWJsZXMgb3IgZGlzYWJsZXMgdGhlIHJheWNhc3RpbmcgcmF5IHdoaWNoIGdyYWR1YWxseSBmYWRlcyBvdXQgZnJvbVxuICAgKiB0aGUgb3JpZ2luLlxuICAgKi9cbiAgc2V0UmF5VmlzaWJpbGl0eShpc1Zpc2libGUpIHtcbiAgICB0aGlzLnJheS52aXNpYmxlID0gaXNWaXNpYmxlO1xuICB9XG5cbiAgLyoqXG4gICAqIEVuYWJsZXMgYW5kIGRpc2FibGVzIHRoZSByYXljYXN0ZXIuIEZvciB0b3VjaCwgd2hlcmUgZmluZ2VyIHVwIG1lYW5zIHdlXG4gICAqIHNob3VsZG4ndCBiZSByYXljYXN0aW5nLlxuICAgKi9cbiAgc2V0QWN0aXZlKGlzQWN0aXZlKSB7XG4gICAgLy8gSWYgbm90aGluZyBjaGFuZ2VkLCBkbyBub3RoaW5nLlxuICAgIGlmICh0aGlzLmlzQWN0aXZlID09IGlzQWN0aXZlKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIC8vIFRPRE8oc211cyk6IFNob3cgdGhlIHJheSBvciByZXRpY2xlIGFkanVzdCBpbiByZXNwb25zZS5cbiAgICB0aGlzLmlzQWN0aXZlID0gaXNBY3RpdmU7XG5cbiAgICBpZiAoIWlzQWN0aXZlKSB7XG4gICAgICB0aGlzLm1vdmVSZXRpY2xlXyhudWxsKTtcbiAgICAgIGZvciAobGV0IGlkIGluIHRoaXMuc2VsZWN0ZWQpIHtcbiAgICAgICAgbGV0IG1lc2ggPSB0aGlzLm1lc2hlc1tpZF07XG4gICAgICAgIGRlbGV0ZSB0aGlzLnNlbGVjdGVkW2lkXTtcbiAgICAgICAgdGhpcy5lbWl0KCdyYXlvdXQnLCBtZXNoKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICB1cGRhdGVSYXljYXN0ZXJfKCkge1xuICAgIHZhciByYXkgPSB0aGlzLnJheWNhc3Rlci5yYXk7XG5cbiAgICAvLyBQb3NpdGlvbiB0aGUgcmV0aWNsZSBhdCBhIGRpc3RhbmNlLCBhcyBjYWxjdWxhdGVkIGZyb20gdGhlIG9yaWdpbiBhbmRcbiAgICAvLyBkaXJlY3Rpb24uXG4gICAgdmFyIHBvc2l0aW9uID0gdGhpcy5yZXRpY2xlLnBvc2l0aW9uO1xuICAgIHBvc2l0aW9uLmNvcHkocmF5LmRpcmVjdGlvbik7XG4gICAgcG9zaXRpb24ubXVsdGlwbHlTY2FsYXIodGhpcy5yZXRpY2xlRGlzdGFuY2UpO1xuICAgIHBvc2l0aW9uLmFkZChyYXkub3JpZ2luKTtcblxuICAgIC8vIFNldCBwb3NpdGlvbiBhbmQgb3JpZW50YXRpb24gb2YgdGhlIHJheSBzbyB0aGF0IGl0IGdvZXMgZnJvbSBvcmlnaW4gdG9cbiAgICAvLyByZXRpY2xlLlxuICAgIHZhciBkZWx0YSA9IG5ldyBUSFJFRS5WZWN0b3IzKCkuY29weShyYXkuZGlyZWN0aW9uKTtcbiAgICBkZWx0YS5tdWx0aXBseVNjYWxhcih0aGlzLnJldGljbGVEaXN0YW5jZSk7XG4gICAgdGhpcy5yYXkuc2NhbGUueSA9IGRlbHRhLmxlbmd0aCgpO1xuICAgIHZhciBhcnJvdyA9IG5ldyBUSFJFRS5BcnJvd0hlbHBlcihyYXkuZGlyZWN0aW9uLCByYXkub3JpZ2luKTtcbiAgICB0aGlzLnJheS5yb3RhdGlvbi5jb3B5KGFycm93LnJvdGF0aW9uKTtcbiAgICB0aGlzLnJheS5wb3NpdGlvbi5hZGRWZWN0b3JzKHJheS5vcmlnaW4sIGRlbHRhLm11bHRpcGx5U2NhbGFyKDAuNSkpO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgdGhlIGdlb21ldHJ5IG9mIHRoZSByZXRpY2xlLlxuICAgKi9cbiAgY3JlYXRlUmV0aWNsZV8oKSB7XG4gICAgLy8gQ3JlYXRlIGEgc3BoZXJpY2FsIHJldGljbGUuXG4gICAgbGV0IGlubmVyR2VvbWV0cnkgPSBuZXcgVEhSRUUuU3BoZXJlR2VvbWV0cnkoSU5ORVJfUkFESVVTLCAzMiwgMzIpO1xuICAgIGxldCBpbm5lck1hdGVyaWFsID0gbmV3IFRIUkVFLk1lc2hCYXNpY01hdGVyaWFsKHtcbiAgICAgIGNvbG9yOiAweGZmZmZmZixcbiAgICAgIHRyYW5zcGFyZW50OiB0cnVlLFxuICAgICAgb3BhY2l0eTogMC45XG4gICAgfSk7XG4gICAgbGV0IGlubmVyID0gbmV3IFRIUkVFLk1lc2goaW5uZXJHZW9tZXRyeSwgaW5uZXJNYXRlcmlhbCk7XG5cbiAgICBsZXQgb3V0ZXJHZW9tZXRyeSA9IG5ldyBUSFJFRS5TcGhlcmVHZW9tZXRyeShPVVRFUl9SQURJVVMsIDMyLCAzMik7XG4gICAgbGV0IG91dGVyTWF0ZXJpYWwgPSBuZXcgVEhSRUUuTWVzaEJhc2ljTWF0ZXJpYWwoe1xuICAgICAgY29sb3I6IDB4MzMzMzMzLFxuICAgICAgdHJhbnNwYXJlbnQ6IHRydWUsXG4gICAgICBvcGFjaXR5OiAwLjNcbiAgICB9KTtcbiAgICBsZXQgb3V0ZXIgPSBuZXcgVEhSRUUuTWVzaChvdXRlckdlb21ldHJ5LCBvdXRlck1hdGVyaWFsKTtcblxuICAgIGxldCByZXRpY2xlID0gbmV3IFRIUkVFLkdyb3VwKCk7XG4gICAgcmV0aWNsZS5hZGQoaW5uZXIpO1xuICAgIHJldGljbGUuYWRkKG91dGVyKTtcbiAgICByZXR1cm4gcmV0aWNsZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBNb3ZlcyB0aGUgcmV0aWNsZSB0byBhIHBvc2l0aW9uIHNvIHRoYXQgaXQncyBqdXN0IGluIGZyb250IG9mIHRoZSBtZXNoIHRoYXRcbiAgICogaXQgaW50ZXJzZWN0ZWQgd2l0aC5cbiAgICovXG4gIG1vdmVSZXRpY2xlXyhpbnRlcnNlY3Rpb25zKSB7XG4gICAgLy8gSWYgbm8gaW50ZXJzZWN0aW9uLCByZXR1cm4gdGhlIHJldGljbGUgdG8gdGhlIGRlZmF1bHQgcG9zaXRpb24uXG4gICAgbGV0IGRpc3RhbmNlID0gUkVUSUNMRV9ESVNUQU5DRTtcbiAgICBpZiAoaW50ZXJzZWN0aW9ucykge1xuICAgICAgLy8gT3RoZXJ3aXNlLCBkZXRlcm1pbmUgdGhlIGNvcnJlY3QgZGlzdGFuY2UuXG4gICAgICBsZXQgaW50ZXIgPSBpbnRlcnNlY3Rpb25zWzBdO1xuICAgICAgZGlzdGFuY2UgPSBpbnRlci5kaXN0YW5jZTtcbiAgICB9XG5cbiAgICB0aGlzLnJldGljbGVEaXN0YW5jZSA9IGRpc3RhbmNlO1xuICAgIHRoaXMudXBkYXRlUmF5Y2FzdGVyXygpO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGNyZWF0ZVJheV8oKSB7XG4gICAgLy8gQ3JlYXRlIGEgY3lsaW5kcmljYWwgcmF5LlxuICAgIHZhciBnZW9tZXRyeSA9IG5ldyBUSFJFRS5DeWxpbmRlckdlb21ldHJ5KFJBWV9SQURJVVMsIFJBWV9SQURJVVMsIDEsIDMyKTtcbiAgICB2YXIgbWF0ZXJpYWwgPSBuZXcgVEhSRUUuTWVzaEJhc2ljTWF0ZXJpYWwoe1xuICAgICAgbWFwOiBUSFJFRS5JbWFnZVV0aWxzLmxvYWRUZXh0dXJlKEdSQURJRU5UX0lNQUdFKSxcbiAgICAgIC8vY29sb3I6IDB4ZmZmZmZmLFxuICAgICAgdHJhbnNwYXJlbnQ6IHRydWUsXG4gICAgICBvcGFjaXR5OiAwLjNcbiAgICB9KTtcbiAgICB2YXIgbWVzaCA9IG5ldyBUSFJFRS5NZXNoKGdlb21ldHJ5LCBtYXRlcmlhbCk7XG5cbiAgICByZXR1cm4gbWVzaDtcbiAgfVxufVxuIiwiLypcbiAqIENvcHlyaWdodCAyMDE2IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuZXhwb3J0IGZ1bmN0aW9uIGlzTW9iaWxlKCkge1xuICB2YXIgY2hlY2sgPSBmYWxzZTtcbiAgKGZ1bmN0aW9uKGEpe2lmKC8oYW5kcm9pZHxiYlxcZCt8bWVlZ28pLittb2JpbGV8YXZhbnRnb3xiYWRhXFwvfGJsYWNrYmVycnl8YmxhemVyfGNvbXBhbHxlbGFpbmV8ZmVubmVjfGhpcHRvcHxpZW1vYmlsZXxpcChob25lfG9kKXxpcmlzfGtpbmRsZXxsZ2UgfG1hZW1vfG1pZHB8bW1wfG1vYmlsZS4rZmlyZWZveHxuZXRmcm9udHxvcGVyYSBtKG9ifGluKWl8cGFsbSggb3MpP3xwaG9uZXxwKGl4aXxyZSlcXC98cGx1Y2tlcnxwb2NrZXR8cHNwfHNlcmllcyg0fDYpMHxzeW1iaWFufHRyZW98dXBcXC4oYnJvd3NlcnxsaW5rKXx2b2RhZm9uZXx3YXB8d2luZG93cyBjZXx4ZGF8eGlpbm8vaS50ZXN0KGEpfHwvMTIwN3w2MzEwfDY1OTB8M2dzb3w0dGhwfDUwWzEtNl1pfDc3MHN8ODAyc3xhIHdhfGFiYWN8YWMoZXJ8b298c1xcLSl8YWkoa298cm4pfGFsKGF2fGNhfGNvKXxhbW9pfGFuKGV4fG55fHl3KXxhcHR1fGFyKGNofGdvKXxhcyh0ZXx1cyl8YXR0d3xhdShkaXxcXC1tfHIgfHMgKXxhdmFufGJlKGNrfGxsfG5xKXxiaShsYnxyZCl8YmwoYWN8YXopfGJyKGV8dil3fGJ1bWJ8YndcXC0obnx1KXxjNTVcXC98Y2FwaXxjY3dhfGNkbVxcLXxjZWxsfGNodG18Y2xkY3xjbWRcXC18Y28obXB8bmQpfGNyYXd8ZGEoaXR8bGx8bmcpfGRidGV8ZGNcXC1zfGRldml8ZGljYXxkbW9ifGRvKGN8cClvfGRzKDEyfFxcLWQpfGVsKDQ5fGFpKXxlbShsMnx1bCl8ZXIoaWN8azApfGVzbDh8ZXooWzQtN10wfG9zfHdhfHplKXxmZXRjfGZseShcXC18Xyl8ZzEgdXxnNTYwfGdlbmV8Z2ZcXC01fGdcXC1tb3xnbyhcXC53fG9kKXxncihhZHx1bil8aGFpZXxoY2l0fGhkXFwtKG18cHx0KXxoZWlcXC18aGkocHR8dGEpfGhwKCBpfGlwKXxoc1xcLWN8aHQoYyhcXC18IHxffGF8Z3xwfHN8dCl8dHApfGh1KGF3fHRjKXxpXFwtKDIwfGdvfG1hKXxpMjMwfGlhYyggfFxcLXxcXC8pfGlicm98aWRlYXxpZzAxfGlrb218aW0xa3xpbm5vfGlwYXF8aXJpc3xqYSh0fHYpYXxqYnJvfGplbXV8amlnc3xrZGRpfGtlaml8a2d0KCB8XFwvKXxrbG9ufGtwdCB8a3djXFwtfGt5byhjfGspfGxlKG5vfHhpKXxsZyggZ3xcXC8oa3xsfHUpfDUwfDU0fFxcLVthLXddKXxsaWJ3fGx5bnh8bTFcXC13fG0zZ2F8bTUwXFwvfG1hKHRlfHVpfHhvKXxtYygwMXwyMXxjYSl8bVxcLWNyfG1lKHJjfHJpKXxtaShvOHxvYXx0cyl8bW1lZnxtbygwMXwwMnxiaXxkZXxkb3x0KFxcLXwgfG98dil8enopfG10KDUwfHAxfHYgKXxtd2JwfG15d2F8bjEwWzAtMl18bjIwWzItM118bjMwKDB8Mil8bjUwKDB8Mnw1KXxuNygwKDB8MSl8MTApfG5lKChjfG0pXFwtfG9ufHRmfHdmfHdnfHd0KXxub2soNnxpKXxuenBofG8yaW18b3AodGl8d3YpfG9yYW58b3dnMXxwODAwfHBhbihhfGR8dCl8cGR4Z3xwZygxM3xcXC0oWzEtOF18YykpfHBoaWx8cGlyZXxwbChheXx1Yyl8cG5cXC0yfHBvKGNrfHJ0fHNlKXxwcm94fHBzaW98cHRcXC1nfHFhXFwtYXxxYygwN3wxMnwyMXwzMnw2MHxcXC1bMi03XXxpXFwtKXxxdGVrfHIzODB8cjYwMHxyYWtzfHJpbTl8cm8odmV8em8pfHM1NVxcL3xzYShnZXxtYXxtbXxtc3xueXx2YSl8c2MoMDF8aFxcLXxvb3xwXFwtKXxzZGtcXC98c2UoYyhcXC18MHwxKXw0N3xtY3xuZHxyaSl8c2doXFwtfHNoYXJ8c2llKFxcLXxtKXxza1xcLTB8c2woNDV8aWQpfHNtKGFsfGFyfGIzfGl0fHQ1KXxzbyhmdHxueSl8c3AoMDF8aFxcLXx2XFwtfHYgKXxzeSgwMXxtYil8dDIoMTh8NTApfHQ2KDAwfDEwfDE4KXx0YShndHxsayl8dGNsXFwtfHRkZ1xcLXx0ZWwoaXxtKXx0aW1cXC18dFxcLW1vfHRvKHBsfHNoKXx0cyg3MHxtXFwtfG0zfG01KXx0eFxcLTl8dXAoXFwuYnxnMXxzaSl8dXRzdHx2NDAwfHY3NTB8dmVyaXx2aShyZ3x0ZSl8dmsoNDB8NVswLTNdfFxcLXYpfHZtNDB8dm9kYXx2dWxjfHZ4KDUyfDUzfDYwfDYxfDcwfDgwfDgxfDgzfDg1fDk4KXx3M2MoXFwtfCApfHdlYmN8d2hpdHx3aShnIHxuY3xudyl8d21sYnx3b251fHg3MDB8eWFzXFwtfHlvdXJ8emV0b3x6dGVcXC0vaS50ZXN0KGEuc3Vic3RyKDAsNCkpKWNoZWNrID0gdHJ1ZX0pKG5hdmlnYXRvci51c2VyQWdlbnR8fG5hdmlnYXRvci52ZW5kb3J8fHdpbmRvdy5vcGVyYSk7XG4gIHJldHVybiBjaGVjaztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGJhc2U2NChtaW1lVHlwZSwgYmFzZTY0KSB7XG4gIHJldHVybiAnZGF0YTonICsgbWltZVR5cGUgKyAnO2Jhc2U2NCwnICsgYmFzZTY0O1xufVxuIl19
