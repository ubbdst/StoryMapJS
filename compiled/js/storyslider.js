/*!
	VCO
*/

(function (root) {
	root.VCO = {
		VERSION: '0.1',
		_originalL: root.VCO
	};
}(this));

/*	VCO.Debug
	Debug mode
================================================== */
VCO.debug = true;



/*	VCO.Bind
================================================== */
VCO.Bind = function (/*Function*/ fn, /*Object*/ obj) /*-> Object*/ {
	return function () {
		return fn.apply(obj, arguments);
	};
};



/* Trace (console.log)
================================================== */
trace = function( msg ) {
	if (VCO.debug) {
		if (window.console) {
			console.log(msg);
		} else if ( typeof( jsTrace ) != 'undefined' ) {
			jsTrace.send( msg );
		} else {
			//alert(msg);
		}
	}
}

/* **********************************************
     Begin VCO.Util.js
********************************************** */

/*	VCO.Util
	Class of utilities
================================================== */
VCO.Util = {
	
	extend: function (/*Object*/ dest) /*-> Object*/ {	// merge src properties into dest
		var sources = Array.prototype.slice.call(arguments, 1);
		for (var j = 0, len = sources.length, src; j < len; j++) {
			src = sources[j] || {};
			for (var i in src) {
				if (src.hasOwnProperty(i)) {
					dest[i] = src[i];
				}
			}
		}
		return dest;
	},
	
	setOptions: function (obj, options) {
		obj.options = VCO.Util.extend({}, obj.options, options);
	},
	
	stamp: (function () {
		var lastId = 0, key = '_vco_id';
		return function (/*Object*/ obj) {
			obj[key] = obj[key] || ++lastId;
			return obj[key];
		};
	}()),
	
	getParamString: function (obj) {
		var params = [];
		for (var i in obj) {
			if (obj.hasOwnProperty(i)) {
				params.push(i + '=' + obj[i]);
			}
		}
		return '?' + params.join('&');
	},
	
	template: function (str, data) {
		return str.replace(/\{ *([\w_]+) *\}/g, function (str, key) {
			var value = data[key];
			if (!data.hasOwnProperty(key)) {
				throw new Error('No value provided for variable ' + str);
			}
			return value;
		});
	}
};

/* **********************************************
     Begin VCO.Class.js
********************************************** */

/*	VCO.Class
	Class powers the OOP facilities of the library.
================================================== */
VCO.Class = function () {};

VCO.Class.extend = function (/*Object*/ props) /*-> Class*/ {

	// extended class with the new prototype
	var NewClass = function () {
		if (this.initialize) {
			this.initialize.apply(this, arguments);
		}
	};

	// instantiate class without calling constructor
	var F = function () {};
	F.prototype = this.prototype;
	var proto = new F();

	proto.constructor = NewClass;
	NewClass.prototype = proto;

	// add superclass access
	NewClass.superclass = this.prototype;

	// add class name
	//proto.className = props;

	//inherit parent's statics
	for (var i in this) {
		if (this.hasOwnProperty(i) && i !== 'prototype' && i !== 'superclass') {
			NewClass[i] = this[i];
		}
	}

	// mix static properties into the class
	if (props.statics) {
		VCO.Util.extend(NewClass, props.statics);
		delete props.statics;
	}

	// mix includes into the prototype
	if (props.includes) {
		VCO.Util.extend.apply(null, [proto].concat(props.includes));
		delete props.includes;
	}

	// merge options
	if (props.options && proto.options) {
		props.options = VCO.Util.extend({}, proto.options, props.options);
	}

	// mix given properties into the prototype
	VCO.Util.extend(proto, props);

	// allow inheriting further
	NewClass.extend = VCO.Class.extend;

	// method for adding properties to prototype
	NewClass.include = function (props) {
		VCO.Util.extend(this.prototype, props);
	};

	return NewClass;
};


/* **********************************************
     Begin VCO.Events.js
********************************************** */

/*	VCO.Events
	adds custom events functionality to VCO classes
================================================== */
VCO.Events = {
	addEventListener: function (/*String*/ type, /*Function*/ fn, /*(optional) Object*/ context) {
		var events = this._vco_events = this._vco_events || {};
		events[type] = events[type] || [];
		events[type].push({
			action: fn,
			context: context || this
		});
		return this;
	},

	hasEventListeners: function (/*String*/ type) /*-> Boolean*/ {
		var k = '_vco_events';
		return (k in this) && (type in this[k]) && (this[k][type].length > 0);
	},

	removeEventListener: function (/*String*/ type, /*Function*/ fn, /*(optional) Object*/ context) {
		if (!this.hasEventListeners(type)) {
			return this;
		}

		for (var i = 0, events = this._vco_events, len = events[type].length; i < len; i++) {
			if (
				(events[type][i].action === fn) &&
				(!context || (events[type][i].context === context))
			) {
				events[type].splice(i, 1);
				return this;
			}
		}
		return this;
	},

	fireEvent: function (/*String*/ type, /*(optional) Object*/ data) {
		if (!this.hasEventListeners(type)) {
			return this;
		}

		var event = VCO.Extend({
			type: type,
			target: this
		}, data);

		var listeners = this._vco_events[type].slice();

		for (var i = 0, len = listeners.length; i < len; i++) {
			listeners[i].action.call(listeners[i].context || this, event);
		}

		return this;
	}
};

