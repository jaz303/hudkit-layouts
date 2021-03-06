(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
window.hkinit = function() {
	window.hudkit = require('hudkit');

	hudkit.init();
	window.hk = hudkit.instance(window);

	window.hl = require('../');	
}

},{"../":2,"hudkit":3}],2:[function(require,module,exports){
function maybeNumber(value, defaultValue) {
    return (typeof value === 'undefined') ? defaultValue : parseFloat(value, 10);
}

function box(hk) {
    var box = hk.box();
    box.setBackgroundColor('#404040');
    return box;
}

function isWidget(object) {
    return (typeof object === 'object') && (typeof object.getRoot === 'function');
}

function create(hk, thing) {
    if (typeof thing === 'string') {
        return hk[thing]();
    } else if (typeof thing === 'function') {
        return thing(hk);
    } else if (isWidget(thing)) {
        return thing;
    } else {
        throw new Error("can't create widget; I don't know what to do with this: " + thing);
    }
}

function s2(hk, orientation, options) {

    options = options || {};

    var split = hk.splitPane();
    split.setOrientation(orientation);
    split.setSplit('split' in options ? options.split : 0.5);

    var layout = {};

    function makeWidget(widget, defaultId) {

        var id = defaultId;

        if (!widget) {
            widget = box;
        }

        if (typeof widget === 'object' && !isWidget(widget)) {
            if (widget.id) id = widget.id;
            widget = create(hk, widget.widget);
        } else {
            widget = create(hk, widget);
        }

        layout[id] = widget;

        return widget;
        
    }

    if (orientation === hk.k.SPLIT_PANE_VERTICAL) {
        split.setLeftWidget(makeWidget(options.left, 'left'));
        split.setRightWidget(makeWidget(options.right, 'right'));
    } else {
        split.setTopWidget(makeWidget(options.top, 'top'));
        split.setBottomWidget(makeWidget(options.bottom, 'bottom'));
    }

    layout.split = split;

    hk.root.setRootWidget(layout.split);

    return layout;

}

// vertical split with two panes
exports.v2 = function(hk, options) {
    return s2(hk, hk.k.SPLIT_PANE_VERTICAL, options);
}

// horizontal split with two panes
exports.h2 = function(hk, options) {
    return s2(hk, hk.k.SPLIT_PANE_HORIZONTAL, options);
}

// horizontal split, canvas at top, console at bottom
exports.canvasAndConsole = function(hk, options) {

    options = options || {};

    var layout = exports.h2(hk, {
        top     : {widget: 'canvas2D', id: 'canvas'},
        bottom  : {widget: 'console', id: 'console'},
        split   : maybeNumber(options.split, 0.7)
    });
    
    return layout;

}

// horizontal split, canvas at top, tab bar at bottom.
// tabs can be passed via options.tabs
exports.canvasAndTabs = function(hk, options) {
    
    options = options || {};

    var layout = exports.h2(hk, {
        top     : {widget: 'canvas2D', id: 'canvas'},
        bottom  : {widget: 'tabPane', id: 'tabPane'},
        split   : maybeNumber(options.split, 0.7)
    });

    layout.tabs = [];

    (options.tabs || []).forEach(function(tab, ix) {

        var widget  = null,
            title   = 'Tab ' + ix,
            id      = null;

        if (typeof tab === 'object' && !isWidget(tab)) {
            var widget = create(hk, tab.widget);
            if ('title' in tab) title = tab.title;
            if ('id' in tab)    id = tab.id;
        } else {
            var widget = create(hk, tab);
        }

        layout.tabPane.addTab(title, widget);
        layout.tabs.push(widget);
        
        if (id)
            layout[id] = widget;

    });

    return layout;

}

},{}],3:[function(require,module,exports){
module.exports = require('./lib/core');

require('./lib/Widget');
require('./lib/InlineWidget');
require('./lib/BlockWidget');
require('./lib/RootPane');
require('./lib/Box');
require('./lib/SplitPane');
require('./lib/MultiSplitPane');
require('./lib/Console');
require('./lib/Canvas2D');
require('./lib/Container');
require('./lib/Panel');
require('./lib/Button');
require('./lib/ButtonBar');
require('./lib/TabPane');
require('./lib/Toolbar');
require('./lib/StatusBar');
require('./lib/TreeView');
require('./lib/Knob');
require('./lib/Select');
require('./lib/HorizontalSlider');
require('./lib/PropertyEditor');
require('./lib/Checkbox');
require('./lib/TextField');
},{"./lib/BlockWidget":4,"./lib/Box":5,"./lib/Button":6,"./lib/ButtonBar":7,"./lib/Canvas2D":8,"./lib/Checkbox":9,"./lib/Console":10,"./lib/Container":11,"./lib/HorizontalSlider":12,"./lib/InlineWidget":13,"./lib/Knob":15,"./lib/MultiSplitPane":16,"./lib/Panel":17,"./lib/PropertyEditor":18,"./lib/RootPane":19,"./lib/Select":20,"./lib/SplitPane":21,"./lib/StatusBar":22,"./lib/TabPane":23,"./lib/TextField":24,"./lib/Toolbar":25,"./lib/TreeView":26,"./lib/Widget":27,"./lib/core":29}],4:[function(require,module,exports){
var ctx		= require('../core'),
	theme 	= require('../theme'),
	k		= require('../constants'),
	Widget 	= require('../Widget'),
	du 		= require('domutil');

var BlockWidget = module.exports = Widget.extend(function(_sc, _sm) {

	return [

		function(hk, rect) {
			
			_sc.call(this, hk);
			
			du.addClass(this._root, 'hk-block-widget');

			if (rect) {
			    this.setBounds(rect.x, rect.y, rect.width, rect.height, true);
			} else {
			    var size = this._defaultSize();
			    this.setBounds(0, 0, size.width, size.height);
			}

		},

		'methods', {

			setRect: function(rect) {
			    return this.setBounds(rect.x, rect.y, rect.width, rect.height);
			},

			/**
			 * Set the position and size of this widget
			 * Of all the public methods for manipulating a widget's size, setBounds()
			 * is the one that does the actual work. If you need to override resizing
			 * behaviour in a subclass (e.g. see hk.RootPane), this is the only method
			 * you need to override.
			 */
			setBounds: function(x, y, width, height) {
			    this._setBounds(x, y, width, height);
			    this._applyBounds();
			},

			_setBounds: function(x, y, width, height) {
			    this.x = x;
			    this.y = y;
			    this.width = width;
			    this.height = height;
			},

			_applyBounds: function() {
			    this._applyPosition();
			    this._applySize();
			},

			_applyPosition: function() {
			    this._root.style.left = this.x + 'px';
			    this._root.style.top = this.y + 'px';
			},

			_applySize: function() {
			    this._root.style.width = this.width + 'px';
			    this._root.style.height = this.height + 'px';
			},

			_defaultSize: function() {
                return {width: 100, height: 100};
            }

		}

	]

});

ctx.registerCSS(".hk-block-widget {\n\tdisplay: block;\n\tposition: absolute;\n\twidth: auto;\n\theight: auto;\n}");
ctx.registerWidget('BlockWidget', BlockWidget);
},{"../Widget":27,"../constants":28,"../core":29,"../theme":31,"domutil":35}],5:[function(require,module,exports){
var ctx         = require('../core'),
    theme       = require('../theme'),
    k           = require('../constants'),
    BlockWidget = require('../BlockWidget');

var Box = module.exports = BlockWidget.extend(function(_sc, _sm) {

    return [

        function(hk, rect, color) {
            if (typeof rect === 'string') {
                color = rect;
                rect = null;
            }
            _sc.call(this, hk, rect);
            this.setBackgroundColor(color || 'white');
        },

        'methods', {
            
            setBackgroundColor: function(color) {
                this._root.style.backgroundColor = color;
            },

            _buildStructure: function() {
                this._root = this.document.createElement('div');
                this._root.className = 'hk-box';
            }

        }

    ];

});

ctx.registerWidget('Box', Box);
},{"../BlockWidget":4,"../constants":28,"../core":29,"../theme":31}],6:[function(require,module,exports){
var ctx             = require('../core'),
    theme           = require('../theme'),
    k               = require('../constants'),
    InlineWidget    = require('../InlineWidget'),
    du              = require('domutil');

ctx.registerWidget('Button', module.exports = InlineWidget.extend(function(_sc, _sm) {

    return [

        function(hk, type) {
            
            _sc.call(this, hk);

            this._addSignal('onAction');

            this._enabled = true;
            this._title = "";

            this._buttonType = type || 'rounded';
            this._buttonClass = '';

            this._baseClass = this._root.className;
            this._updateClass();

        },

        'methods', {

            dispose: function() {
                this.setAction(null);
                _sm.dispose.call(this);
            },

            //
            // Action

            bindAction: function(action) {

                var self = this;

                function sync() {
                    self.setTitle(action.getTitle());
                    self.setEnabled(action.isEnabled());
                }

                var unbindAction    = this.onAction.connect(action),
                    unbindSync      = action.onchange.connect(sync);

                sync();

                return function() {
                    unbindAction();
                    unbindSync();
                }

            },

            //
            // Enabled

            isEnabled: function() {
                return this._enabled;
            },

            setEnabled: function(enabled) {
                enabled = !!enabled;
                if (enabled !== this._enabled) {
                    this._enabled = enabled;
                    if (this._enabled) {
                        du.removeClass(this._root, 'disabled');
                    } else {
                        du.addClass(this._root, 'disabled');
                    }
                }
            },

            //
            // Title

            getTitle: function() {
                return this._title;
            },

            setTitle: function(title) {
                title = '' + title;
                if (title !== this._title) {
                    this._title = this._text.textContent = title;
                }
            },

            //
            // Type

            getButtonType: function() {
                return this._buttonType;
            },

            setButtonType: function(type) {
                this._buttonType = type;
                this._updateClass();
            },

            //
            // Class

            getButtonClass: function() {
                return this._buttonClass;
            },

            setButtonClass: function() {
                this._buttonClass = className || '';
                this._updateClass();
            },

            //
            //
            
            _buildStructure: function() {

                var self = this;
                
                this._root = this.document.createElement('a');
                this._root.href = '#';
                
                this._text = this.document.createElement('span');
                this._root.appendChild(this._text);

                this._root.addEventListener('click', function(evt) {
                    
                    evt.preventDefault();
                    evt.stopPropagation();

                    if (self._enabled) {
                        self.onAction.emit(self);
                    }
                
                });

            },

            _updateClass: function() {

                var className = this._baseClass + ' hk-button-common';
                className += ' hk-' + this._buttonType + '-button';
                className += ' ' + this._buttonClass;

                if (!this._enabled) {
                    className += ' disabled';
                }

                this._root.className = className;

            },

            _applySizeHints: function() {
                this._applyHintedProperty(this._root, 'width');
                this._applyHintedProperty(this._root, 'height');
            }
        
        }

    ];

}));

ctx.registerCSS(".hk-button-common {\n\t\n\tfont-family: $HK_CONTROL_FONT;\n\tfont-size: 11px;\n\tline-height: 1;\n\tbackground: $HK_BUTTON_BG_COLOR;\n\tcolor: $HK_TEXT_COLOR;\n\ttext-align: center;\n\n\theight: 18px;\n\n}\n\n.hk-button-common > span {\n\tdisplay: block;\n\t\n\t/* vertically align label inside button */\n\tposition: relative;\n\ttop: 50%;\n\ttransform: translateY(-50%);\n    -webkit-transform: translateY(-50%);\n}\n\n.hk-button-common.disabled {\n\tcolor: #d0d0d0;\n}\n\n.hk-button-common:not(.disabled):active {\n\tbackground: $HK_CONTROL_ACTIVE_BG_COLOR;\n}\n\n.hk-rounded-button {\n\tpadding: 1px 10px 2px 10px;\n\tborder-radius: 7px;\n}\n");
},{"../InlineWidget":13,"../constants":28,"../core":29,"../theme":31,"domutil":35}],7:[function(require,module,exports){
var ctx         = require('../core'),
    theme       = require('../theme'),
    k           = require('../constants'),
    BlockWidget = require('../BlockWidget');

ctx.registerWidget('ButtonBar', module.exports = BlockWidget.extend(function(_sc, _sm) {

    return [

        function() {
            _sc.apply(this, arguments);
            this._buttons = [];
        },

        'methods', {
            addButton: function(button) {
                
                button.setButtonType('button-bar');
                
                this._attachChildViaElement(button, this._root);
                this._buttons.push(button);

                return this;
            
            },
            
            _buildStructure: function() {
                this._root = this.document.createElement('div');
                this._root.className = 'hk-button-bar';
            }
        }

    ];

}));

ctx.registerCSS(".hk-button-bar {\n    \n}\n\n.hk-button-bar-button {\n    display: block;\n    width: 20px;\n    height: 20px;\n    border-radius: 10px;\n    margin: 0 4px 4px 0;\n}\n\n.hk-button-bar-button span {\n    display: none;\n}\n");
},{"../BlockWidget":4,"../constants":28,"../core":29,"../theme":31}],8:[function(require,module,exports){
var ctx         = require('../core'),
    theme       = require('../theme'),
    k           = require('../constants'),
    BlockWidget = require('../BlockWidget');

ctx.registerWidget('Canvas2D', module.exports = BlockWidget.extend(function(_sc, _sm) {

    return [

        function() {
            _sc.apply(this, arguments);
        },

        'methods', {
            getContext: function() {
                return this._context;
            },
            
            getCanvas: function() {
                return this._root;
            },

            _applySize: function() {
                this._root.width = this.width;
                this._root.height = this.height;
            },
            
            _buildStructure: function() {
                this._root = this.document.createElement('canvas');
                this._root.setAttribute('tabindex', 0);
                this._root.className = 'hk-canvas hk-canvas-2d';
                this._context = this._root.getContext('2d');
            }
        }

    ];

}));

ctx.registerCSS(".hk-canvas-2d {\n    background-color: #121212;\n    border-radius: $HK_BLOCK_BORDER_RADIUS;\n}\n\n.hk-canvas-2d:focus {\n\toutline: none;\n}\n");
},{"../BlockWidget":4,"../constants":28,"../core":29,"../theme":31}],9:[function(require,module,exports){
var ctx             = require('../core'),
    theme           = require('../theme'),
    k               = require('../constants'),
    InlineWidget    = require('../InlineWidget'),
    du              = require('domutil');

var CHECKBOX_SIZE = 12;

ctx.registerWidget('Checkbox', module.exports = InlineWidget.extend(function(_sc, _sm) {

    return [

        function(hk) {
            _sc.call(this, hk);
            this._addSignal('onChange');
            this._value = false;
        },

        'mixins', ['ValueWidget'],

        'methods', {

            dispose: function() {
                _sm.dispose.call(this);
            },

            _setValue: function(v) {
                v = !!v;
                if (v !== this._value) {
                    this._value = v;
                    this._root.checked = v;
                    return true;
                } else {
                    return false;
                }
            },
            
            _buildStructure: function() {
                
                this._root = this.document.createElement('input');
                this._root.type = 'checkbox'
                this._root.className = 'hk-check-box';
                
                var self = this;
                this._root.addEventListener('change', function(evt) {
                    self._value = self._root.checked;
                    self._broadcastChange();
                });

            }
        
        }

    ];

}));

function drawblob(doc, width, height, cb) {
    var canvas = doc.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    var ctx = canvas.getContext('2d');
    cb(ctx);
    return canvas.toDataURL();
}

ctx.registerInitializer(function(instance) {

    var unchecked = drawblob(instance.document, CHECKBOX_SIZE, CHECKBOX_SIZE, function(ctx) {
        ctx.fillStyle = instance.theme.get('HK_BUTTON_BG_COLOR');
        ctx.fillRect(0, 0, CHECKBOX_SIZE, CHECKBOX_SIZE);
        ctx.strokeStyle = instance.theme.get('HK_TOOLBAR_ITEM_BORDER_COLOR');
        ctx.strokeRect(0, 0, CHECKBOX_SIZE, CHECKBOX_SIZE);
    });

    var checked = drawblob(instance.document, CHECKBOX_SIZE, CHECKBOX_SIZE, function(ctx) {
        ctx.fillStyle = instance.theme.get('HK_BUTTON_BG_COLOR');
        ctx.fillRect(0, 0, CHECKBOX_SIZE, CHECKBOX_SIZE);
        ctx.strokeStyle = instance.theme.get('HK_TOOLBAR_ITEM_BORDER_COLOR');
        ctx.strokeRect(0, 0, CHECKBOX_SIZE, CHECKBOX_SIZE);
        ctx.fillStyle = instance.theme.get('HK_CONTROL_ACTIVE_BG_COLOR');
        ctx.fillRect(2, 2, CHECKBOX_SIZE - 4, CHECKBOX_SIZE - 4);
    });

    var style = [
        ".hk-check-box {",
        "  font-size: " + (CHECKBOX_SIZE) + "px;",
        "  width: " + (CHECKBOX_SIZE) + "px;",
        "  height: " + (CHECKBOX_SIZE) + "px;",
        "  margin: 0;",
        "  padding: 0;",
        "  -webkit-appearance: none;",
        "  background: url(\"" + unchecked + "\") no-repeat center center;",
        "}",
        ".hk-check-box:focus {",
        "  outline: none;",
        "}",
        ".hk-check-box:checked {",
        "  background-image: url(\"" + checked + "\");",
        "}"
    ].join("\n");

    instance.appendCSS(style);

});
},{"../InlineWidget":13,"../constants":28,"../core":29,"../theme":31,"domutil":35}],10:[function(require,module,exports){
var ctx         = require('../core'),
    theme       = require('../theme'),
    k           = require('../constants'),
    BlockWidget = require('../BlockWidget'),
    du 			= require('domutil');

var DEFAULT_PROMPT = {text: '>'},
    HISTORY_LENGTH = 500;

ctx.registerWidget('Console', module.exports = BlockWidget.extend(function(_sc, _sm) {

	return [

	    function() {

	        _sc.apply(this, arguments);

	        this._formatter = null;
	        
	        this._history = [];
	        this._historyIx = null;
	        
	        this.echoOn();
	        this.notReady();

	    },

	    'methods', {
	        print: function(text, className) { this._appendOutputText(text, className); },
	        printError: function(text) { this._appendOutputText(text, 'error'); },
	        printSuccess: function(text) { this._appendOutputText(text, 'success'); },
	        
	        printHTML: function(html) {
	            var ele = this.document.createElement('div');
	            if (du.isElement(html)) {
	                ele.appendChild(html);
	            } else {
	                ele.innerHTML = html;
	            }
	            this._appendOutputElement(ele);
	        },
	        
	        printObject: function(obj) {
	            var formatted = this._formatter(obj);
	            if (formatted !== false)
	                this.printHTML(formatted);
	        },
	        
	        setObjectFormatter: function(formatter) {
	        	this._formatter = formatter;
	       	},
	        
	        /**
	         * Set the evaluator function.
	         * The evaluator function will be passed 2 arguments - the command to be
	         * evaluated, and the terminal object.
	         *
	         * @param evaluator
	         */
	        setEvaluator: function(evaluator) {
	        	this._evaluator = evaluator;
	        },
	        
	        /**
	         * Prompt can either be:
	         * a string representing the prompt text
	         * an object with any/all of the keys: text, color, className
	         * a function returning any of the above
	         *
	         * @param prompt
	         */
	        setPrompt: function(prompt) {
	            if (typeof prompt == 'string')
	                prompt = {text: prompt};
	                
	            this._userPrompt = prompt;
	        },
	        
	        echoOn: function() {
	        	this.setEcho(true);
	        },
	        
	        echoOff: function() {
	        	this.setEcho(false);
	        },
	        
	        setEcho: function(echo) {
	        	this._echo = !!echo;
	        },
	        
	        // terminal is not ready for input; command line is hidden.
	        notReady: function() {
	        	this._input.style.display = 'none';
	        },
	        
	        // terminal is ready for input; command line is shown.
	        ready: function() {
	        	this._input.style.display = '-webkit-box';
	        },
	        
	        /**
	         * Clear's the user's current command.
	         * Also cancels any active history navigation.
	         */
	        clearCommand: function() {
	            this._command.value = '';
	            this._historyIx = null;
	        },
	        
	        // prepare for a new command - clear current input, generate
	        // a new prompt and scroll to the bottom. set `makeReady` to
	        // true to make the terminal ready at the same time.
	        newCommand: function(makeReady) {
	            if (makeReady) {
	                this.ready();
	            }
	            
	            var prompt = this._optionsForNewPrompt();
	            this._prompt.innerText = prompt.text;
	            
	            if ('color' in prompt) {
	                this._prompt.style.color = prompt.color;
	            } else {
	                this._prompt.style.color = '';
	            }
	            
	            if ('className' in prompt) {
	                this._prompt.className = 'prompt ' + prompt.className;
	            } else {
	                this._prompt.className = 'prompt';
	            }
	            
	            this.clearCommand();
	            this._scrollToBottom();
	        },
	        
	        //
	        // Private API
	        
	        _appendOutputText: function(text, className) {

	            text = ('' + text);

	            // TODO: text should be appended using a <pre> so we don't need to do
	            // any of this replacement crap
	            var ele = this.document.createElement('div');
	            ele.className = 'text-line ' + (className || '');
	            ele.innerHTML = text.replace(/\n/g, "<br/>")
	                                .replace(/ /g,  "&nbsp;");
	            
	            this._appendOutputElement(ele);
	        
	        },
	        
	        _appendOutputElement: function(ele) {
	            ele.className += ' output-item';
	            this._output.appendChild(ele);
	            this._scrollToBottom();
	        },
	        
	        _getCommand: function() {
	            return this._command.value;
	        },
	        
	        _scrollToBottom: function() {
	            this._root.scrollTop = this._root.scrollHeight;
	        },
	        
	        _optionsForNewPrompt: function() {
	            var prompt = (typeof this._userPrompt == 'function') ? this._userPrompt() : this._userPrompt;
	            return prompt || DEFAULT_PROMPT;
	        },
	        
	        _bell: function() {
	            console.log("bell!");
	        },
	        
	        _handlePaste: function(e) {
	            var pastedText = undefined;
	            if (e.clipboardData && e.clipboardData.getData) {
	                pastedText = e.clipboardData.getData('text/plain');
	            }
	            if (pastedText !== undefined) {
	                console.log(pastedText);
	            }
	        },
	        
	        _handleEnter: function() {
	            if (this._echo) {
	                this._echoCurrentCommand();
	            }
	            var command = this._getCommand();
	            if (this._evaluator) {
	                this.clearCommand();
	                if (this._history.length == 0 || command != this._history[this._history.length - 1]) {
	                    this._history.push(command);
	                }
	                this._evaluator(command, this);
	            } else {
	                this.newCommand();
	            }
	        },
	        
	        _handleClear: function() {
	            this.clearCommand();
	        },
	        
	        _handleHistoryNav: function(dir) {
	            
	            if (this._history.length == 0) {
	                return;
	            }
	            
	            var cmd = null;
	            
	            if (dir == 'prev') {
	                if (this._historyIx === null) {
	                    this._historyStash = this._command.value || '';
	                    this._historyIx = this._history.length - 1;
	                } else {
	                    this._historyIx--;
	                    if (this._historyIx < 0) {
	                        this._historyIx = 0;
	                    }
	                }
	            } else {
	                if (this._historyIx === null) {
	                    return;
	                }
	                this._historyIx++;
	                if (this._historyIx == this._history.length) {
	                    cmd = this._historyStash;
	                    this._historyIx = null;
	                }
	            }
	            
	            if (cmd === null) {
	                cmd = this._history[this._historyIx];
	            }
	            
	            this._command.value = cmd;
	            
	        },
	        
	        _handleAutocomplete: function() {
	            console.log("AUTO-COMPLETE");
	        },
	        
	        _echoCurrentCommand: function() {
	            var line = this.document.createElement('div');
	            line.className = 'input-line';
	            
	            var prompt = this.document.createElement('span');
	            prompt.className = this._prompt.className;
	            prompt.style.color = this._prompt.style.color;
	            prompt.textContent = this._prompt.textContent;
	            
	            var cmd = this.document.createElement('span');
	            cmd.className = 'command';
	            cmd.textContent = this._getCommand();
	            
	            line.appendChild(prompt);
	            line.appendChild(cmd);
	            
	            this._appendOutputElement(line);
	        },
	        
	        _buildStructure: function() {
	            
	            var self = this;
	            
	            var root        = this.document.createElement('div'),
	                output      = this.document.createElement('output'),
	                line        = this.document.createElement('div'),
	                prompt      = this.document.createElement('span'),
	                cmdWrapper  = this.document.createElement('span'),
	                cmd         = this.document.createElement('input');
	                    
	            root.className        = 'hk-console';
	            line.className        = 'input-line';
	            cmdWrapper.className  = 'command-wrapper';
	            cmd.type              = 'text';
	            cmd.className         = 'command';
	            
	            cmdWrapper.appendChild(cmd);
	            line.appendChild(prompt);
	            line.appendChild(cmdWrapper);
	            root.appendChild(output);
	            root.appendChild(line);
	            
	            root.onclick = function() { cmd.focus(); }
	            cmd.onpaste = function(evt) { self._handlePaste(evt); evt.preventDefault(); };
	            cmd.onkeydown = function(evt) {
	                switch (evt.which) {
	                    case 8:  if (self._command.value.length == 0) self._bell();     break;
	                    case 13: evt.preventDefault(); self._handleEnter();             break;
	                    case 27: evt.preventDefault(); self._handleClear();             break;
	                    case 38: evt.preventDefault(); self._handleHistoryNav('prev');  break;
	                    case 40: evt.preventDefault(); self._handleHistoryNav('next');  break;
	                    case 9:  evt.preventDefault(); self._handleAutocomplete();      break;
	                }
	            };
	            
	            this._root    = root;
	            this._output  = output;
	            this._input   = line;
	            this._prompt  = prompt;
	            this._command = cmd;
	            
	        }
	    }

	];

}));

ctx.registerCSS(".hk-console {\n    padding: 5px;\n    background: #AAB2B7;\n    border-radius: $HK_BLOCK_BORDER_RADIUS;\n    overflow: auto;\n    font: $HK_CONSOLE_FONT_SIZE/1.2 $HK_MONOSPACE_FONT;\n}\n\n.hk-console output {\n    \n}\n\n.hk-console .output-item {\n    display: -webkit-box;\n    -webkit-box-orient: horizontal;\n    -webkit-box-align: stretch;\n    clear: both;\n}\n\n.hk-console .input-line {\n    \n}\n    \n.hk-console .prompt {\n    white-space: nowrap;\n    margin-right: 5px;\n    display: -webkit-box;\n    -webkit-box-back: center;\n    -webkit-box-orient: vertical;\n}\n    \n.hk-console .command-wrapper {\n    display: block;\n    -webkit-box-flex: 1;\n}\n    \n.hk-console span.command {\n    display: inline-block;\n}\n\n.hk-console input.command {\n    border: none;\n    background: none;\n    padding: 0;\n    margin: 0;\n    width: 100%;\n    font: inherit;\n    -webkit-appearance: textfield;\n    -webkit-user-select: text;\n    cursor: auto;\n    display: inline-block;\n    text-align: start;\n}\n\n.hk-console input.command:focus {\n    outline: none;\n}\n");

},{"../BlockWidget":4,"../constants":28,"../core":29,"../theme":31,"domutil":35}],11:[function(require,module,exports){
var ctx         = require('../core'),
    theme       = require('../theme'),
    k           = require('../constants'),
    BlockWidget = require('../BlockWidget');

ctx.registerWidget('Container', module.exports = BlockWidget.extend(function(_sc, _sm) {

	return [

		function() {
            
            this._layout = null;
            this._children = [];
            
            _sc.apply(this, arguments);
        
            this._container = this._getContainer();

        },

        'methods', {
            getLayout: function() {
                return this._layout;
            },

            setLayout: function(layout) {
                this._layout = layout;
                this.requestLayout();
            },

            requestLayout: function() {
                // TODO: batch this stuff asynchronously
                this.layoutImmediately();
            },

            layoutImmediately: function() {
                if (this._layout) {
                    this._layout(this, 0, 0, this.width, this.height);
                }
            },

            addChild: function(tag, widget) {

                if (typeof widget === 'undefined') {
                    widget = tag;
                    tag = null;
                }

                if (tag && this[tag])
                    throw new Error("duplicate child tag: " + tag);
                
                this._attachChildViaElement(widget, this._container);
                this._children.push(widget);

                if (tag) {
                    this[tag] = widget;
                    widget.__container_tag__ = tag;
                }

                this.requestLayout();

                return this;
            
            },

            removeChild: function(widget) {

                for (var i = 0, l = this._children.length; i < l; ++i) {
                    var ch = this._children[i];
                    if (ch === widget) {
                        
                        this._removeChildViaElement(ch, this._container);
                        this._children.splice(i, 1);

                        if ('__container_tag__' in widget) {
                            delete this[widget.__container_tag__];
                            delete widget.__container_tag__;
                        }
                        
                        this.requestLayout();

                        return true;
                    
                    }
                }

                return false;

            },

            removeChildByTag: function(tag) {

                var widget = this[tag];

                if (!widget)
                    throw new Error("no widget with tag: " + tag);

                this.removeChild(widget);

                return widget;

            },

            // Returns the element to which child widgets should be appended.
            // Default is to return the root element.
            _getContainer: function() {
                return this._root;
            },

            _applyBounds: function() {
                _sm._applyBounds.call(this);
                this.requestLayout();
            }
        }

    ]

}));
},{"../BlockWidget":4,"../constants":28,"../core":29,"../theme":31}],12:[function(require,module,exports){
var ctx             = require('../core'),
    theme           = require('../theme'),
    k               = require('../constants'),
    InlineWidget    = require('../InlineWidget'),
    du              = require('domutil'),
    rattrap         = require('rattrap');

ctx.registerWidget('HorizontalSlider', module.exports = InlineWidget.extend(function(_sc, _sm) {

    return [

        function(hk) {

            _sc.call(this, hk);

            this._minValue = 0;
            this._maxValue = 100;
            this._value = 50;
            this._caption = '';

            this._addSignal('onChange');
            
            this._bind();
            this._update();

        },

        'mixins', ['ValueWidget', 'ValueRange'],

        'methods', {

            dispose: function() {
                _sm.dispose.call(this);
            },

            getCaption: function() {
                return this._caption;
            },

            setCaption: function(c) {
                c = '' + c;
                if (c === this._caption) {
                    return;
                }
                this._caption = c;
                this._updateCaption(this._caption);
            },

            _setValue: function(v) {

                if (v < this._minValue) v = this._minValue;
                if (v > this._maxValue) v = this._maxValue;

                v = Math.floor(v);

                if (v === this._value) {
                    return false;
                }

                this._value = v;

                this._update();

                return true;

            },
            
            _buildStructure: function() {
                
                this._root = this.document.createElement('div');
                this._root.className = 'hk-horizontal-slider';
                
                this._fill = this.document.createElement('div');
                this._fill.className = 'fill';

                this._captionEl = this.document.createElement('div');
                this._captionEl.className = 'caption';

                this._root.appendChild(this._fill);
                this._root.appendChild(this._captionEl);

            },

            _bind: function() {

                var self = this;

                this._root.addEventListener('mousedown', function(evt) {

                    var rect = self._root.getBoundingClientRect();

                    function updateFromEvent(evt) {
                        
                        var offset = evt.pageX - rect.left;
                        
                        if (offset < 0) offset = 0;
                        if (offset > rect.width) offset = rect.width;

                        if (self._setValue(self._offsetToValue(rect, offset))) {
                            self._broadcastChange();
                        }
                        
                    }
                    
                    var stopCapture = rattrap.startCapture(self.document, {
                        cursor: 'col-resize',
                        mousemove: function(evt) {
                            updateFromEvent(evt);
                            self._updateCaption(self.getValue());
                        },
                        mouseup: function(evt) {
                            stopCapture();
                            updateFromEvent(evt);
                            self._updateCaption(self._caption);
                        }
                    });
                
                });

            },

            _update: function() {
                var percentage = ((this._value - this._minValue) / (this._maxValue - this._minValue)) * 100;
                this._fill.style.width = percentage + '%';
            },

            _updateCaption: function(caption) {
                this._captionEl.textContent = caption;
            },

            _offsetToValue: function(rect, offset) {
                return this._minValue + ((offset / rect.width) * (this._maxValue - this._minValue));
            },

            _applySizeHints: function() {
                this._applyHintedProperty(this._root, 'width');
                this._applyHintedProperty(this._root, 'height');
            }
        
        }

    ];

}));

ctx.registerCSS(".hk-horizontal-slider {\n\tposition: relative;\n    border: 1px solid $HK_TOOLBAR_ITEM_BORDER_COLOR;\n    background: black;\n    background-color: $HK_BUTTON_BG_COLOR;\n    width: 200px;\n    height: 18px;\n}\n\n.hk-horizontal-slider > .fill {\n\theight: 100%;\n\tdisplay: block;\n\twidth: 0;\n\tbackground-color: $HK_CONTROL_ACTIVE_BG_COLOR;\n}\n\n.hk-horizontal-slider > .caption {\n\tposition: absolute;\n\ttop: 50%;\n\tleft: 0;\n\twidth: 100%;\n\tfont-size: 11px;\n\tline-height: 1;\n\tmargin-top: -5px;\n\ttext-align: center;\n}");
},{"../InlineWidget":13,"../constants":28,"../core":29,"../theme":31,"domutil":35,"rattrap":37}],13:[function(require,module,exports){
var ctx 	= require('../core'),
	theme 	= require('../theme'),
	k		= require('../constants'),
	Widget 	= require('../Widget'),
	du 		= require('domutil');

var InlineWidget = module.exports = Widget.extend(function(_sc, _sm) {

	return [

		function(hk) {

			this._layoutSizeHints = null;
			this._userSizeHints = null;

			_sc.call(this, hk);
			du.addClass(this._root, 'hk-inline-widget');

		},

		'methods', {

			setLayoutSizeHints: function(hints) {
				this._layoutSizeHints = hints;
				this._applySizeHints();
			},

			setUserSizeHints: function(hints) {
				this._userSizeHints = hints;
				this._applySizeHints();
			},

			_applySizeHints: function() {
				// default implementation is no-op
			},

			_getHintedProperty: function(prop) {

				if (this._layoutSizeHints && (prop in this._layoutSizeHints)) {
					return this._layoutSizeHints[prop];
				}

				if (this._userSizeHints && (prop in this._userSizeHints)) {
					return this._userSizeHints[prop];
				}

				return null;

			},

			// for a given style property, apply it to el based on supplied hints.
			// layout hints take precedence over user hints, and if neither are set
			// the style property is set to the empty string (i.e. fall back to
			// whatever is specified in CSS)
			_applyHintedProperty: function(el, prop) {
				var val = this._getHintedProperty(prop);
				if (val !== null) {
					el.style[prop] = val + 'px';
				} else {
					el.style[prop] = '';
				}
			}

		}

	]

});

ctx.registerCSS(".hk-inline-widget {\n\tdisplay: inline-block;\n\twidth: auto;\n\theight: auto;\n}");
ctx.registerWidget('InlineWidget', InlineWidget);
},{"../Widget":27,"../constants":28,"../core":29,"../theme":31,"domutil":35}],14:[function(require,module,exports){
var fs 			= require('fs'),
	styleTag 	= require('style-tag'),
    registry    = require('./registry'),
    action      = require('hudkit-action'),
    constants   = require('./constants'),
    theme       = require('./theme');

module.exports  = Instance;

var RESET_CSS   = "/* http://meyerweb.com/eric/tools/css/reset/ \n   v2.0 | 20110126\n   License: none (public domain)\n*/\n\nhtml, body, div, span, applet, object, iframe,\nh1, h2, h3, h4, h5, h6, p, blockquote, pre,\na, abbr, acronym, address, big, cite, code,\ndel, dfn, em, img, ins, kbd, q, s, samp,\nsmall, strike, strong, sub, sup, tt, var,\nb, u, i, center,\ndl, dt, dd, ol, ul, li,\nfieldset, form, label, legend,\ntable, caption, tbody, tfoot, thead, tr, th, td,\narticle, aside, canvas, details, embed, \nfigure, figcaption, footer, header, hgroup, \nmenu, nav, output, ruby, section, summary,\ntime, mark, audio, video {\n\tmargin: 0;\n\tpadding: 0;\n\tborder: 0;\n\tfont-size: 100%;\n\tfont: inherit;\n\tvertical-align: baseline;\n}\n/* HTML5 display-role reset for older browsers */\narticle, aside, details, figcaption, figure, \nfooter, header, hgroup, menu, nav, section {\n\tdisplay: block;\n}\nbody {\n\tline-height: 1;\n}\nol, ul {\n\tlist-style: none;\n}\nblockquote, q {\n\tquotes: none;\n}\nblockquote:before, blockquote:after,\nq:before, q:after {\n\tcontent: '';\n\tcontent: none;\n}\ntable {\n\tborder-collapse: collapse;\n\tborder-spacing: 0;\n}",
    BASE_CSS    = ".hk-root-pane {\n\t-webkit-user-select: none;\n\tcursor: default;\n\tbackground: #101010;\n\tfont: 12px $HK_CONTROL_FONT;\n}\n\n.hk-root-pane a {\n\ttext-decoration: none;\n}\n\n.hk-root-pane * {\n\t-webkit-user-select: none;\n\tcursor: default;\n}\n";

function Instance(window) {

    this.window = window;
    this.document = window.document;
    
    this.appendCSS(RESET_CSS);
    this.appendCSS(BASE_CSS);

    registry.initializers.forEach(function(init) {
        init(this)
    }, this);

    this.root = this.rootPane();

    var body = this.document.body;
    body.className = 'hk';
    body.appendChild(this.root.getRoot());

}

Instance.prototype.action       = action;
Instance.prototype.constants    = constants;
Instance.prototype.k            = constants;
Instance.prototype.theme        = theme;

Instance.prototype.appendCSS = function(css) {

    css = css.replace(/\$(\w+)/g, function(m) {
        return theme.get(RegExp.$1);
    });

    return styleTag(this.document, css);

}

},{"./constants":28,"./registry":30,"./theme":31,"fs":41,"hudkit-action":36,"style-tag":39}],15:[function(require,module,exports){
var ctx             = require('../core'),
    theme           = require('../theme'),
    k               = require('../constants'),
    InlineWidget    = require('../InlineWidget'),
    du              = require('domutil'),
    rattrap         = require('rattrap'),
    signal          = require('signalkit');

var DEFAULT_SIZE    = 18,
    GAP_SIZE        = Math.PI / 6,
    RANGE           = (Math.PI * 2) - (2 * GAP_SIZE),
    START_ANGLE     = Math.PI / 2 + GAP_SIZE,
    END_ANGLE       = Math.PI / 2 - GAP_SIZE;

ctx.registerWidget('Knob', module.exports = InlineWidget.extend(function(_sc, _sm) {

    return [

        function(hk) {

            this._size = DEFAULT_SIZE;

            _sc.call(this, hk);

            this._minValue = 0;
            this._maxValue = 100;
            this._dragDirection = k.HORIZONTAL;
            this._value = 0;
            this._ctx = this._root.getContext('2d');

            this._addSignal('onChange');
            
            this._bind();
            this._update();

        },

        'mixins', ['ValueWidget', 'ValueRange'],

        'methods', {

            dispose: function() {
                _sm.dispose.call(this);
            },

            _setValue: function(v) {

                if (v < this._minValue) v = this._minValue;
                if (v > this._maxValue) v = this._maxValue;

                if (v === this._value) {
                    return false;
                }

                this._value = v;

                this._update();

                return true;

            },
            
            _buildStructure: function() {
                
                this._root = this.document.createElement('canvas');
                this._root.width = this._size;
                this._root.height = this._size;
                this._root.className = 'hk-knob';

            },

            _bind: function() {

                var self = this;

                this._root.addEventListener('mousedown', function(evt) {

                    var startX      = evt.pageX,
                        startY      = evt.pageY;
                        startV      = self.getValue(),
                        horizontal  = (self._dragDirection === k.HORIZONTAL);

                    var stopCapture = rattrap.startCapture(self.document, {
                        cursor: horizontal ? 'col-resize' : 'row-resize',
                        mousemove: function(evt) {

                            var delta;
                            if (horizontal) {
                                delta = evt.pageX - startX;
                            } else {
                                delta = startY - evt.pageY;
                            }
                            
                            if (self._setValue(startV + delta)) {
                                self._broadcastChange();
                            }

                        },
                        mouseup: function(evt) {
                            stopCapture();
                        }
                    });
                
                });

            },

            _update: function() {

                var ctx         = this._ctx,
                    filledRatio = (this._value - this._minValue) / (this._maxValue - this._minValue),
                    fillAngle   = START_ANGLE + (filledRatio * RANGE),
                    cx          = this._size / 2,
                    cy          = this._size / 2;
                    radius      = Math.min(cx, cy) - 3;
                
                ctx.clearRect(0, 0, this._size, this._size);
                ctx.lineWidth = 2;
                
                ctx.strokeStyle = '#EF701E';
                ctx.beginPath();
                ctx.arc(cx, cy, radius, START_ANGLE, fillAngle, false);
                ctx.stroke();
                
                ctx.strokeStyle = '#1D222F';
                ctx.beginPath();
                ctx.arc(cx, cy, radius, END_ANGLE, fillAngle, true);
                ctx.lineTo(cx, cy);
                ctx.stroke();

            },

            _applySizeHints: function() {

                var requestedWidth = this._getHintedProperty('width'),
                    requestedHeight = this._getHintedProperty('height');

                if (requestedWidth === null && requestedHeight === null) {
                    this._size = DEFAULT_SIZE;
                } else if (requestedWidth === null) {
                    this._size = requestedHeight;
                } else if (requestedHeight === null) {
                    this._size = requestedWidth;
                } else {
                    this._size = Math.min(requestedWidth, requestedHeight);
                }

                this._root.width = this._size;
                this._root.height = this._size;

                this._update();

            }
        
        }

    ];

}));

ctx.registerCSS(".hk-knob {\n    background-color: $HK_BUTTON_BG_COLOR;\n    border: 1px solid $HK_TOOLBAR_ITEM_BORDER_COLOR;\n}");
},{"../InlineWidget":13,"../constants":28,"../core":29,"../theme":31,"domutil":35,"rattrap":37,"signalkit":38}],16:[function(require,module,exports){
var ctx             = require('../core'),
    theme           = require('../theme'),
    k               = require('../constants'),
    BlockWidget     = require('../BlockWidget'),
    du              = require('domutil'),
    rattrap         = require('rattrap'),
    signal          = require('signalkit');

var DIVIDER_SIZE = theme.getInt('HK_SPLIT_PANE_DIVIDER_SIZE');

ctx.registerWidget('MultiSplitPane', module.exports = BlockWidget.extend(function(_sc, _sm) {

    return [

        function() {

            this._orientation   = k.SPLIT_PANE_HORIZONTAL;
            this._widgets       = [null];
            this._splits        = [];

            this.onPaneResize   = signal('onPaneResize');
            
            _sc.apply(this, arguments);

            this._bind();

        },

        'methods', {

            dispose: function() {
                this._widgets.forEach(function(w) {
                    if (w) {
                        self._removeChildViaElement(w, this._root);
                    }
                }, this);
                _sm.dispose.call(this);
            },
            
            setOrientation: function(orientation) {
                
                this._orientation = orientation;
                
                du.removeClass(this._root, 'horizontal vertical');
                du.addClass(this._root, this._orientation === k.SPLIT_PANE_HORIZONTAL ? 'horizontal' : 'vertical');
                
                this._layout();
            
            },
            
            setBounds: function(x, y, w, h) {
                _sm.setBounds.call(this, x, y, w, h);
                this._layout();
            },

            setPaneSizes: function(sizes) {

                var requested = 0,
                    fill = 0;

                if (sizes.length !== this._widgets.length) {
                    throw new Error("length of size array must equal number of widgets in split pane");
                }

                for (var i = 0; i < sizes.length; ++i) {
                    if (sizes[i] === null) {
                        fill++;
                    } else {
                        requested += sizes[i];
                    }
                }

                var availableWidth = this.width - (this._splits.length * DIVIDER_SIZE),
                    remainingWidth = availableWidth - requested;

                // wimp out if we can't fill exactly.
                // TODO: should probably try a best-effort thing
                if (fill === 0 && remainingWidth !== 0) {
                    return;
                } else if (fill > 0 && remainingWidth <= 0) {
                    return;
                }

                var last = 0;
                for (var i = 0; i < sizes.length - 1; ++i) {
                    var s = (sizes[i] === null) ? (remainingWidth / fill) : sizes[i],
                        r = last + (s / availableWidth)
                    this._splits[i].ratio = r;
                    last = r;
                }

                this._layout();

            },

            addSplit: function(ratio, widget) {

                if (ratio < 0 || ratio > 1) {
                    throw new Error("ratio must be between 0 and 1");
                }

                var div = this.document.createElement('div');
                div.className = 'hk-split-pane-divider';
                this._root.appendChild(div);

                var newSplit = {divider: div, ratio: ratio};
                var addedIx = -1;

                for (var i = 0; i < this._splits.length; ++i) {
                    var split = this._splits[i];
                    if (ratio < split.ratio) {
                        this._widgets.splice(i, 0, null);
                        this._splits.splice(i, 0, newSplit);
                        addedIx = i;
                        break;
                    }
                }

                if (addedIx == -1) {
                    this._widgets.push(null);
                    this._splits.push(newSplit);
                    addedIx = this._widgets.length - 1;
                }

                if (widget) {
                    this.setWidgetAtIndex(addedIx, widget);
                }

                this._layout();

            },

            removeWidgetAtIndex: function(ix) {

                if (ix < 0 || ix >= this._widgets.length) {
                    throw new RangeError("invalid widget index");
                }

                if (this._widgets.length === 1) {
                    this.setWidgetAtIndex(0, null);
                    return;
                }

                var widget = this._widgets[ix];
                if (widget) {
                    this._removeChildViaElement(widget, this._root);    
                }

                this._widgets.splice(ix, 1);

                var victimSplit = (ix === this._widgets.length) ? (ix - 1) : ix;
                this._root.removeChild(this._splits[victimSplit].divider);
                this._splits.splice(victimSplit, 1);
                
                this._layout();

                return widget;
                
            },

            getWidgetAtIndex: function(ix) {

                if (ix < 0 || ix >= this._widgets.length) {
                    throw new RangeError("invalid widget index");
                }

                return this._widgets[ix];

            },

            setWidgetAtIndex: function(ix, widget) {

                if (ix < 0 || ix >= this._widgets.length) {
                    throw new RangeError("invalid widget index");
                }

                var existingWidget = this._widgets[ix];
                
                if (widget !== existingWidget) {
                    if (existingWidget) {
                        this._removeChildViaElement(existingWidget, this._root);
                        this._widgets[ix] = null;
                    }

                    if (widget) {
                        this._widgets[ix] = widget;
                        this._attachChildViaElement(widget, this._root);
                    }

                    this._layout();
                }
                    
                return existingWidget;

            },
            
            _buildStructure: function() {
                
                this._root = this.document.createElement('div');
                this._root.className = 'hk-split-pane';
                
                this._ghost = this.document.createElement('div');
                this._ghost.className = 'hk-split-pane-divider hk-split-pane-ghost';
                
                du.addClass(this._root, this._orientation === k.SPLIT_PANE_HORIZONTAL ? 'horizontal' : 'vertical');
            
            },
            
            _layout: function() {

                var width       = this.width,
                    height      = this.height,
                    horizontal  = this._orientation === k.SPLIT_PANE_HORIZONTAL,
                    widgets     = this._widgets,
                    splits      = this._splits,
                    totalSpace  = (horizontal ? height : width) - (splits.length * DIVIDER_SIZE),
                    pos         = 0,
                    root        = this._root;

                if (totalSpace < 0) {

                    // TODO: handle

                } else {

                    var lastRatio = 0;
                    
                    for (var i = 0; i < splits.length; ++i) {
                        
                        var ratio   = splits[i].ratio,
                            divider = splits[i].divider,
                            widget  = widgets[i];

                        if (horizontal) {
                            
                            var paneHeight = Math.floor(totalSpace * (ratio - lastRatio));

                            if (widget) {
                                widget.setBounds(0, pos, width, paneHeight);    
                            }
                            
                            divider.style.top = (pos + paneHeight) + 'px';
                            pos += paneHeight + DIVIDER_SIZE;
                            
                        } else {
                            
                            var paneWidth = Math.floor(totalSpace * (ratio - lastRatio));

                            if (widget) {
                                widget.setBounds(pos, 0, paneWidth, height);    
                            }
                                   
                            divider.style.left = (pos + paneWidth) + 'px';
                            pos += paneWidth + DIVIDER_SIZE;
                            
                        }
                        
                        lastRatio = ratio;
                        
                    }

                    var lastWidget = widgets[widgets.length-1];
                    if (lastWidget) {
                        if (horizontal) {
                            lastWidget.setBounds(0, pos, width, height - pos);
                        } else {
                            lastWidget.setBounds(pos, 0, width - pos, height);
                        }    
                    }

                }
            
            },
            
            _bind: function() {

                var self = this;
                this._root.addEventListener('mousedown', function(evt) {

                    var horizontal = self._orientation === k.SPLIT_PANE_HORIZONTAL;

                    if (evt.target.className === 'hk-split-pane-divider') {

                        evt.stopPropagation();

                        var splitIx;
                        for (var i = 0; i < self._splits.length; ++i) {
                            if (self._splits[i].divider === evt.target) {
                                splitIx = i;
                                break;
                            }
                        }
                        
                        var min, max;

                        if (splitIx === 0) {
                            min = 0;
                        } else {
                            min = parseInt(self._splits[splitIx-1].divider.style[horizontal ? 'top' : 'left'], 10) + DIVIDER_SIZE;
                        }
                        
                        if (splitIx === self._splits.length - 1) {
                            max = parseInt(self[horizontal ? 'height' : 'width']) - DIVIDER_SIZE;
                        } else {
                            max = parseInt(self._splits[splitIx+1].divider.style[horizontal ? 'top' : 'left'], 10) - DIVIDER_SIZE;
                        }

                        var spx       = evt.pageX,
                            spy       = evt.pageY,
                            sx        = parseInt(evt.target.style.left),
                            sy        = parseInt(evt.target.style.top),
                            lastValid = (horizontal ? sy : sx);

                        function updateGhost() {
                            self._ghost.style[horizontal ? 'top' : 'left'] = lastValid + 'px';
                        }
                        
                        self._root.appendChild(self._ghost);
                        updateGhost();

                        var stopCapture = rattrap.startCapture(self.document, {
                            cursor: (self._orientation === k.SPLIT_PANE_VERTICAL) ? 'col-resize' : 'row-resize',
                            mousemove: function(evt) {
                                if (horizontal) {
                                    var dy = evt.pageY - spy,
                                        y = sy + dy;
                                    if (y < min) y = min;
                                    if (y > max) y = max;
                                    lastValid = y;
                                } else {
                                    var dx = evt.pageX - spx,
                                        x = sx + dx;
                                    if (x < min) x = min;
                                    if (x > max) x = max;
                                    lastValid = x;
                                }
                                updateGhost();
                            },
                            mouseup: function() {
                                stopCapture();
                                self._root.removeChild(self._ghost);
                                
                                var p = (lastValid - min) / (max - min);
                                if (isNaN(p)) p = 0;

                                var minSplit = (splitIx === 0) ? 0 : self._splits[splitIx-1].ratio,
                                    maxSplit = (splitIx === self._splits.length-1) ? 1 : self._splits[splitIx+1].ratio;

                                self._splits[splitIx].ratio = minSplit + (maxSplit - minSplit) * p;

                                self._layout();

                                self.onPaneResize.emit(self);
                            }
                        });

                    }
                
                });
            
            }
        
        }
    
    ];

}));
},{"../BlockWidget":4,"../constants":28,"../core":29,"../theme":31,"domutil":35,"rattrap":37,"signalkit":38}],17:[function(require,module,exports){
var ctx          = require('../core'),
    theme        = require('../theme'),
    k            = require('../constants'),
    Container    = require('../Container');

ctx.registerWidget('Panel', module.exports = Container.extend(function(_sc, _sm) {

	return [

	    function() {
	        _sc.apply(this, arguments);
	    },

	    'methods', {
	        _buildStructure: function() {
	            this._root = this.document.createElement('div');
	            this._root.className = 'hk-panel';
	        }
	    }

	]

}));
},{"../Container":11,"../constants":28,"../core":29,"../theme":31}],18:[function(require,module,exports){
var ctx             = require('../core'),
    theme           = require('../theme'),
    k               = require('../constants'),
    BlockWidget     = require('../BlockWidget');

function makeSimpleEditor(hk, builder, get, set, config) {

    var widget = hk[builder]();

    function sync() {
        widget.setValue(get());
    }

    var cancel = widget.onChange.connect(function(src, val) {
        if (!set(val)) {
            widget.setValue(get());
        };
    });

    for (var arg in config) {
        var setter = 'set' + arg[0].toUpperCase() + arg.substring(1);
        widget[setter](config[arg]);
    }

    return {
        widget      : widget,
        sync        : sync,
        teardown    : cancel
    };

}

var editors = {
    checkbox: function(hk, get, set, options) {
        return makeSimpleEditor(hk, 'checkbox', get, set, options);
    },
    knob: function(hk, get, set, options) {
        return makeSimpleEditor(hk, 'knob', get, set, options);
    },
    text: function(hk, get, set, options) {
        return makeSimpleEditor(hk, 'textField', get, set, options);
    },
    slider: function(hk, get, set, options) {
        return makeSimpleEditor(hk, 'horizontalSlider', get, set, options);
    }
};

var PropertyEditor = module.exports = BlockWidget.extend(function(_sc, _sm) {

    return [

        function(hk, rect) {

            this._delegate = null;
            this._properties = null;

            _sc.call(this, hk, rect);

        },

        'methods', {

            getDelegate: function() {
                return this._delegate;
            },

            setDelegate: function(newDelegate) {
                
                if (newDelegate === this._delegate) {
                    return;
                }

                this._table.innerHTML = '';
                this._properties = null;

                if (this._delegate) {
                    this._teardown();
                }

                this._delegate = newDelegate || null;

                if (this._delegate) {

                    var self = this;
                    
                    // bind to receive notifications about property values changing
                    var cancel1 = this._delegate.onPropertyChange(function(src, evt) {
                        self._properties[evt.property].sync();
                    });

                    // TODO: bind to receive notifications of new/removed properties
                    // var cancel2 = ...;

                    this._delegateCancel = function() {
                        cancel1();
                        // cancel2();
                    }

                    this._rebuild();

                }

            },

            _buildStructure: function() {
                
                this._root = this.document.createElement('div');
                this._root.className = 'hk-property-editor';

                this._table = this.document.createElement('table');

                this._root.appendChild(this._table);

            },

            _rebuild: function() {

                this._properties = {};
                
                var d = this._delegate;

                var groupCount = (typeof d.getPropertyGroupCount === 'function')
                                    ? d.getPropertyGroupCount()
                                    : 1;

                var useGroupHeaders = (typeof d.getPropertyGroupTitle === 'function');

                var groupHeader = null;
                for (var i = 0; i < groupCount; ++i) {
                    
                    if (useGroupHeaders && (groupHeader = this._buildGroupHeader(i))) {
                        this._table.appendChild(groupHeader);
                    }

                    var tbody = this.document.createElement('tbody');
                    this._table.appendChild(tbody);
                    this._appendGroupEditors(tbody, i);

                }

            },

            _buildGroupHeader: function(ix) {

                var title = this._delegate.getPropertyGroupTitle(ix);
                if (typeof title !== 'string') {
                    return null;
                }

                var header = this.document.createElement('thead'),
                    row = this.document.createElement('tr'),
                    col = this.document.createElement('th');

                col.setAttribute('colspan', 2);
                col.textContent = title;

                row.appendChild(col);
                header.appendChild(row);

                return header;

            },

            _appendGroupEditors: function(tbody, groupIx) {

                var properties = this._delegate.getPropertyNames(groupIx);
                properties.forEach(function(name) {

                    var desc = this._delegate.getPropertyDescriptor(name);

                    var row = this.document.createElement('tr');
                    tbody.appendChild(row);

                    var cap = this.document.createElement('th');
                    row.appendChild(cap);
                    cap.textContent = desc.caption || '';
                    
                    var cell = this.document.createElement('td');
                    row.appendChild(cell);

                    var editor = this._buildPropertyInput(
                        name,
                        desc.type || 'text',
                        desc.config || {}
                    );

                    // store widget instance, sync fn etc
                    this._properties[name] = editor;

                    this._attachChildViaElement(editor.widget, cell);
                    editor.sync();

                }, this);

                return tbody;

            },

            _buildPropertyInput: function(name, type, options) {

                var d = this._delegate;

                return editors[type](
                    this._hk,
                    function get() { return d.getPropertyValue(name); },
                    function set(v) { return d.setPropertyValue(name, v); },
                    options || {}
                );

            },

            _teardown: function() {
                this._delegateCancel();
                for (var k in this._properties) {
                    var prop = this._properties[k];
                    prop.teardown();
                    this._removeChild(prop.widget);
                    prop.widget.dispose();
                }
            }
        
        }

    ];

});

PropertyEditor.registerEditor = function(type, builder) {
    if (type in editors) {
        throw new Error("duplicate editor type: " + type);
    }
    editors[type] = builder;
}

ctx.registerWidget('PropertyEditor', PropertyEditor);
ctx.registerCSS(".hk-property-editor {\n\t\n}\n\n.hk-property-editor table {\n\twidth: 100%;\n}\n\n.hk-property-editor thead {\n\tbackground-color: #929DA8;\n}\n\n.hk-property-editor thead th {\n\ttext-align: left;\n\tpadding: 3px;\n\tcolor: black;\n}\n\n.hk-property-editor tbody th, td {\n\tpadding-top: 3px;\n\tpadding-bottom: 3px;\n\tvertical-align: middle;\n}\n\n.hk-property-editor tbody tr:first-child td,\n.hk-property-editor tbody tr:first-child th {\n\tpadding-top: 6px;\t\n}\n\n.hk-property-editor tbody tr:last-child td,\n.hk-property-editor tbody tr:last-child th {\n\tpadding-bottom: 6px;\t\n}\n\n.hk-property-editor tbody th {\n\ttext-align: left;\n\tpadding-right: 5px;\n\tcolor: white;\n\twhite-space: nowrap;\n}\n\n.hk-property-editor tbody td {\n\ttext-align: right;\n\twidth: 70%;\n}\n\n.hk-property-editor .hk-text-field,\n.hk-property-editor .hk-horizontal-slider {\n\twidth: 100%;\n}");
},{"../BlockWidget":4,"../constants":28,"../core":29,"../theme":31}],19:[function(require,module,exports){
var ctx         = require('../core'),
    theme       = require('../theme'),
    k           = require('../constants'),
    BlockWidget = require('../BlockWidget'),
    trbl        = require('trbl');

var DEFAULT_PADDING         = 8,
    DEFAULT_TOOLBAR_HEIGHT  = 18;

var RootPane = module.exports = BlockWidget.extend(function(_sc, _sm) {

    return [

        function() {

            this._padding           = [DEFAULT_PADDING, DEFAULT_PADDING, DEFAULT_PADDING, DEFAULT_PADDING];
            this._toolbarHeight     = DEFAULT_TOOLBAR_HEIGHT;
            this._toolbarVisible    = true;
            this._toolbar           = null;
            this._rootWidget        = null;
            this._resizeDelay       = 500;

            _sc.apply(this, arguments);

            this._setupResizeHandler();

        },

        'methods', {

            dispose: function() {
                this.setToolbar(null);
                this.setRootWidget(null);
                _sm.dispose.call(this);
            },

            setPadding: function(padding) {
                this._padding = trbl(padding);
                this._layout();
            },

            setBackgroundColor: function(color) {
                this._root.style.backgroundColor = color;
            },

            setToolbarHeight: function(height) {

                if (height === this._toolbarHeight) {
                    return;
                }

                if (height === null) {
                    this._toolbarHeight = DEFAULT_TOOLBAR_HEIGHT;
                } else {
                    this._toolbarHeight = parseInt(height, 10);
                }

                this._layout();

            },

            setToolbar: function(widget) {

                if (widget === this._toolbar)
                    return;

                if (this._toolbar) {
                    this._removeChildViaElement(this._toolbar, this._root);
                    this._toolbar = null;
                }

                if (widget) {
                    this._toolbar = widget;
                    this._attachChildViaElement(this._toolbar, this._root);
                }

                this._layout();

            },

            showToolbar: function() {
                this._toolbarVisible = true;
                this._layout();
            },
            
            hideToolbar: function() {
                this._toolbarVisible = false;
                this._layout();
            },
            
            toggleToolbar: function() {
                this._toolbarVisible = !this._toolbarVisible;
                this._layout();
            },
            
            isToolbarVisible: function() {
                return this._toolbarVisible;
            },

            setRootWidget: function(widget) {

                if (widget === this._rootWidget)
                    return;

                if (this._rootWidget) {
                    this._removeChildViaElement(this._rootWidget, this._root);
                    this._rootWidget = null;
                }

                if (widget) {
                    this._rootWidget = widget;
                    this._attachChildViaElement(this._rootWidget, this._root);
                }

                this._layout();

            },

            setBounds: function(x, y, width, height) {
                /* no-op; root widget always fills its containing DOM element */
            },

            setResizeDelay: function(delay) {
                this._resizeDelay = parseInt(delay, 10);
            },

            _buildStructure: function() {
                this._root = this.document.createElement('div');
                this._root.className = 'hk-root-pane';
            },

            _layout: function() {
                
                var rect        = this._root.getBoundingClientRect(),
                    left        = this._padding[3],
                    top         = this._padding[0],
                    width       = rect.width - (this._padding[1] + this._padding[3]),
                    rootTop     = top,
                    rootHeight  = rect.height - (this._padding[0] + this._padding[2]);
                
                if (this._toolbar && this._toolbarVisible) {
                    
                    this._toolbar.setHidden(false);
                    this._toolbar.setBounds(left,
                                            top,
                                            width,
                                            this._toolbarHeight);
                    
                    var delta = this._toolbarHeight + theme.getInt('HK_TOOLBAR_MARGIN_BOTTOM');
                    rootTop += delta;
                    rootHeight -= delta;
                
                } else if (this._toolbar) {
                    this._toolbar.setHidden(true);
                }
                
                if (this._rootWidget) {
                    this._rootWidget.setBounds(left, rootTop, width, rootHeight);
                }
                
            },

            _setupResizeHandler: function() {

                var self    = this,
                    timeout = null;

                // FIXME: stash this registration for later unbinding
                // isn't this what basecamp is for?
                this.window.addEventListener('resize', function() {
                    if (self._resizeDelay <= 0) {
                        self._layout();    
                    } else {
                        if (timeout) {
                            self._clearTimeout(timeout);
                        }
                        timeout = self._setTimeout(function() {
                            self._layout();
                        }, self._resizeDelay);
                    }
                });

            }

        }

    ];

});

ctx.registerCSS(".hk-root-pane {\n\ttop: 0;\n\tleft: 0;\n\tright: 0;\n\tbottom: 0;\n\toverflow: hidden;\n\tbackground-color: $HK_ROOT_BG_COLOR;\n}");
ctx.registerWidget('RootPane', RootPane);
},{"../BlockWidget":4,"../constants":28,"../core":29,"../theme":31,"trbl":40}],20:[function(require,module,exports){
var ctx             = require('../core'),
    theme           = require('../theme'),
    k               = require('../constants'),
    InlineWidget    = require('../InlineWidget'),
    du              = require('domutil');

ctx.registerWidget('Select', module.exports = InlineWidget.extend(function(_sc, _sm) {

    return [

        function(hk) {
            _sc.call(this, hk);
        },

        'methods', {

            dispose: function() {
                _sm.dispose.call(this);
            },
            
            _buildStructure: function() {
                this._root = this.document.createElement('select');
                this._root.type = 'text'
                this._root.className = 'hk-select';

                this._root.innerHTML = "<option>Choice 1</option><option>Choice 2</option><option>Choice 3</option>";

            }
        
        }

    ];

}));

ctx.registerCSS(".hk-select {\n\theight: 18px;\n}");
},{"../InlineWidget":13,"../constants":28,"../core":29,"../theme":31,"domutil":35}],21:[function(require,module,exports){
var ctx             = require('../core'),
    theme           = require('../theme'),
    k               = require('../constants'),
    BlockWidget    	= require('../BlockWidget'),
    du      		= require('domutil'),
    rattrap 		= require('rattrap');

var SPLIT_PANE_HORIZONTAL   = 'h',
    SPLIT_PANE_VERTICAL     = 'v';

//
// Constants

ctx.defineConstants({
	HORIZONTAL 				: 'h',
	VERTICAL 				: 'v',
	SPLIT_PANE_HORIZONTAL   : SPLIT_PANE_HORIZONTAL,
    SPLIT_PANE_VERTICAL     : SPLIT_PANE_VERTICAL
});

//
// Widget

ctx.registerWidget('SplitPane', module.exports = BlockWidget.extend(function(_sc, _sm) {

    return [

        function() {

            this._widgets       = [null, null];
            this._hiddenWidgets = [false, false];
            this._split         = 0.5;
            this._orientation   = SPLIT_PANE_HORIZONTAL;
            
            _sc.apply(this, arguments);

            this._bind();

        },

        'methods', {

            dispose: function() {
                this.setWidgetAtIndex(0, null);
                this.setWidgetAtIndex(1, null);
                _sm.dispose.call(this);
            },
            
            setOrientation: function(orientation) {
                
                this._orientation = orientation;
                
                du.removeClass(this._root, 'horizontal vertical');
                du.addClass(this._root, this._orientation === SPLIT_PANE_HORIZONTAL ? 'horizontal' : 'vertical');
                
                this._layout();
            
            },
            
            setBounds: function(x, y, w, h) {
                _sm.setBounds.call(this, x, y, w, h);
                this._layout();
            },

            getSplit: function() {
                return this._split;
            },
            
            setSplit: function(split) {
                if (split < 0) split = 0;
                if (split > 1) split = 1;
                this._split = split;
                this._layout();
            },
            
            setLeftWidget       : function(widget) { this.setWidgetAtIndex(0, widget); },
            setTopWidget        : function(widget) { this.setWidgetAtIndex(0, widget); },
            setRightWidget      : function(widget) { this.setWidgetAtIndex(1, widget); },
            setBottomWidget     : function(widget) { this.setWidgetAtIndex(1, widget); },

            hideWidgetAtIndex: function(ix) {
                this._hiddenWidgets[ix] = true;
                this._layout();
            },

            showWidgetAtIndex: function(ix) {
                this._hiddenWidgets[ix] = false;
                this._layout();
            },

            toggleWidgetAtIndex: function(ix) {
                this._hiddenWidgets[ix] = !this._hiddenWidgets[ix];
                this._layout();
            },
            
            setWidgetAtIndex: function(ix, widget) {
                
                var existingWidget = this._widgets[ix];
                
                if (widget !== existingWidget) {
                    if (existingWidget) {
                        this._removeChildViaElement(existingWidget, this._root);
                        this._widgets[ix] = null;
                    }

                    if (widget) {
                        this._widgets[ix] = widget;
                        this._attachChildViaElement(widget, this._root);
                    }

                    this._layout();
                }
                    
                return existingWidget;
                
            },
            
            _buildStructure: function() {
                
                this._root = this.document.createElement('div');
                this._root.className = 'hk-split-pane';
                
                this._divider = this.document.createElement('div');
                this._divider.className = 'hk-split-pane-divider';
                
                this._ghost = this.document.createElement('div');
                this._ghost.className = 'hk-split-pane-divider hk-split-pane-ghost';
                
                this._root.appendChild(this._divider);
                
                du.addClass(this._root, this._orientation === SPLIT_PANE_HORIZONTAL ? 'horizontal' : 'vertical');
            
            },
            
            _layout: function() {

                var dividerSize = theme.getInt('HK_SPLIT_PANE_DIVIDER_SIZE');

                var hw = this._hiddenWidgets,
                    ws = this._widgets;

                if (ws[0]) ws[0].setHidden(hw[0]);
                if (ws[1]) ws[1].setHidden(hw[1]);

                if (hw[0] || hw[1]) {
                    this._divider.style.display = 'none';
                    if (!hw[0] && ws[0]) {
                        ws[0].setBounds(0, 0, this.width, this.height);
                    } else if (!hw[1] && ws[1]) {
                        ws[1].setBounds(0, 0, this.width, this.height);
                    }
                    return;
                } else {
                    this._divider.style.display = 'block';
                }

                if (this._orientation === SPLIT_PANE_HORIZONTAL) {
                    
                    var divt  = Math.floor(this._split * (this.height - dividerSize)),
                        w2t   = divt + dividerSize,
                        w2h   = this.height - w2t;
                    
                    this._divider.style.left = '';
                    this._divider.style.top = divt + 'px';
                    
                    if (ws[0]) ws[0].setBounds(0, 0, this.width, divt);
                    if (ws[1]) ws[1].setBounds(0, w2t, this.width, w2h);
                
                } else if (this._orientation === SPLIT_PANE_VERTICAL) {
                    
                    var divl  = Math.floor(this._split * (this.width - dividerSize)),
                        w2l   = divl + dividerSize,
                        w2w   = this.width - w2l;
                        
                    this._divider.style.left = divl + 'px';
                    this._divider.style.top = '';
                    
                    if (ws[0]) ws[0].setBounds(0, 0, divl, this.height);
                    if (ws[1]) ws[1].setBounds(w2l, 0, w2w, this.height);
                    
                }
            
            },
            
            _bind: function() {
                
                var self = this;
                
                this._divider.addEventListener('mousedown', function(evt) {

                    var dividerSize     = theme.getInt('HK_SPLIT_PANE_DIVIDER_SIZE');
                    
                    var rootPos         = self._root.getBoundingClientRect(),
                        lastValidSplit  = self._split;

                    if ('offsetX' in evt) {
                    	var offsetX = evt.offsetX,
                    		offsetY = evt.offsetY;
                    } else {
                    	var offsetX = evt.layerX,
                    		offsetY = evt.layerY;
                    }

                    function moveGhost() {
                        if (self._orientation === SPLIT_PANE_VERTICAL) {
                            self._ghost.style.left = Math.floor(lastValidSplit * (rootPos.width - dividerSize)) + 'px';
                            self._ghost.style.top = '';
                        } else if (self._orientation === SPLIT_PANE_HORIZONTAL) {
                            self._ghost.style.left = '';
                            self._ghost.style.top = Math.floor(lastValidSplit * (rootPos.height - dividerSize)) + 'px';
                        }
                    }
                            
                    self._root.appendChild(self._ghost);
                    moveGhost();
                    
                    var stopCapture = rattrap.startCapture(self.document, {
                        cursor: (self._orientation === SPLIT_PANE_VERTICAL) ? 'col-resize' : 'row-resize',
                        mousemove: function(evt) {
                            if (self._orientation === SPLIT_PANE_VERTICAL) {
                                var left    = evt.pageX - offsetX,
                                    leftMin = (rootPos.left),
                                    leftMax = (rootPos.right - dividerSize);
                                if (left < leftMin) left = leftMin;
                                if (left > leftMax) left = leftMax;
                                
                                lastValidSplit = (left - leftMin) / (rootPos.width - dividerSize);
                                moveGhost();
                            } else {
                                var top     = evt.pageY - offsetY,
                                    topMin  = (rootPos.top),
                                    topMax  = (rootPos.bottom - dividerSize);
                                if (top < topMin) top = topMin;
                                if (top > topMax) top = topMax;

                                lastValidSplit = (top - topMin) / (rootPos.height - dividerSize);
                                moveGhost();
                            }
                        },
                        mouseup: function() {
                            stopCapture();
                            self._root.removeChild(self._ghost);
                            self.setSplit(lastValidSplit);
                        }
                    });
                    
                });
            
            }
        
        }
    
    ];

}));

ctx.registerCSS(".hk-split-pane > .hk-split-pane-divider {\n\tposition: absolute;\n\tbackground-color: $HK_ROOT_BG_COLOR;\n}\n\n.hk-split-pane > .hk-split-pane-ghost {\n\tbackground-color: #ff3300;\n\topacity: 0.7;\n}\n\n.hk-split-pane.horizontal > .hk-split-pane-divider {\n\tleft: 0; right: 0;\n\theight: $HK_SPLIT_PANE_DIVIDER_SIZE;\n\tcursor: row-resize;\n}\n\n.hk-split-pane.vertical > .hk-split-pane-divider {\n\ttop: 0; bottom: 0;\n\twidth: $HK_SPLIT_PANE_DIVIDER_SIZE;\n\tcursor: col-resize;\n}\n");
},{"../BlockWidget":4,"../constants":28,"../core":29,"../theme":31,"domutil":35,"rattrap":37}],22:[function(require,module,exports){
var ctx             = require('../core'),
    theme           = require('../theme'),
    k               = require('../constants'),
    BlockWidget     = require('../BlockWidget'),
    du              = require('domutil');

function TextCell(doc) {
    this.el = doc.createElement('div');
    this.el.className = 'text cell';
    this._text = '';
}

TextCell.prototype.setText = function(text) {
    this._text = '' + (text || '');
    this.el.textContent = this._text;
    return this;
}

TextCell.prototype.setAlign = function(align) {
    this.el.style.textAlign = align;
    return this;
}

TextCell.prototype.setMinWidth = function(minWidth) {
    this.el.style.minWidth = parseInt(minWidth, 10) + 'px';
    return this;
}

TextCell.prototype.setMaxWidth = function(maxWidth) {
    this.el.style.maxWidth = parseInt(maxWidth, 10) + 'px';
    return this;
}

ctx.registerWidget('StatusBar', module.exports = BlockWidget.extend(function(_sc, _sm) {

    return [

        function() {
            _sc.apply(this, arguments);

            this._leftCells = [];
            this._rightCells = [];
        },

        'methods', {
            _buildStructure: function() {
                
                this._root = this.document.createElement('div');
                this._root.className = 'hk-status-bar';
            
                this._left = this.document.createElement('div');
                this._left.className = 'left-cells';
                this._root.appendChild(this._left);

                this._right = this.document.createElement('div');
                this._right.className = 'right-cells';
                this._root.appendChild(this._right);

            },

            addTextCell: function(position, text) {

                var cell = new TextCell(this.document);
                cell.setText(text);

                if (position.charAt(0) === 'l') {
                    this._leftCells.push(cell);
                    this._left.appendChild(cell.el);
                } else if (position.charAt(0) === 'r') {
                    this._rightCells.push(cell);
                    this._right.appendChild(cell.el);
                } else {
                    throw new Error("unknown status bar cell position: " + position);
                }

                return cell;

            }
        }

    ];

}));

ctx.registerCSS(".hk-status-bar {\n    background: #595959;\n    border-top: 1px solid #7D7D7D;\n    box-sizing: border-box;\n    padding: 0 5px;\n}\n\n.hk-status-bar .left-cells {\n    float: left;\n}\n\n.hk-status-bar .right-cells {\n    float: right;\n}\n\n.hk-status-bar .cell {\n    float: left;\n    height: 20px;\n}\n\n.hk-status-bar .cell.text {\n    color: white;\n    font-size: 11px;\n    font-family: Helvetica;\n    padding-top: 3px;\n    text-shadow: #202020 0 -1px 1px;\n}");
},{"../BlockWidget":4,"../constants":28,"../core":29,"../theme":31,"domutil":35}],23:[function(require,module,exports){
var ctx             = require('../core'),
    theme           = require('../theme'),
    k               = require('../constants'),
    BlockWidget    	= require('../BlockWidget'),
    du 				= require('domutil');

ctx.registerWidget('TabPane', module.exports = BlockWidget.extend(function(_sc, _sm) {

	return [

	    function() {
	        this._tabs = [];
	        _sc.apply(this, arguments);
	        this._bind();
	    },

	    'methods', {

	        setBounds: function() {
	            _sm.setBounds.apply(this, arguments);
	            this._redraw();
	        },

	        // Querying

	        tabCount: function() {
	            return this._tabs.length;
	        },

	        activeIndex: function() {
	            for (var i = 0; i < this._tabs.length; ++i) {
	                if (this._tabs[i].active) {
	                    return i;
	                }
	            }
	            return -1;
	        },

	        activeWidget: function() {
	            var ix = this.activeIndex();
	            return ix >= 0 ? this._tabs[ix].pane : null;
	        },

	        indexOfWidget: function(widget) {
	            for (var i = 0; i < this._tabs.length; ++i) {
	                if (this._tabs[i].pane === widget) {
	                    return i;
	                }
	            }
	            return -1;
	        },

	        //
	        // Add/remove

	        addTab: function(title, widget, selectTab) {
	            
	            var tab = this.document.createElement('a');
	            tab.textContent = title;
	            
	            var newTab = {
	                title   : title,
	                ele     : tab,
	                pane    : widget,
	                active  : false
	            };
	            
	            this._tabs.push(newTab);
	            
	            this._tabBar.appendChild(tab);
	            
	            widget.setHidden(true);
	            this._attachChildViaElement(widget, this._tabContainer);
	            
	            if (this._tabs.length === 1 || selectTab) {
	                this.selectTabAtIndex(this._tabs.length - 1);
	            }
	            
	        },

	        removeTabAtIndex: function(ix) {
	            
	            if (ix < 0 || ix >= this._tabs.length) {
	                return null;
	            }

	            var tab = this._tabs[ix];
	            this._tabBar.removeChild(tab.ele);
	            this._removeChildViaElement(tab.pane, this._tabContainer);
	            this._tabs.splice(ix, 1);

	            if (tab.active && this._tabs.length > 0) {
	                this.selectTabAtIndex(ix < this._tabs.length ? ix : ix - 1);
	            }

	        },

	        removeActiveTab: function() {
	            return this.removeTabAtIndex(this.activeIndex());
	        },

	        removeWidget: function(widget) {
	            return this.removeTabAtIndex(this.indexOfWidget(widget));
	        },

	        //
	        // Select

	        selectTabAtIndex: function(ix) {
	            for (var i = 0; i < this._tabs.length; ++i) {
	                var tab = this._tabs[i];
	                if (i === ix) {
	                    du.addClass(tab.ele, 'active');
	                    tab.active = true;
	                    tab.pane.setHidden(false);
	                } else {
	                    du.removeClass(tab.ele, 'active');
	                    tab.active = false;
	                    tab.pane.setHidden(true);
	                }
	                this._redraw();
	            }
	        },

	        //
	        // Titles

	        setActiveTabTitle: function(title) {
	            this.setTitleAtIndex(this.activeIndex(), title);
	        },

	        setTitleForWidget: function(widget, title) {
	            this.setTitleAtIndex(this.indexOfWidget(widget), title);
	        },

	        setTitleAtIndex: function(ix, title) {

	            if (ix < 0 || ix >= this._tabs.length) {
	                return;
	            }

	            title = ('' + title);
	            this._tabs[ix].title = title;
	            this._tabs[ix].ele.textContent = title;

	            this._redraw();

	        },

	        //
	        // 

	        _buildStructure: function() {
	            
	            this._root = this.document.createElement('div');
	            this._root.className = 'hk-tab-pane';
	            
	            this._tabBar = this.document.createElement('nav');
	            this._tabBar.className = 'hk-tab-bar';
	            
	            this._tabContainer = this.document.createElement('div');
	            this._tabContainer.className = 'hk-tab-container';
	            
	            this._canvas = this.document.createElement('canvas');
	            this._canvas.className = 'hk-tab-canvas';
	            this._canvas.height = theme.getInt('HK_TAB_SPACING') * 2;
	            this._ctx = this._canvas.getContext('2d');
	            
	            this._root.appendChild(this._canvas);
	            this._root.appendChild(this._tabBar);
	            this._root.appendChild(this._tabContainer);
	            
	        },
	        
	        _bind: function() {
	            
	            var self = this;
	            
	            this._tabBar.addEventListener('click', function(evt) {
	                evt.preventDefault();
	                for (var i = 0; i < self._tabs.length; ++i) {
	                    if (self._tabs[i].ele === evt.target) {
	                        self.selectTabAtIndex(i);
	                        break;
	                    }
	                }
	            });
	            
	        },
	        
	        _redraw: function() {
	            var self = this;

	            var tabSpacing 	= theme.getInt('HK_TAB_SPACING'),
	            	tabHeight 	= theme.getInt('HK_TAB_HEIGHT'),
	            	tabRadius 	= theme.getInt('HK_TAB_BORDER_RADIUS'),
	            	bgColor 	= theme.get('HK_TAB_BACKGROUND_COLOR');

	            this._tabs.forEach(function(tab, i) {
	                tab.pane.setBounds(tabSpacing,
	                                   tabSpacing,
	                                   self.width - (2 * tabSpacing),
	                                   self.height - (3 * tabSpacing + tabHeight));
	                                                     
	                if (tab.active) {
	                    var width       = tab.ele.offsetWidth,
	                            height  = tab.ele.offsetHeight,
	                            left    = tab.ele.offsetLeft,
	                            top     = tab.ele.offsetTop,
	                            ctx     = self._ctx;

	                    width += tabRadius;

	                    if (i > 0) {
	                        left -= tabRadius;
	                        width += tabRadius;
	                    }

	                    self._canvas.style.left = '' + left + 'px';
	                    self._canvas.style.top = '' + (top + height) + 'px';
	                    self._canvas.width = width;
	                    
	                    ctx.fillStyle = bgColor;

	                    var arcY = tabSpacing - tabRadius;

	                    if (i == 0) {
	                        ctx.fillRect(0, 0, width - tabRadius, self._canvas.height);
	                        ctx.beginPath();
	                        ctx.arc(width, arcY, tabRadius, Math.PI, Math.PI / 2, true);
	                        ctx.lineTo(width - tabRadius, tabSpacing);
	                        ctx.lineTo(width - tabRadius, 0);
	                        ctx.fill();
	                    } else {
	                        ctx.beginPath();
	                        ctx.moveTo(tabRadius, 0);
	                        ctx.lineTo(tabRadius, arcY);
	                        ctx.arc(0, arcY, tabRadius, 0, Math.PI / 2, false);
	                        ctx.lineTo(width, tabSpacing);
	                        ctx.arc(width, arcY, tabRadius, Math.PI / 2, Math.PI, false);
	                        ctx.lineTo(width - tabRadius, 0);
	                        ctx.lineTo(tabRadius, 0);
	                        ctx.fill();
	                    }
	                }
	            });
	        }

	    }

	];

}));

ctx.registerCSS(".hk-tab-pane .hk-tab-bar {\n  position: absolute;\n  top: 0;\n  left: 0;\n  width: 100%;\n  height: $HK_TAB_HEIGHT;\n}\n\n.hk-tab-pane .hk-tab-bar > a {\n\n  /* control-font mixin */\n  font: $HK_CONTROL_FONT_SIZE $HK_CONTROL_FONT;\n  line-height: 1;\n\n  background: $HK_TAB_BACKGROUND_COLOR;\n  display: block;\n  float: left;\n  margin-right: $HK_TAB_SPACING;\n  color: $HK_TEXT_COLOR;\n  text-decoration: none;\n  font-weight: bold;\n  padding: $HK_TAB_PADDING;\n  border-radius: $HK_TAB_BORDER_RADIUS;\n  min-width: 30px;\n  text-align: center; \n  \n}\n\n.hk-tab-pane .hk-tab-bar > a.active {\n  border-bottom-left-radius: 0;\n  border-bottom-right-radius: 0;\n}\n\n.hk-tab-pane .hk-tab-container {\n  position: absolute;\n  top: $HK_TAB_CONTAINER_TOP;\n  right: 0;\n  bottom: 0;\n  left: 0;\n  background: $HK_TAB_BACKGROUND_COLOR;\n  border-radius: 8px;\n}\n\n.hk-tab-pane .hk-tab-canvas {\n  position: absolute;\n}\n");
},{"../BlockWidget":4,"../constants":28,"../core":29,"../theme":31,"domutil":35}],24:[function(require,module,exports){
var ctx             = require('../core'),
    theme           = require('../theme'),
    k               = require('../constants'),
    InlineWidget    = require('../InlineWidget'),
    du              = require('domutil');

// TODO: do we need a way of handling escape key to reset
// TODO: there are a whole pile of event handlers we could expose via signals:
//       onKeyDown, onKeyUp, onKeyPress, onFocus, onBlur, onInput. That's a lot
//       of overhead - worth investigating lazy-loading via getters?

ctx.registerWidget('TextField', module.exports = InlineWidget.extend(function(_sc, _sm) {

    return [

        function(hk) {
            _sc.call(this, hk);
            this._addSignal('onChange');
            this._addSignal('onAction');
            this._value = '';
        },

        'mixins', ['ValueWidget'],

        'methods', {

            dispose: function() {
                _sm.dispose.call(this);
            },

            _setValue: function(v) {
                if (v !== this._value) {
                    this._value = this._root.value = v;
                    return true;
                } else {
                    return false;
                }
            },
            
            _buildStructure: function() {

                var self = this;
                
                this._root = this.document.createElement('input');
                this._root.type = 'text'
                this._root.className = 'hk-text-field';

                this._root.addEventListener('change', function(evt) {
                    // normal rules don't apply here.
                    // textfield value is guaranteed to have changed so
                    // just sync property and broadcast the change.
                    self._value = self._root.value;
                    self._broadcastChange();
                });

                var ready = true;
                
                this._root.addEventListener('keydown', function(evt) {
                    if (ready && evt.which === 13) {
                        ready = false;
                        // sync the value here before firing action because
                        // keydown is fired before "change" (enter key causes
                        // change event)
                        self._value = self._root.value;
                        self.onAction.emit(this, self._value);
                    }
                    evt.stopPropagation();
                });

                this._root.addEventListener('keyup', function(evt) {
                    ready = true;
                    evt.stopPropagation();
                });

                this._root.addEventListener('keypress', function(evt) {
                    evt.stopPropagation();
                });
            },

            _applySizeHints: function() {
                this._applyHintedProperty(this._root, 'width');
                this._applyHintedProperty(this._root, 'height');
            }
        
        }

    ];

}));

ctx.registerCSS(".hk-text-field {\n\tpadding: 0 4px;\n    line-height: 1;\n    font-size: 10px;\n    background-color: $HK_BUTTON_BG_COLOR;\n    border: 1px solid $HK_TOOLBAR_ITEM_BORDER_COLOR;\n    width: 200px;\n    height: 18px;\n}\n\n.hk-text-field:focus {\n\toutline: none;\n\tborder-color: $HK_CONTROL_ACTIVE_BG_COLOR;\n}\n");
},{"../InlineWidget":13,"../constants":28,"../core":29,"../theme":31,"domutil":35}],25:[function(require,module,exports){
var ctx         = require('../core'),
    theme       = require('../theme'),
    k           = require('../constants'),
    BlockWidget = require('../BlockWidget'),
    du  		= require('domutil');

ctx.defineConstants({
	TOOLBAR_ALIGN_LEFT	: 'left',
	TOOLBAR_ALIGN_RIGHT	: 'right'
});

ctx.registerWidget('Toolbar', module.exports = BlockWidget.extend(function(_sc, _sm) {

	return [

        function() {

        	this._leftWidgets = [];
        	this._rightWidgets = [];

            _sc.apply(this, arguments);

        },

        'methods', {
            
            addAction: function(action, align) {
				var button = this._hk.button('toolbar');
				button.bindAction(action);
				return this.addWidget(button, align);
            },

            addWidget: function(widget, align) {
			
				align = align || k.TOOLBAR_ALIGN_LEFT;

				if (align === k.TOOLBAR_ALIGN_LEFT) {
					var targetEl 	= this._left,
						targetArray	= this._leftWidgets;
				} else {
					var targetEl 	= this._right,
						targetArray	= this._rightWidgets;
				}
				
				this._attachChildViaElement(widget, targetEl);
				targetArray.push(widget);

				return widget;

			},

			setBounds: function(x, y, width, height) {
				
				_sm.setBounds.call(this, x, y, width, height);

				function applyHints(widget) {
					widget.setLayoutSizeHints({height: height});
				}

				this._leftWidgets.forEach(applyHints);
				this._rightWidgets.forEach(applyHints);

			},

            _buildStructure: function() {

                this._root = this.document.createElement('div');
                
                this._left = this.document.createElement('div');
                this._left.className = 'hk-toolbar-items hk-toolbar-items-left';
                this._root.appendChild(this._left);
                
                this._right = this.document.createElement('div');
                this._right.className = 'hk-toolbar-items hk-toolbar-items-right';
                this._root.appendChild(this._right);
                
                this._root.className = 'hk-toolbar';

            }

        }

    ];

}));

ctx.registerCSS(".hk-toolbar {\n    \n}\n\n.hk-toolbar-items {\n\n}\n\n.hk-toolbar-items.hk-toolbar-items-left {\n    float: left;\n}\n\n.hk-toolbar-items.hk-toolbar-items-right {\n    float: right;\n}\n\n.hk-toolbar-items > * {\n    margin-right: 2px !important;\n    vertical-align: top;\n}\n\n.hk-toolbar-button {\n    border: 1px solid $HK_TOOLBAR_ITEM_BORDER_COLOR;\n    padding-left: 3px;\n    padding-right: 3px;\n}\n");
},{"../BlockWidget":4,"../constants":28,"../core":29,"../theme":31,"domutil":35}],26:[function(require,module,exports){
var ctx         = require('../core'),
    theme       = require('../theme'),
    k           = require('../constants'),
    BlockWidget = require('../BlockWidget'),
    du          = require('domutil');

// TODO: refresh
// TODO: context menu

// TODO: observation
// TODO: deletable items

// TODO: drag and drop (move, reorder)

// TODO: some sort of guard object that can only ever be
// executing/waiting for a single callback, and operation
// can be cancelled... based on the following...

function cancellable(fn, ifCancelled) {
    var cancelled = false, fn = function() {
        if (cancelled) {
            if (ifCancelled) {
                ifCancelled();
            }
        } else {
            return fn.apply(null, arguments);    
        }
    }
    return [fn, function() { cancelled = true; }];
}

var TreeView = module.exports = BlockWidget.extend(function(_sc, _sm) {

    return [

        function() {

            this._busy = false;
            this._delegate = null;
            this._selected = [];

            _sc.apply(this, arguments);

        },

        'methods', {

            setDelegate: function(delegate) {
                
                // FIXME: for completeness this should handle being
                // busy when called; changing delegates is a rare 
                // operation but should be handled gracefully.
                // idea: this._busy could be a cancellation function.

                if (delegate === this._delegate)
                    return;

                this._delegate = delegate;
                this._selected = false;

                this._wrapper.innerHTML = '';

                if (this._delegate) {
                    this._loadRootItems();
                }

            },

            _buildStructure: function() {

                var self = this;

                this._root = this.document.createElement('div');
                this._root.className = 'hk-tree-view';

                this._wrapper = this.document.createElement('ul');
                this._wrapper.className = 'hk-tree-view-items';
                
                this._wrapper.addEventListener('click', function(evt) {

                    evt.preventDefault();
                    evt.stopPropagation();

                    // click on icon to toggle expanded state
                    if (evt.target.className.match(/icon/)) {
                        var li = evt.target.parentNode.parentNode;
                        if (li.treeViewContainer) {
                            if (li.treeViewChildrenLoaded) {
                                du.toggleClass(li, 'expanded');
                            } else {
                                self._loadChildren(li);
                            }
                            return;
                        }
                    }

                    // otherwise, select
                    var li = self._itemForEvent(evt);

                    if (!li)
                        return;

                    if (evt.shiftKey) {
                        self._toggleSelection(li);
                    } else {
                        self._setSelection(li);
                    }

                });

                this._wrapper.addEventListener('dblclick', function(evt) {

                    evt.preventDefault();
                    evt.stopPropagation();

                    var li = self._itemForEvent(evt);

                    if (!li)
                        return;
                    
                    self._delegate.itemActivated(li.treeViewItem);    
                
                });

                this._root.appendChild(this._wrapper);

            },

            _loadRootItems: function() {

                if (this._busy)
                    return;

                this._busy = true;

                var self = this;
                this._delegate.rootItems(function(err, roots) {
                    if (err) {
                        // TODO: handle error
                    } else {
                        self._appendItems(self._wrapper, roots);
                    }
                    self._busy = false;
                });

            },

            _loadChildren: function(li) {

                if (this._busy)
                    return;

                this._busy = true;

                var self = this;
                this._delegate.childrenForItem(li.treeViewItem, function(err, children) {
                    if (err) {
                        // TODO: handle error
                        self._busy = false;
                    } else {

                        var list = self.document.createElement('ul');
                        li.appendChild(list);
                        li.treeViewChildrenLoaded = true;

                        self._appendItems(list, children);

                        setTimeout(function() {
                            du.addClass(li, 'expanded');
                            self._busy = false;
                        }, 0);

                    }
                });

            },

            _createNodeForItem: function(item) {

                var li          = this.document.createElement('li'),
                    isContainer = this._delegate.itemIsContainer(item);

                du.addClass(li, isContainer ? 'hk-tree-view-container' : 'hk-tree-view-leaf');
                
                var itemClass = this._delegate.itemClass(item);
                if (itemClass) {
                    du.addClass(li, itemClass);
                }

                var itemEl = this.document.createElement('div');
                itemEl.className = 'item';

                var icon = this.document.createElement('span');
                icon.className = 'icon';
                icon.innerHTML = '&nbsp;';
                itemEl.appendChild(icon);

                var title = this.document.createElement('span');
                title.className = 'title';
                title.textContent = this._delegate.itemTitle(item);
                itemEl.appendChild(title);

                var flair = this._delegate.itemFlair(item);
                if (flair.length > 0) {
                    var flairWrapper = this.document.createElement('div');
                    flairWrapper.className = 'hk-tree-view-flair';
                    flair.forEach(function(f) {
                        var flairEl = this.document.createElement('span');
                        flairEl.className = f.className;
                        if ('text' in f) {
                            flairEl.textContent = f.text;
                        } else if ('html' in f) {
                            flairEl.innerHTML = f.html;
                        }
                        flairWrapper.appendChild(flairEl);
                    }, this);
                    itemEl.appendChild(flairWrapper);
                }

                li.appendChild(itemEl);
                li.treeViewItem = item;
                li.treeViewContainer = isContainer;
                li.treeViewChildrenLoaded = false;

                return li;

            },

            _appendItems: function(wrapper, items) {
                items.map(function(r) {
                    return this._createNodeForItem(r);
                }, this).forEach(function(n) {
                    wrapper.appendChild(n);
                });
            },

            _setSelection: function(item) {
                this._clearSelection();
                this._addToSelection(item);
            },

            _toggleSelection: function(item) {
                var ix = this._selected.indexOf(item);
                if (ix < 0) {
                    this._addToSelection(item);
                } else {
                    this._removeFromSelection(item);
                }
            },

            _clearSelection: function() {
                for (var i = 0; i < this._selected.length; ++i) {
                    du.removeClass(this._selected[i], 'selected');
                }
                this._selected = [];
            },

            _removeFromSelection: function(item) {
                this._removeSelectedIndex(this._selected.indexOf(item));
            },

            _removeSelectedIndex: function(ix) {
                if (ix < 0 || ix >= this._selected.length) {
                    return;
                }
                du.removeClass(this._selected[ix], 'selected');
                this._selected.splice(ix, 1);
            },

            _addToSelection: function(item) {

                if (this._selected.indexOf(item) >= 0) {
                    return;
                }

                this._selected.push(item);
                du.addClass(item, 'selected');

            },

            _itemForEvent: function(evt) {

                var nn = evt.target.nodeName.toLowerCase();

                // ignore direct clicks on li because this means user clicked
                // dead space to left of expanded node.
                if (nn === 'ul' || nn === 'li') {
                    return null;
                }

                var curr = evt.target;
                while (curr && curr.nodeName.toLowerCase() !== 'li') {
                    curr = curr.parentNode;
                }

                return curr || null;

            }

        }

    ];

});

ctx.registerCSS(".hk-tree-view {\n\tbackground: #202020;\n\toverflow: auto;\n}\n\n.hk-tree-view .item {\n\tdisplay: block;\n\tpadding: 3px;\n}\n\n.hk-tree-view .icon {\n\tdisplay: inline-block;\n\twidth: 16px;\n\tbackground: blue;\n}\n\n.hk-tree-view .title {\n\tdisplay: inline-block;\n\tmargin-left: 5px;\n\tcolor: white;\n}\n\n.hk-tree-view ul {\n\tdisplay: block;\n\tlist-style: none;\n\tmargin: 0;\n\tpadding: 0;\n}\n\n.hk-tree-view li {\n\tdisplay: block;\n\tlist-style: none;\n\tmargin: 0;\n\tpadding: 0;\n}\n\n.hk-tree-view ul ul {\n\tmargin-left: 20px;\n}\n\n.hk-tree-view li > ul {\n\tdisplay: none;\n}\n\n/* Flair */\n\n.hk-tree-view-flair {\n\tfloat: right;\n}\n\n.hk-tree-view-flair > * {\n\tdisplay: inline-block;\n\ttext-align: center;\n\tmargin-left: 3px;\n}\n\n/* Expanded State */\n\n.hk-tree-view li.expanded > ul {\n\tdisplay: block;\n}\n\n.hk-tree-view li.expanded > .item > .icon {\n\tbackground: green;\n}\n\n/* Selected State */\n\n.hk-tree-view li.selected > .item {\n\tbackground: red;\n}");
ctx.registerWidget('TreeView', TreeView);
},{"../BlockWidget":4,"../constants":28,"../core":29,"../theme":31,"domutil":35}],27:[function(require,module,exports){
var ctx     = require('../core'),
    theme   = require('../theme'),
    k       = require('../constants'),
    Class   = require('classkit').Class,
    du      = require('domutil'),
    signal  = require('signalkit');

var Mixins = {};

var Widget = module.exports = Class.extend(function(_sc, _sm) {

    return [

        function(hk) {

            this._hk = hk;
            
            this._parent = null;
            this._hidden = false;
            
            var root = this._buildStructure();
            if (root) this._root = root;
            if (!this._root) throw new Error("widget root not built");
            du.addClass(this._root, 'hk-widget');

        },

        'properties', {
            window: {
                get: function() { return this._hk.window; }
            },
            document: {
                get: function() { return this._hk.document; }
            }
        },

        'methods', {
            /**
             * Call on a widget when you're done with it and never want to use it again.
             *
             * There is no need to remove this widget's root from the DOM, this guaranteed
             * to have happened by the time dispose() is called. However, container widgets
             * *must* remove all of their children (non-recursively).
             *
             * Subclasses should override this method to unregister listeners, remove child
             * widgets and nullify any references likely to cause memory leaks.
             */
            dispose: function() {
                this._root = null;
            },

            getRoot: function() { return this._root; },

            getParent: function() { return this._parent; },
            setParent: function(p) { this._parent = p; },

            isHidden: function() { return this._hidden; },
            setHidden: function(hidden) {
                this._hidden = !!hidden;
                this._root.style.display = this._hidden ? 'none' : '';
            },

            /**
             * A widget's implementation of this method should create that widget's
             * HTML structure and either assign it to this.root or return it. There
             * is no need to assign the CSS class `hk-widget`; this is done by the
             * widget initialiser, but any additional CSS classes must be added by
             * your code.
             *
             * Shortly after it has called _buildStructure(), the initialiser will
             * call setBounds() - a method you may have overridden to perform
             * additional layout duties - so ensure that the HTML structure is
             * set up sufficiently for this call to complete.
             */
            _buildStructure: function() {
                throw new Error("widgets must override Widget.prototype._buildStructure()");
            },

            _attachChildViaElement: function(childWidget, ele) {

                // TODO: it would probably be better if we just asked the
                // child to remove itself from the its current parent here
                // but that pre-supposes a standard interface for removing
                // elements from "containers", which we don't have yet. And
                // I'm not willing to commit to an interface that hasn't yet
                // proven to be required...
                var existingParent = childWidget.getParent();
                if (existingParent) {
                    throw new Error("can't attach child widget - child already has a parent!");
                }

                ele = ele || this.getRoot();
                ele.appendChild(childWidget.getRoot());
                childWidget.setParent(this);

            },

            _removeChild: function(childWidget) {
                return this._removeChildViaElement(childWidget, childWidget.getRoot().parentNode);
            },

            _removeChildViaElement: function(childWidget, ele) {
                ele.removeChild(childWidget.getRoot());
                childWidget.setParent(null);
            },

            //
            // Timeout/intervals

            _setTimeout: function(fn, timeout) {
                return this._hk.window.setTimeout(fn, timeout);
            },

            _clearTimeout: function(id) {
                return this._hk.window.clearTimeout(id);
            },

            _setInterval: function(fn, interval) {
                return this._hk.window.setInterval(fn, interval);
            },

            _clearInterval: function(id) {
                return this._hk.window.clearInterval(id);
            },

            //
            // Signals/properties

            _addSignal: function(name) {
                this[name] = signal(name);
            }
        
        }
    
    ];

});

Widget.registerMixin = function(name, obj) {
    if (name in Mixins) {
        throw new Error("duplicate mixin: " + name);
    }
    Mixins[name] = obj;
}

Widget.Features.mixins = function(ctor, mixinList) {
    mixinList.forEach(function(m) {
        var mixin = Mixins[m];
        if (!mixin) {
            throw new Error("unknown mixin: " + m);
        }
        for (var k in mixin) {
            ctor.prototype[k] = mixin[k];
        }
    });
}

//
// Default mixins

/*
 * ValueWidget mixin denotes any widget that represents a value.
 * This mixin requires that the implementing widget have the following:
 *
 *   _value => the widget's current value
 *   onChange => a signal for broadcasting requested changes
 * 
 * Additionally, the private _setValue() function may be overridden to
 * apply custom transform/display update logic. This should return true
 * if the value did in fact change.
 *
 * The onChange signal should only be emitted in response to user
 * interaction with the widget, and not in response to external requests
 * to change the widget's displayed value.
 */
Widget.registerMixin('ValueWidget', {
    getValue: function() {
        return this._value;
    },

    setValue: function(value) {
        return this._setValue(value);
    },

    _setValue: function(v) {
        this._value = v;
        // we'll just assume the value has changed here; best not to
        // assume that values can be compared with == or ===.
        return true;
    },

    _broadcastChange: function() {
        this.onChange.emit(this, this.getValue());
    }
});

Widget.registerMixin('ValueRange', {
    getMinValue: function() {
        return this._minValue;
    },

    getMaxValue: function() {
        return this._maxValue;
    },

    setMinValue: function(min) {
        if (min === this._minValue) {
            return;
        }

        this._minValue = min;
        if (this._value < min) {
            this._value = min;
        }
            
        this._update();
    },

    setMaxValue: function(max) {
        if (max === this._maxValue) {
            return;
        }
            
        this._maxValue = max;
        if (this._value > max) {
            this._value = max;
        }
            
        this._update();
    }
});

ctx.registerCSS(".hk-widget {\n\toverflow: hidden;\n\tbox-sizing: border-box;\n\t-moz-box-sizing: border-box;\n}\n");
ctx.registerWidget('Widget', Widget);
},{"../constants":28,"../core":29,"../theme":31,"classkit":32,"domutil":35,"signalkit":38}],28:[function(require,module,exports){
module.exports = {};
},{}],29:[function(require,module,exports){
var registry				= require('./registry'),
	theme 					= require('./theme'),
	constants 				= require('./constants'),
	Instance 				= require('./Instance');

exports.theme 				= theme;
exports.k 					= constants;

exports.defineConstant 		= defineConstant;
exports.defineConstants		= defineConstants;
exports.getWidget 			= getWidget;
exports.registerWidget		= registerWidget;
exports.registerInitializer	= registerInitializer;
exports.registerCSS 		= registerCSS;
exports.instance 			= instance;
exports.init 				= init;

function defineConstant(name, value) {
	Object.defineProperty(constants, name, {
		enumerable	: true,
		writable	: false,
		value		: value
	});
}

function defineConstants(ks) {
	for (var k in ks) {
		defineConstant(k, ks[k]);
	}
}

function getWidget(name) {

	if (!(name in registry.widgets)) {
		throw new Error("unknown widget type: " + name);
	}

	return registry.widgets[name];

}

function registerWidget(name, ctor) {
	
	if (name in registry.widgets) {
		throw new Error("duplicate widget type: " + name);
	}

	if (name in exports) {
		throw new Error("widget name '" + name + "' clashes with hudkit exports");
	}

	registry.widgets[name] = exports[name] = ctor;

	var method = name[0].toLowerCase() + name.substring(1);

	Instance.prototype[method] = function(a, b, c, d, e, f, g, h) {
	    switch (arguments.length) {
	        case 0: return new ctor(this);
	        case 1: return new ctor(this, a);
	        case 2: return new ctor(this, a, b);
	        case 3: return new ctor(this, a, b, c);
	        case 4: return new ctor(this, a, b, c, d);
	        case 5: return new ctor(this, a, b, c, d, e);
	        case 6: return new ctor(this, a, b, c, d, e, f);
	        case 7: return new ctor(this, a, b, c, d, e, f, g);
	        case 8: return new ctor(this, a, b, c, d, e, f, g, h);
	        default: throw new Error("too many ctor arguments. sorry :(");
	    }
	}

}

function registerInitializer(cb) {
	registry.initializers.push(cb);
}

function registerCSS(css) {
	registerInitializer(function(instance) {
		instance.appendCSS(css);
	});
}

function instance(doc) {
	return new Instance(doc);
}

function init() {
	// no-op, backwards compatibility only
}
},{"./Instance":14,"./constants":28,"./registry":30,"./theme":31}],30:[function(require,module,exports){
exports.widgets 		= {};
exports.initializers	= [];
},{}],31:[function(require,module,exports){
// TODO: this is eventually to be handled by Unwise,
// with live updating when themes change.

var theme = {
    'HK_MONOSPACE_FONT'             : 'Menlo, Monaco, "Liberation Mono", monospace',
    'HK_TEXT_COLOR'                 : '#121729',

    'HK_CONTROL_FONT'               : 'Helvetica, sans-serif',
    'HK_CONTROL_FONT_SIZE'          : '10px',
    'HK_CONTROL_BORDER_COLOR'       : '#455366',
    'HK_CONTROL_ACTIVE_BG_COLOR'    : '#EAF20F',
    
    'HK_BUTTON_BG_COLOR'            : '#929DA8',

    'HK_ROOT_BG_COLOR'              : '#181E23',

    'HK_CONSOLE_FONT_SIZE'          : '13px',

    'HK_SPLIT_PANE_DIVIDER_SIZE'    : '8px',
    
    'HK_TAB_SPACING'                : '7px',
    'HK_TAB_PADDING'                : '7px',

    // control font size + 2 * tab padding
    'HK_TAB_HEIGHT'                 : '24px',
    'HK_TAB_BORDER_RADIUS'          : '5px',
    'HK_TAB_BACKGROUND_COLOR'       : '#67748C',

    // $HK_TAB_HEIGHT + $HK_TAB_SPACING
    'HK_TAB_CONTAINER_TOP'          : '31px',

    'HK_BLOCK_BORDER_RADIUS'        : '10px',

    'HK_TOOLBAR_ITEM_BORDER_COLOR'  : '#A6B5BB',

    'HK_TOOLBAR_V_PADDING'          : '3px',

    'HK_TOOLBAR_MARGIN_TOP'         : '8px',
    'HK_TOOLBAR_MARGIN_RIGHT'       : '8px',
    'HK_TOOLBAR_MARGIN_BOTTOM'      : '8px',
    'HK_TOOLBAR_MARGIN_LEFT'        : '8px',

    // Unused currently...
    'HK_DIALOG_PADDING'             : '6px',
    'HK_DIALOG_BORDER_RADIUS'       : '6px',
    'HK_DIALOG_HEADER_HEIGHT'       : '24px',
    'HK_DIALOG_TRANSITION_DURATION' : '200'
};

module.exports = {
    get: function(k) {
        return theme[k];
    },
    getInt: function(k) {
        return parseInt(theme[k], 10);
    }
};

},{}],32:[function(require,module,exports){
function Class() {};
  
Class.prototype.method = function(name) {
  var self = this, method = this[name];
  return function() { return method.apply(self, arguments); }
}

Class.prototype.lateBoundMethod = function(name) {
  var self = this;
  return function() { return self[name].apply(self, arguments); }
}

Class.extend = function(fn) {

  var features = fn ? fn(this, this.prototype) : [function() {}];
  
  var ctor = features[0];
  ctor.prototype = Object.create(this.prototype);
  
  ctor.extend = this.extend;
  ctor.Features = Object.create(this.Features);
    
  for (var i = 1; i < features.length; i += 2) {
    this.Features[features[i]](ctor, features[i+1]);
  }
  
  return ctor;
  
};

Class.Features = {
  methods: function(ctor, methods) {
    for (var methodName in methods) {
      ctor.prototype[methodName] = methods[methodName];
    }
  },
  properties: function(ctor, properties) {
    Object.defineProperties(ctor.prototype, properties);
  }
};

exports.Class = Class;

},{}],33:[function(require,module,exports){
exports.hasClass = hasClass;
exports.addClass = addClass;
exports.removeClass = removeClass;
exports.toggleClass = toggleClass;

function hasClass(el, className) {
    return el.classList.contains(className);
}

function addClass(el, classes) {
    if (classes.indexOf(' ') >= 0) {
        classes.split(/\s+/).forEach(function(c) {
            el.classList.add(c);
        });
    } else {
        el.classList.add(classes);
    }
}

function removeClass(el, classes) {
    if (classes.indexOf(' ') >= 0) {
        classes.split(/\s+/).forEach(function(c) {
            el.classList.remove(c);
        });
    } else {
        el.classList.remove(classes);
    }
}

function toggleClass(el, classes) {
    if (classes.indexOf(' ') >= 0) {
        classes.split(/\s+/).forEach(function(c) {
            el.classList.toggle(c);
        });
    } else {
        el.classList.toggle(classes);
    }
}
},{}],34:[function(require,module,exports){
exports.hasClass = hasClass;
exports.addClass = addClass;
exports.removeClass = removeClass;
exports.toggleClass = toggleClass;

// Constants from jQuery
var rclass = /[\t\r\n]/g;
var core_rnotwhite = /\S+/g;

// from jQuery
function hasClass(ele, className) {
    className = " " + className + " ";
    return (" " + ele.className + " ").replace(rclass, " ").indexOf(className) >= 0;
}

function addClass(ele, value) {
    var classes = (value || "").match(core_rnotwhite) || [],
            cur = ele.className ? (" " + ele.className + " ").replace(rclass, " ") : " ";

    if (cur) {
        var j = 0, clazz;
        while ((clazz = classes[j++])) {
            if (cur.indexOf(" " + clazz + " ") < 0) {
                cur += clazz + " ";
            }
        }
        ele.className = cur.trim();
    }
}

function removeClass(ele, value) {
    var classes = (value || "").match(core_rnotwhite) || [],
            cur = ele.className ? (" " + ele.className + " ").replace(rclass, " ") : " ";

    if (cur) {
        var j = 0, clazz;
        while ((clazz = classes[j++])) {
            while (cur.indexOf(" " + clazz + " ") >= 0) {
                cur = cur.replace(" " + clazz + " ", " ");
            }
            ele.className = value ? cur.trim() : "";
        }
    }
}

function toggleClass(ele, value) {
    var classes = (value || "").match(core_rnotwhite) || [],
            cur = ele.className ? (" " + ele.className + " ").replace(rclass, " ") : " ";

    if (cur) {
        var j = 0, clazz;
        while ((clazz = classes[j++])) {
            var removeCount = 0;
            while (cur.indexOf(" " + clazz + " ") >= 0) {
                cur = cur.replace(" " + clazz + " ", " ");
                removeCount++;
            }
            if (removeCount === 0) {
                cur += clazz + " ";
            }
            ele.className = cur.trim();
        }
    }
}
},{}],35:[function(require,module,exports){
var clazz;

if (typeof DOMTokenList !== 'undefined') {
    clazz = require('./impl/classes-classlist.js');
} else {
    clazz = require('./impl/classes-string.js');
}

module.exports = {
    hasClass: clazz.hasClass,
    addClass: clazz.addClass,
    removeClass: clazz.removeClass,
    toggleClass: clazz.toggleClass,

    viewportSize: function(doc) {
        return {
            width: doc.documentElement.clientWidth,
            height: doc.documentElement.clientHeight
        };
    },

    stop: function(evt) {
        evt.preventDefault();
        evt.stopPropagation();
    },

    setPosition: function(el, x, y) {
        el.style.left = x + 'px';
        el.style.top = y + 'px';
    },

    setSize: function(width, height) {
        el.style.width = width + 'px';
        el.style.height = height + 'px';
    },

    isElement: function(el) {
        return el && el.nodeType === 1;
    }
};
},{"./impl/classes-classlist.js":33,"./impl/classes-string.js":34}],36:[function(require,module,exports){
var signal = require('signalkit');

var ActionProto = Object.create(Function.prototype);

ActionProto.getTitle = function() { return this._title; };
ActionProto.setTitle = function(t) { this._title = ('' + t); this.onchange.emit(); };

ActionProto.isEnabled = function() { return this._enabled; };
ActionProto.toggleEnabled = function() { this.setEnabled(!this._enabled); };
ActionProto.enable = function() { this.setEnabled(true); };
ActionProto.disable = function() { this.setEnabled(false); };

ActionProto.setEnabled = function(en) {
    en = !!en;
    if (en != this._enabled) {
        this._enabled = en;
        this.onchange.emit();
    }
}

module.exports = function(fn, opts) {

    var actionFun = function() {
        if (actionFun._enabled) {
            return fn.apply(null, arguments);
        }
    }

    opts = opts || {};

    actionFun._title    = ('title' in opts) ? ('' + opts.title) : '';
    actionFun._enabled  = ('enabled' in opts) ? (!!opts.enabled) : true;
    actionFun.onchange  = signal('onchange');
    actionFun.__proto__ = ActionProto;

    return actionFun;

}

},{"signalkit":38}],37:[function(require,module,exports){
var activeCaptures = [];

function createOverlay(doc) {
    var overlay = doc.createElement('div');
    overlay.className = 'rattrap-overlay';
    overlay.unselectable = 'on';
    overlay.style.position = 'fixed';
    overlay.style.top = 0;
    overlay.style.left = 0;
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.webkitUserSelect = 'none';
    overlay.style.mozUserSelect = 'none';
    overlay.style.msUserSelect = 'none';
    return overlay;
}

function makeCaptureHandler(fn) {
    return function(evt) {
        evt.stopPropagation();
        evt.preventDefault();
        fn(evt);
    }
}

exports.startCapture = function(doc, events) {

    if (typeof events === 'undefined') {
        events = doc;
        doc = document;
    }

    if (activeCaptures.indexOf(doc) >= 0) {
        throw "cannot capture events, capture is already in progress";
    }

    var overlay = createOverlay(doc);
    doc.body.appendChild(overlay);
    activeCaptures.push(overlay);

    for (var k in events) {
        if (k === 'cursor') {
            overlay.style.cursor = events[k];
        } else {
            overlay.addEventListener(k, makeCaptureHandler(events[k]));
        }
    }

    return function() {
        doc.body.removeChild(overlay);
        activeCaptures.splice(activeCaptures.indexOf(overlay), 1);
        doc = null;
        overlay = null;
    }

}

},{}],38:[function(require,module,exports){
(function (process){//
// Helpers

if (typeof process !== 'undefined') {
    var nextTick = process.nextTick;
} else {
    var nextTick = function(fn) { setTimeout(fn, 0); }
}

function makeUnsubscriber(listeners, handlerFn) {
    var cancelled = false;
    return function() {
        if (cancelled) return;
        for (var i = listeners.length - 1; i >= 0; --i) {
            if (listeners[i] === handlerFn) {
                listeners.splice(i, 1);
                cancelled = true;
                break;
            }
        }
    }
}

//
// Signals

function Signal(name) {
    this.name = name;
    this._listeners = [];
}

Signal.prototype.onError = function(err) {
    nextTick(function() { throw err; });
}

Signal.prototype.emit = function() {
    for (var ls = this._listeners, i = ls.length - 1; i >= 0; --i) {
        try {
            ls[i].apply(null, arguments);
        } catch (err) {
            if (this.onError(err) === false) {
                break;
            }
        }
    }
}

Signal.prototype.connect = function(target, action) {
    if (target && action) {
        var handler = function() {
            target[action].apply(target, arguments);
        }
    } else if (typeof target === 'function') {
        var handler = target;
    } else {
        throw "signal connect expects either handler function or target/action pair";
    }
    this._listeners.push(handler);
    return makeUnsubscriber(this._listeners, handler);
}

Signal.prototype.once = function(target, action) {
    var cancel = this.connect(function() {
        if (target && action) {
            target[action].apply(target, arguments);
        } else if (typeof target === 'function') {
            target.apply(null, arguments);
        } else {
            throw "signal connect expects either handler function or target/action pair";
        }
        cancel();
    });
    return cancel;
}

Signal.prototype.clear = function() {
    this._listeners = [];
}

//
// Exports

module.exports = function(name) { return new Signal(name); }
module.exports.Signal = Signal;}).call(this,require("/usr/local/lib/node_modules/watchify/node_modules/browserify/node_modules/insert-module-globals/node_modules/process/browser.js"))
},{"/usr/local/lib/node_modules/watchify/node_modules/browserify/node_modules/insert-module-globals/node_modules/process/browser.js":42}],39:[function(require,module,exports){
// adapted from
// http://stackoverflow.com/questions/524696/how-to-create-a-style-tag-with-javascript
module.exports = function(doc, initialCss) {
    
    if (typeof doc === 'string') {
        initialCss = doc;
        doc = null;
    }

    doc = doc || document;

    var head    = doc.getElementsByTagName('head')[0],
        style   = doc.createElement('style');

    style.type = 'text/css';
    head.appendChild(style);

    function set(css) {
        css = '' + (css || '');
        if (style.styleSheet) {
            style.styleSheet.cssText = css;
        } else {
            while (style.childNodes.length) {
                style.removeChild(style.firstChild);
            }
            style.appendChild(doc.createTextNode(css));
        }
    }

    set(initialCss || '');

    set.el = style;
    set.destroy = function() {
        head.removeChild(style);
    }

    return set;

}
},{}],40:[function(require,module,exports){
// [a] => [a,a,a,a]
// [a,b] => [a,b,a,b]
// [a,b,c] => [a,b,c,b]
// [a,b,c,d] => [a,b,c,d]
// a => [(int)a, (int)a, (int)a, (int)a]
module.exports = function(thing) {
    if (Array.isArray(thing)) {
        switch (thing.length) {
            case 1:
                return [
                    parseInt(thing[0], 10),
                    parseInt(thing[0], 10),
                    parseInt(thing[0], 10),
                    parseInt(thing[0], 10)
                ];
            case 2:
                return [
                    parseInt(thing[0], 10),
                    parseInt(thing[1], 10),
                    parseInt(thing[0], 10),
                    parseInt(thing[1], 10)
                ];
            case 3:
                return [
                    parseInt(thing[0], 10),
                    parseInt(thing[1], 10),
                    parseInt(thing[2], 10),
                    parseInt(thing[1], 10)
                ];
            case 4:
                return [
                    parseInt(thing[0], 10),
                    parseInt(thing[1], 10),
                    parseInt(thing[2], 10),
                    parseInt(thing[3], 10)
                ];
            default:
                throw new Error("trbl - array must have 1-4 elements");
        }
    } else {
        var val = parseInt(thing);
        return [val, val, val, val];
    }
}
},{}],41:[function(require,module,exports){

},{}],42:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    if (canPost) {
        var queue = [];
        window.addEventListener('message', function (ev) {
            var source = ev.source;
            if ((source === window || source === null) && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('process-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

process.binding = function (name) {
    throw new Error('process.binding is not supported');
}

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};

},{}]},{},[1])