VCO.Events.on	= VCO.Events.addEventListener;
VCO.Events.off	= VCO.Events.removeEventListener;
VCO.Events.fire = VCO.Events.fireEvent;

/* **********************************************
     Begin VCO.Dom.js
********************************************** */

/*	VCO.Dom
	Utilities for working with the DOM
	Library abstraction for jQuery
================================================== */



VCO.Dom = {
	
	
	initialize: function () {
		if( typeof( jQuery ) != 'undefined' ){
			this.type.jQuery = true;
		} else {
			this.type.jQuery = false;
		}
	},
	
	get: function (id) {
		return (typeof id === 'string' ? document.getElementById(id) : id);
	},
	
	create: function (tagName, className, container) {
		var el = document.createElement(tagName);
		el.className = className;
		if (container) {
			container.appendChild(el);
		}
		return el;
	}
	
};

/* **********************************************
     Begin VCO.Media.js
********************************************** */

VCO.Media = VCO.Class.extend({
	
	includes: [VCO.Events],
	_container: {},
	
	options: {
		stroke: true,
		color: '#0033ff',
		weight: 5,
		opacity: 0.5,

		fill: false,
		fillColor: null, //same as color by default
		fillOpacity: 0.2
	},

	initialize: function (id, options) {
		VCO.Util.setOptions(this, options);
		this._container = VCO.Dom.get(id);
		this._initLayout();
	},

	onAdd: function (map) {
		
	},

	onRemove: function (map) {
		
	},

	_initLayout: function () {
		trace(" _initLayout");
		
		var container = this._container;
		container.className += ' vco-media';
		
		
	}
	
});

/* **********************************************
     Begin VCO.Slide.js
********************************************** */

VCO.Slide = VCO.Class.extend({
	
	includes: [VCO.Events],
	_container: {},
	_content_container: {},
	_content: {},
	
	options: {
		stroke: true,
		color: '#0033ff',
		weight: 5,
		opacity: 0.5,

		fill: false,
		fillColor: null, //same as color by default
		fillOpacity: 0.2
	},

	initialize: function (id, options) {
		VCO.Util.setOptions(this, options);
		this._container = VCO.Dom.get(id);
		this._initLayout();
	},

	onAdd: function (map) {
		
	},

	onRemove: function (map) {
		
	},

	_initLayout: function () {
		trace(" _initLayout");
		
		var container = this._container;
		container.className += ' vco-slide';
		div.vco-content-container
			div.vco-content
		// Create Layout
		this._content_container		= VCO.Dom.create('div', 'vco-content-container', this._container);
		this._content		= VCO.Dom.create('div', 'vco-content', this._content_container);
		
	}
	
});


/* **********************************************
     Begin VCO.StorySlider.js
********************************************** */

/**
	* StorySlider
	* Designed and built by Zach Wise at VéritéCo

	* This Source Code Form is subject to the terms of the Mozilla Public
	* License, v. 2.0. If a copy of the MPL was not distributed with this
	* file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/ 

/*	* CodeKit Import
	* http://incident57.com/codekit/
================================================== */
// @codekit-prepend "core/VCO.js";
// @codekit-prepend "core/VCO.Util.js";
// @codekit-prepend "core/VCO.Class.js";
// @codekit-prepend "core/VCO.Events.js";
// @codekit-prepend "dom/VCO.Dom.js";
// @codekit-prepend "media/VCO.Media.js";
// @codekit-prepend "slider/VCO.Slide.js";



/*	VCO.StorySlider
	is the central class of the API - it is used to create a StorySlider
================================================== */
VCO.StorySlider = VCO.Class.extend({
	
	_container: {},
	_slider_container_mask: {},
	_slider_container: {},
	_slider_item_container: {},
	
	includes: VCO.Events,
	
	options: {
		// projection
		scale: function (zoom) {
			return 256 * Math.pow(2, zoom);
		},

		// state
		center: null,
		zoom: null,
		layers: [],

		// interaction
		dragging: true
	},
	
	// Constructer
	initialize: function (id, options) { // (HTMLElement or String, Object)
		trace("StorySlider Initialized");
		
		VCO.Util.setOptions(this, options);
		this._container = VCO.Dom.get(id);
		this._initLayout();


		if (this.options.maxBounds) {
			this.setMaxBounds(this.options.maxBounds);
		}

		var center = this.options.center,
			zoom = this.options.zoom;
	},
	
	// Private Methods
	
	_initLayout: function () {
		trace(" _initLayout");
		
		var container = this._container;
		container.className += ' vco-storyslider';
		
		// Create Layout
		this._slider_container_mask		= VCO.Dom.create('div', 'vco-slider-container-mask', this._container);
		this._slider_container			= VCO.Dom.create('div', 'vco-slider-container', this._slider_container_mask);
		this._slider_item_container		= VCO.Dom.create('div', 'vco-slider-item-container', this._slider_container);
		
		/*
		div.vco-storyslider
			div.vco-slider-container-mask
				div.vco-slider-container
					div.vco-slider-item-container
		*/
		
		
	}
	
});

