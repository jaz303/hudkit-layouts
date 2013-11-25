;(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
window.hk = require('hudkit');
window.hl = require('../');
},{"../":2,"hudkit":3}],2:[function(require,module,exports){
function box(hk) {
    var box = new hk.Box();
    box.setBackgroundColor('#404040');
    return box;
}

function create(hk, thing) {
    if (typeof thing === 'string') {
        return new hk[thing]();
    } else if (typeof thing === 'function') {
        return thing(hk);
    } else {
        throw new Error("can't create widget; I don't know what to do with this: " + thing);
    }
}

function s2(hk, orientation, options) {

    options = options || {};

    var layout = {
        split: new hk.SplitPane()
    };

    layout.split.setOrientation(orientation);
    layout.split.setSplit('split' in options ? options.split : 0.5);

    if (orientation === hk.SPLIT_PANE_VERTICAL) {
        layout.left = create(hk, options.left || box);
        layout.right = create(hk, options.right || box);
        layout.split.setTopWidget(layout.left);
        layout.split.setBottomWidget(layout.right);
    } else {
        layout.top = create(hk, options.top || box);
        layout.bottom = create(hk, options.bottom || box);
        layout.split.setTopWidget(layout.top);
        layout.split.setBottomWidget(layout.bottom);
    }

    hk.root.setRootWidget(layout.split);

    return layout;

}

// vertical split with two panes
exports.v2 = function(hk, options) {
    return s2(hk, hk.SPLIT_PANE_VERTICAL, options);
}

// horizontal split with two panes
exports.h2 = function(hk, options) {
    return s2(hk, hk.SPLIT_PANE_HORIZONTAL, options);
}

// horizontal split, canvas at top, console at bottom
exports.canvasAndConsole = function(hk, options) {
    var layout = exports.h2(hk, {
        top: 'Canvas2D',
        bottom: 'Console',
        split: 0.7
    });
    layout.canvas = layout.top;
    layout.console = layout.bottom;
    return layout;
}

// horizontal split, canvas at top, tab bar at bottom.
// tabs can be passed via options.tabs
exports.canvasAndTabs = function(hk, options) {

}

},{}],3:[function(require,module,exports){
var RootPane    = require('./lib/RootPane');

var rootPane    = null,
    rootEl      = null;

function init() {

    rootPane = exports.root = new RootPane();
    rootEl = document.body;
    rootEl.className = 'hk';
    rootEl.appendChild(rootPane.getRoot());

    return rootPane;

}

exports.init            = init;
exports.root            = null;
exports.action          = require('./lib/action');

exports.Widget          = require('./lib/Widget');
exports.Box             = require('./lib/Box');
exports.RootPane        = require('./lib/RootPane');
exports.SplitPane       = require('./lib/SplitPane');
exports.CodeEditor      = require('./lib/CodeEditor');
exports.Console         = require('./lib/Console');
exports.Canvas2D        = require('./lib/Canvas2D');
exports.TabPane         = require('./lib/TabPane');
exports.Toolbar         = require('./lib/Toolbar');
exports.Container       = require('./lib/Container');
exports.Panel           = require('./lib/Panel');
exports.Button          = require('./lib/Button');
exports.ButtonBar       = require('./lib/ButtonBar');
// exports.TreeView        = require('./lib/TreeView');
exports.StatusBar       = require('./lib/StatusBar');
exports.MultiSplitPane  = require('./lib/MultiSplitPane');

var constants = require('./lib/constants');
Object.keys(constants).forEach(function(k) {
    exports[k] = constants[k];
});

},{"./lib/Box":4,"./lib/Button":5,"./lib/ButtonBar":6,"./lib/Canvas2D":7,"./lib/CodeEditor":8,"./lib/Console":9,"./lib/Container":10,"./lib/MultiSplitPane":11,"./lib/Panel":12,"./lib/RootPane":13,"./lib/SplitPane":14,"./lib/StatusBar":15,"./lib/TabPane":16,"./lib/Toolbar":17,"./lib/Widget":18,"./lib/action":19,"./lib/constants":20}],4:[function(require,module,exports){
var Widget = require('./Widget');

module.exports = Widget.extend(function(_sc, _sm) {

    return [

        function() {
            _sc.apply(this, arguments);
            this.setBackgroundColor('white');
        },

        'methods', {
            setBackgroundColor: function(color) {
                this._root.style.backgroundColor = color;
            },
            _buildStructure: function() {
                this._root = document.createElement('div');
                this._root.className = 'hk-box';
            }
        }

    ]

});
},{"./Widget":18}],5:[function(require,module,exports){
var Widget = require('./Widget');

var du = require('domutil');

module.exports = Widget.extend(function(_sc, _sm) {

    return [

        function() {
            
            this._action = null;
            _sc.apply(this, arguments);

            var self = this;
            this._root.addEventListener('click', function(evt) {
                
                evt.preventDefault();
                evt.stopPropagation();
                
                if (self._action)
                    self._action(self);
            
            });

        },

        'methods', {

            dispose: function() {
                this.setAction(null);
                _sm.dispose.call(this);
            },

            getAction: function() {
                return this._action;
            },

            setAction: function(action) {

                if (action === this._action)
                    return;

                if (this._action) {
                    this._actionUnbind();
                    this._action = null;
                }

                if (action) {
                    this._action = action;
                    this._actionUnbind = this._action.onchange.connect(this._sync.bind(this));
                }

            },
            
            _buildStructure: function() {
                
                this._root = document.createElement('a');
                this._root.href = '#';
                this._root.className = 'hk-button';
            
                this._text = document.createElement('span');

                this._root.appendChild(this._text);

            },

            _sync: function() {

                var title   = "",
                    enabled = true;

                if (this._action) {
                    title = this._action.getTitle();
                    enabled = this._action.isEnabled();
                }

                this._text.textContent = title;
                if (enabled) {
                    du.removeClass(this._root, 'disabled');
                } else {
                    du.addClass(this._root, 'disabled');
                }

            }
        
        }

    ]

});
},{"./Widget":18,"domutil":25}],6:[function(require,module,exports){
var Widget  = require('./Widget'),
    k       = require('./constants');

module.exports = Widget.extend(function(_sc, _sm) {

    return [

        function() {
            _sc.apply(this, arguments);
            this._buttons = [];
        },

        'methods', {
            addButton: function(button) {
                button._setPositionMode(k.POSITION_MODE_AUTO);
                this._attachChildViaElement(button, this._root);
                this._buttons.push(button);
                return this;
            },
            
            _buildStructure: function() {
                this._root = document.createElement('div');
                this._root.className = 'hk-button-bar';
            }
        }

    ]

});
},{"./Widget":18,"./constants":20}],7:[function(require,module,exports){
var Widget = require('./Widget');

module.exports = Widget.extend(function(_sc, _sm) {

    return [

        function() {
            _sc.apply(this, arguments);
        },

        'methods', {
            getContext: function() { return this._context; },
            getCanvas: function() { return this._root; },

            _applySize: function() {
                this._root.width = this.width;
                this._root.height = this.height;
            },
            
            _buildStructure: function() {
                this._root = document.createElement('canvas');
                this._root.setAttribute('tabindex', 0);
                this._root.className = 'hk-canvas hk-canvas-2d';
                this._context = this._root.getContext('2d');
            }
        }

    ]

});
},{"./Widget":18}],8:[function(require,module,exports){
var Widget = require('./Widget');

module.exports = Widget.extend(function(_sc, _sm) {

    return [

        function() {

            this._changeTimeout = 750;
            this._changeTimeoutId = null;
            this._muted = false;

            // TODO: signal
            
            _sc.apply(this, arguments);
            
            this._setupHandlers();
        
        },

        'methods', {
            dispose: function() {
                clearTimeout(this._changeTimeoutId);
                // TODO: teardown ACE editor
                _sm.dispose.call(this);
            },
            
            setChangeTimeout: function(timeout) {
                this._changeTimeout = timeout;
            },
            
            muteChangeEvents: function() {
                this._muted = true;
            },
            
            unmuteChangeEvents: function() {
                this._muted = false;
            },
            
            getValue: function() {
                return this._editor.getValue();
            },
            
            setValue: function(newValue) {
                this._editor.setValue(newValue, 1);
            },
            
            getEditor: function() {
                return this._editor;
            },
            
            _buildStructure: function() {
                
                this._root = document.createElement('div');
                this._root.className = 'hk-code-editor';
                
                this._editRoot = document.createElement('div');
                this._editRoot.style.position = 'absolute';
                this._editRoot.style.top = '5px';
                this._editRoot.style.left = '5px';
                this._editRoot.style.bottom = '5px';
                this._editRoot.style.right = '5px';
                this._root.appendChild(this._editRoot);
                
                this._editor = window.ace.edit(this._editRoot);
                this._editor.setTheme("ace/theme/cobalt");
                this._editor.getSession().setMode("ace/mode/javascript");

                var session = this._editor.getSession();
                // session.setUseWorker(false);

            },
            
            _setupHandlers: function() {
                var self = this;
                
                this._editor.on('change', function() {
                    
                    clearTimeout(self._changeTimeoutId);
                    
                    if (self._muted)
                        return;
                    
                    self._changeTimeoutId = setTimeout(function() {
                        if (self._muted)
                            return;
                        // self.contentChanged.emit();
                    }, self._changeTimeout);
                
                });
            },
            
            _applyBounds: function() {
                _sm._applyBounds.apply(this, arguments);
                if (this._editor) {
                    this._editor.resize();
                }
            }
        }

    ]

});
},{"./Widget":18}],9:[function(require,module,exports){
var du = require('domutil');

var Widget = require('./Widget');

var DEFAULT_PROMPT = {text: '>'},
    HISTORY_LENGTH = 500;

module.exports = Widget.extend(function(_sc, _sm) {

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
                var ele = document.createElement('div');
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
            
            setObjectFormatter: function(formatter) { this._formatter = formatter; },
            
            /**
             * Set the evaluator function.
             * The evaluator function will be passed 2 arguments - the command to be
             * evaluated, and the terminal object.
             *
             * @param evaluator
             */
            setEvaluator: function(evaluator) { this._evaluator = evaluator; },
            
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
            
            echoOn: function() { this.setEcho(true); },
            echoOff: function() { this.setEcho(false); },
            setEcho: function(echo) { this._echo = !!echo; },
            
            // terminal is not ready for input; command line is hidden.
            notReady: function() { this._input.style.display = 'none'; },
            
            // terminal is ready for input; command line is shown.
            ready: function() { this._input.style.display = '-webkit-box'; },
            
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
                var ele = document.createElement('div');
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
                var line = document.createElement('div');
                line.className = 'input-line';
                
                var prompt = document.createElement('span');
                prompt.className = this._prompt.className;
                prompt.style.color = this._prompt.style.color;
                prompt.textContent = this._prompt.textContent;
                
                var cmd = document.createElement('span');
                cmd.className = 'command';
                cmd.textContent = this._getCommand();
                
                line.appendChild(prompt);
                line.appendChild(cmd);
                
                this._appendOutputElement(line);
            },
            
            _buildStructure: function() {
                
                var self = this;
                
                var root        = document.createElement('div'),
                    output      = document.createElement('output'),
                    line        = document.createElement('div'),
                    prompt      = document.createElement('span'),
                    cmdWrapper  = document.createElement('span'),
                    cmd         = document.createElement('input');
                        
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

    ]

});
},{"./Widget":18,"domutil":25}],10:[function(require,module,exports){
var Widget = require('./Widget');

module.exports = Widget.extend(function(_sc, _sm) {

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

});
},{"./Widget":18}],11:[function(require,module,exports){
var Widget  = require('./widget');
var util    = require('./util');
var theme   = require('./theme');
var k       = require('./constants');

var du      = require('domutil');
var rattrap = require('rattrap');
var signal  = require('signalkit');

var DIVIDER_SIZE = theme.SPLIT_PANE_DIVIDER_SIZE;

module.exports = Widget.extend(function(_sc, _sm) {

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

            addSplit: function(ratio, widget) {

                if (ratio < 0 || ratio > 1) {
                    throw new Error("ratio must be between 0 and 1");
                }

                var div = document.createElement('div');
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
                
                this._root = document.createElement('div');
                this._root.className = 'hk-split-pane';
                
                this._ghost = document.createElement('div');
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

                        rattrap.startCapture({
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
                                rattrap.stopCapture();
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
    
    ]

});
},{"./constants":20,"./theme":21,"./util":22,"./widget":23,"domutil":25,"rattrap":26,"signalkit":27}],12:[function(require,module,exports){
var Container = require('./Container');

module.exports = Container.extend(function(_sc, _sm) {

    return [

        function() {
            _sc.apply(this, arguments);
        },

        'methods', {
            _buildStructure: function() {
                this._root = document.createElement('div');
                this._root.className = 'hk-panel';
            }
        }

    ]

});
},{"./Container":10}],13:[function(require,module,exports){
var Widget = require('./widget');
var util   = require('./util');
var theme  = require('./theme');

var DEFAULT_PADDING = 8;

module.exports = Widget.extend(function(_sc, _sm) {

    return [

        function() {

            this._padding           = [DEFAULT_PADDING, DEFAULT_PADDING, DEFAULT_PADDING, DEFAULT_PADDING];
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
                this._padding = util.parseTRBL(padding);
                this._layout();
            },

            setBackgroundColor: function(color) {
                this._root.style.backgroundColor = color;
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
                this._root = document.createElement('div');
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
                                            theme.TOOLBAR_HEIGHT);
                    
                    var delta = theme.TOOLBAR_HEIGHT + theme.TOOLBAR_MARGIN_BOTTOM;
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

                var self = this,
                    timeout = null;

                window.addEventListener('resize', function() {
                    if (self._resizeDelay <= 0) {
                        self._layout();    
                    } else {
                        if (timeout) clearTimeout(timeout);
                        timeout = setTimeout(function() { self._layout(); }, self._resizeDelay);
                    }
                });

            }

        }

    ];

});
},{"./theme":21,"./util":22,"./widget":23}],14:[function(require,module,exports){
var Widget  = require('./widget');
var util    = require('./util');
var theme   = require('./theme');
var k       = require('./constants');

var du      = require('domutil');
var rattrap = require('rattrap');

var DIVIDER_SIZE = theme.SPLIT_PANE_DIVIDER_SIZE;

module.exports = Widget.extend(function(_sc, _sm) {

    return [

        function() {

            this._widgets       = [null, null];
            this._hiddenWidgets = [false, false];
            this._split         = 0.5;
            this._orientation   = k.SPLIT_PANE_HORIZONTAL;
            
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
                du.addClass(this._root, this._orientation == k.SPLIT_PANE_HORIZONTAL ? 'horizontal' : 'vertical');
                
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
                
                this._root = document.createElement('div');
                this._root.className = 'hk-split-pane';
                
                this._divider = document.createElement('div');
                this._divider.className = 'hk-split-pane-divider';
                
                this._ghost = document.createElement('div');
                this._ghost.className = 'hk-split-pane-divider hk-split-pane-ghost';
                
                this._root.appendChild(this._divider);
                
                du.addClass(this._root, this._orientation == k.SPLIT_PANE_HORIZONTAL ? 'horizontal' : 'vertical');
            
            },
            
            _layout: function() {

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

                if (this._orientation === k.SPLIT_PANE_HORIZONTAL) {
                    
                    var divt  = Math.floor(this._split * (this.height - DIVIDER_SIZE)),
                        w2t   = divt + DIVIDER_SIZE,
                        w2h   = this.height - w2t;
                    
                    this._divider.style.left = '';
                    this._divider.style.top = divt + 'px';
                    
                    if (ws[0]) ws[0].setBounds(0, 0, this.width, divt);
                    if (ws[1]) ws[1].setBounds(0, w2t, this.width, w2h);
                
                } else if (this._orientation === k.SPLIT_PANE_VERTICAL) {
                    
                    var divl  = Math.floor(this._split * (this.width - DIVIDER_SIZE)),
                        w2l   = divl + DIVIDER_SIZE,
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
                    
                    var rootPos         = self._root.getBoundingClientRect(),
                        offsetX         = evt.offsetX,
                        offsetY         = evt.offsetY,
                        lastValidSplit  = self._split;
                    
                    function moveGhost() {
                        if (self._orientation === k.SPLIT_PANE_VERTICAL) {
                            self._ghost.style.left = Math.floor(lastValidSplit * (rootPos.width - DIVIDER_SIZE)) + 'px';
                            self._ghost.style.top = '';
                        } else if (self._orientation === k.SPLIT_PANE_HORIZONTAL) {
                            self._ghost.style.left = '';
                            self._ghost.style.top = Math.floor(lastValidSplit * (rootPos.height - DIVIDER_SIZE)) + 'px';
                        }
                    }
                            
                    self._root.appendChild(self._ghost);
                    moveGhost();
                    
                    rattrap.startCapture({
                        cursor: (self._orientation === k.SPLIT_PANE_VERTICAL) ? 'col-resize' : 'row-resize',
                        mousemove: function(evt) {
                            if (self._orientation === k.SPLIT_PANE_VERTICAL) {
                                var left    = evt.pageX - offsetX,
                                    leftMin = (rootPos.left),
                                    leftMax = (rootPos.right - DIVIDER_SIZE);
                                if (left < leftMin) left = leftMin;
                                if (left > leftMax) left = leftMax;
                                
                                lastValidSplit = (left - leftMin) / (rootPos.width - DIVIDER_SIZE);
                                moveGhost();
                            } else {
                                var top     = evt.pageY - offsetY,
                                    topMin  = (rootPos.top),
                                    topMax  = (rootPos.bottom - DIVIDER_SIZE);
                                if (top < topMin) top = topMin;
                                if (top > topMax) top = topMax;
                                
                                lastValidSplit = (top - topMin) / (rootPos.height - DIVIDER_SIZE);
                                moveGhost();
                            }
                        },
                        mouseup: function() {
                            rattrap.stopCapture();
                            self._root.removeChild(self._ghost);
                            self.setSplit(lastValidSplit);
                        }
                    });
                    
                });
            
            }
        
        }
    
    ]

});
},{"./constants":20,"./theme":21,"./util":22,"./widget":23,"domutil":25,"rattrap":26}],15:[function(require,module,exports){
var Widget = require('./Widget');

function TextCell() {
    this.el = document.createElement('div');
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

module.exports = Widget.extend(function(_sc, _sm) {

    return [

        function() {
            _sc.apply(this, arguments);

            this._leftCells = [];
            this._rightCells = [];
        },

        'methods', {
            _buildStructure: function() {
                
                this._root = document.createElement('div');
                this._root.className = 'hk-status-bar';
            
                this._left = document.createElement('div');
                this._left.className = 'left-cells';
                this._root.appendChild(this._left);

                this._right = document.createElement('div');
                this._right.className = 'right-cells';
                this._root.appendChild(this._right);

            },

            addTextCell: function(position, text) {

                var cell = new TextCell();
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

    ]

});
},{"./Widget":18}],16:[function(require,module,exports){
var Widget  = require('./Widget'),
    theme   = require('./theme');

var du      = require('domutil');

module.exports = Widget.extend(function(_sc, _sm) {

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
                
                var tab = document.createElement('a');
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
                
                this._root = document.createElement('div');
                this._root.className = 'hk-tab-pane';
                
                this._tabBar = document.createElement('nav');
                this._tabBar.className = 'hk-tab-bar';
                
                this._tabContainer = document.createElement('div');
                this._tabContainer.className = 'hk-tab-container';
                
                this._canvas = document.createElement('canvas');
                this._canvas.className = 'hk-tab-canvas';
                this._canvas.height = theme.TAB_SPACING * 2;
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
                
                this._tabs.forEach(function(tab, i) {
                    tab.pane.setBounds(theme.TAB_SPACING,
                                       theme.TAB_SPACING,
                                       self.width - (2 * theme.TAB_SPACING),
                                       self.height - (3 * theme.TAB_SPACING + theme.TAB_HEIGHT));
                                                         
                    if (tab.active) {
                        var width       = tab.ele.offsetWidth,
                                height  = tab.ele.offsetHeight,
                                left    = tab.ele.offsetLeft,
                                top     = tab.ele.offsetTop,
                                ctx     = self._ctx;

                        width += theme.TAB_BORDER_RADIUS;

                        if (i > 0) {
                            left -= theme.TAB_BORDER_RADIUS;
                            width += theme.TAB_BORDER_RADIUS;
                        }

                        self._canvas.style.left = '' + left + 'px';
                        self._canvas.style.top = '' + (top + height) + 'px';
                        self._canvas.width = width;
                        
                        ctx.fillStyle = theme.TAB_BACKGROUND_COLOR;

                        var arcY = theme.TAB_SPACING - theme.TAB_BORDER_RADIUS;

                        if (i == 0) {
                            ctx.fillRect(0, 0, width - theme.TAB_BORDER_RADIUS, self._canvas.height);
                            ctx.beginPath();
                            ctx.arc(width, arcY, theme.TAB_BORDER_RADIUS, Math.PI, Math.PI / 2, true);
                            ctx.lineTo(width - theme.TAB_BORDER_RADIUS, theme.TAB_SPACING);
                            ctx.lineTo(width - theme.TAB_BORDER_RADIUS, 0);
                            ctx.fill();
                        } else {
                            ctx.beginPath();
                            ctx.moveTo(theme.TAB_BORDER_RADIUS, 0);
                            ctx.lineTo(theme.TAB_BORDER_RADIUS, arcY);
                            ctx.arc(0, arcY, theme.TAB_BORDER_RADIUS, 0, Math.PI / 2, false);
                            ctx.lineTo(width, theme.TAB_SPACING);
                            ctx.arc(width, arcY, theme.TAB_BORDER_RADIUS, Math.PI / 2, Math.PI, false);
                            ctx.lineTo(width - theme.TAB_BORDER_RADIUS, 0);
                            ctx.lineTo(theme.TAB_BORDER_RADIUS, 0);
                            ctx.fill();
                        }
                    }
                });
            }

        }

    ]

});
},{"./Widget":18,"./theme":21,"domutil":25}],17:[function(require,module,exports){
var Widget = require('./Widget');

var k = require('./constants');
var action = require('./action');

var du = require('domutil');

var TOOLBAR_ITEM_CLASS = 'hk-toolbar-item';

module.exports = Widget.extend(function(_sc, _sm) {

    return [

        function() {
            _sc.apply(this, arguments);
        },

        'methods', {
            addAction: function(action, align) {

                align = align || k.TOOLBAR_ALIGN_LEFT;
                var target = (align === k.TOOLBAR_ALIGN_LEFT) ? this._left : this._right;
                
                var buttonEl = document.createElement('a');
                buttonEl.href = '#';
                buttonEl.className = 'hk-button';

                function sync() {
                    buttonEl.textContent = action.getTitle();
                    if (action.isEnabled()) {
                        du.removeClass(buttonEl, 'disabled');
                    } else {
                        du.addClass(buttonEl, 'enabled');
                    }
                }

                sync();

                action.onchange.connect(sync);

                buttonEl.className = 'hk-button ' + TOOLBAR_ITEM_CLASS;
                buttonEl.style.width = 'auto';
                buttonEl.style.height = 'auto';
                buttonEl.style.position = 'relative';

                buttonEl.addEventListener('click', function(evt) {
                    evt.preventDefault();
                    evt.stopPropagation();
                    action();
                });

                target.appendChild(buttonEl);

                return action;

            },

            _buildStructure: function() {
                this._root = document.createElement('div');
                
                this._left = document.createElement('div');
                this._left.className = 'hk-toolbar-items hk-toolbar-items-left';
                this._root.appendChild(this._left);
                
                this._right = document.createElement('div');
                this._right.className = 'hk-toolbar-items hk-toolbar-items-right';
                this._root.appendChild(this._right);
                
                this._root.className = 'hk-toolbar';
            }
        }

    ]

});

},{"./Widget":18,"./action":19,"./constants":20,"domutil":25}],18:[function(require,module,exports){
var Class   = require('classkit').Class;
var du      = require('domutil');
var k       = require('./constants');

module.exports = Class.extend(function(_sc, _sm) {

    return [

        function(rect) {

            this._parent = null;
            this._hidden = false;
            this._positionMode = k.POSITION_MODE_MANUAL;

            var root = this._buildStructure();
            if (root) this._root = root;
            if (!this._root) throw new Error("widget root not built");
            du.addClass(this._root, 'hk-widget hk-position-manual');

            if (rect) {
                this.setBounds(rect.x, rect.y, rect.width, rect.height, true);
            } else {
                var size = this._defaultSize();
                this.setBounds(0, 0, size.width, size.height);
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
                this._root.style.display = this._hidden ? 'none' : this._cssDisplayMode();
            },

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

            _unapplyBounds: function() {
                if (this._positionMode === k.POSITION_MODE_AUTO) {
                    this._root.style.left = '';
                    this._root.style.top = '';
                    this._root.style.width = '';
                    this._root.style.height = '';
                }
            },

            _applyPosition: function() {
                if (this._positionMode === k.POSITION_MODE_MANUAL) {
                    this._root.style.left = this.x + 'px';
                    this._root.style.top = this.y + 'px';    
                }
            },

            _applySize: function() {
                if (this._positionMode === k.POSITION_MODE_MANUAL) {
                    this._root.style.width = this.width + 'px';
                    this._root.style.height = this.height + 'px';
                }
            },

            _setPositionMode: function(newMode) {

                if (newMode === this._positionMode)
                    return;

                this._positionMode = newMode;

                if (newMode === k.POSITION_MODE_MANUAL) {
                    du.removeClass(this._root, 'hk-position-auto');
                    du.addClass(this._root, 'hk-position-manual');
                    this._applyBounds();
                } else if (newMode === k.POSITION_MODE_AUTO) {
                    du.removeClass(this._root, 'hk-position-manual');
                    du.addClass(this._root, 'hk-position-auto');
                    this._unapplyBounds();
                } else {
                    throw new Error("unknown position mode: " + newMode);
                }

            },

            _defaultSize: function() {
                return {width: 100, height: 100};
            },

            _cssDisplayMode: function() {
                return 'block';
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
                    throw "can't attach child widget - child already has a parent!";
                }

                ele = ele || this.getRoot();
                ele.appendChild(childWidget.getRoot());
                childWidget.setParent(this);

            },

            _removeChildViaElement: function(childWidget, ele) {

                ele = ele || this.getRoot();
                ele.removeChild(childWidget.getRoot());
                childWidget.setParent(null);

            }
        
        }
    
    ];

});
},{"./constants":20,"classkit":24,"domutil":25}],19:[function(require,module,exports){
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
            fn.apply(null, arguments);
        }
    }

    opts = opts || {};

    actionFun._title    = ('title' in opts) ? ('' + opts.title) : '';
    actionFun._enabled  = ('enabled' in opts) ? (!!opts.enabled) : true;
    actionFun.onchange  = signal('onchange');
    actionFun.__proto__ = ActionProto;

    return actionFun;

}

},{"signalkit":27}],20:[function(require,module,exports){
var k = exports;

k.POSITION_MODE_MANUAL  = 'manual';
k.POSITION_MODE_AUTO    = 'auto';

k.SPLIT_PANE_HORIZONTAL = 'h';
k.SPLIT_PANE_VERTICAL   = 'v';

k.TOOLBAR_ALIGN_LEFT    = 1;
k.TOOLBAR_ALIGN_RIGHT   = 2;
},{}],21:[function(require,module,exports){
// Theme and metrics are mirrored from the SCSS file
  // < ideal but will do for now.
  // TODO: autogenerate this somehow
module.exports = {
    DIALOG_PADDING              : 6,
    DIALOG_HEADER_HEIGHT        : 24,
    DIALOG_TRANSITION_DURATION  : 200,
    SPLIT_PANE_DIVIDER_SIZE     : 8,
    TOOLBAR_HEIGHT              : 18,
    TAB_SPACING                 : 7,
    TAB_HEIGHT                  : 24,
    TAB_BORDER_RADIUS           : 5,
    TAB_BACKGROUND_COLOR        : '#67748C',
    
    // The following properties are defined in Javascript only...
    TOOLBAR_MARGIN_TOP          : 8,
    TOOLBAR_MARGIN_RIGHT        : 8,
    TOOLBAR_MARGIN_BOTTOM       : 8,
    TOOLBAR_MARGIN_LEFT         : 8,   
};
},{}],22:[function(require,module,exports){
exports.parseTRBL = function(thing) {
    if (Array.isArray(padding)) {
        switch (thing.length) {
            case 0:
                throw "ArgumentError";
            case 1:
                return [
                    hk.parseInt(thing[0], 10),
                    hk.parseInt(thing[0], 10),
                    hk.parseInt(thing[0], 10),
                    hk.parseInt(thing[0], 10)
                ];
            case 2:
                return [
                    hk.parseInt(thing[0], 10),
                    hk.parseInt(thing[1], 10),
                    hk.parseInt(thing[0], 10),
                    hk.parseInt(thing[1], 10)
                ];
            case 3:
                return [
                    hk.parseInt(thing[0], 10),
                    hk.parseInt(thing[1], 10),
                    hk.parseInt(thing[2], 10),
                    hk.parseInt(thing[1], 10)
                ];
            case 4:
                return [
                    hk.parseInt(thing[0], 10),
                    hk.parseInt(thing[1], 10),
                    hk.parseInt(thing[2], 10),
                    hk.parseInt(thing[3], 10)
                ];
        }
    } else {
        var val = hk.parseInt(thing);
        return [val, val, val, val];
    }
}
},{}],23:[function(require,module,exports){
module.exports=require(18)
},{"./constants":20,"classkit":24,"domutil":25}],24:[function(require,module,exports){
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
  }
};

exports.Class = Class;

},{}],25:[function(require,module,exports){
// Constants from jQuery
var rclass = /[\t\r\n]/g;
var core_rnotwhite = /\S+/g;

var DataStore         = {},
    kDataStoreNextIx  = 1,
    kDataKey          = 'du-data-key';

var __window = typeof window === 'undefined'
                ? null
                : window;

var __document = typeof document === 'undefined'
                  ? null
                  : document;

function generateElementKey() {
  return kDataStoreNextIx++;
}

module.exports = {
  init: function(window, document) {
    __window = window;
    __document = document;
  },

  data: function(el, key, val) {
    var elementKey = el.getAttribute(kDataKey);
    if (!elementKey) {
      elementKey = generateElementKey();
      el.setAttribute(kDataKey, elementKey);
    }

    var elementData = DataStore[elementKey];
    
    if (arguments.length === 2) {
      if (typeof key === 'undefined') {
        delete DataStore[elementKey];
      } else {
        return elementData ? elementData[key] : undefined;
      }
    } else if (arguments.length === 3) {
      if (typeof val === 'undefined') {
        if (elementData) {
          delete elementData[key];
        }
      } else {
        if (!elementData) {
          elementData = {};
          DataStore[elementKey] = elementData;
        }
        elementData[key] = val;
      }
    } else {
      throw "data() - invalid arguments";
    }
  },

  // from jQuery
  hasClass: function(ele, className) {
    className = " " + className + " ";
    return (" " + ele.className + " ").replace(rclass, " ").indexOf(className) >= 0;
  },

  // from jQuery
  addClass: function(ele, value) {
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
  },

  // from jQuery
  removeClass: function(ele, value) {
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
  },

  viewportSize: function() {
    return {
      width: __document.documentElement.clientWidth,
      height: __document.documentElement.clientHeight
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
},{}],26:[function(require,module,exports){
var activeCapture = null;

function createOverlay() {
    var overlay = document.createElement('div');
    overlay.className = 'rattrap-overlay';
    overlay.style.position = 'fixed';
    overlay.style.top = 0;
    overlay.style.left = 0;
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    return overlay;
}

function makeCaptureHandler(fn) {
    return function(evt) {
        evt.stopPropagation();
        evt.preventDefault();
        fn(evt);
    }
}

exports.startCapture = function(events) {

    if (activeCapture) {
        throw "cannot capture events, capture is already in progress";
    }

    activeCapture = createOverlay();

    document.body.appendChild(activeCapture);

    for (var k in events) {
        if (k === 'cursor') {
            activeCapture.style.cursor = events[k];
        } else {
            activeCapture.addEventListener(k, makeCaptureHandler(events[k]));
        }
    }

}

exports.stopCapture = function() {
    if (activeCapture) {
        document.body.removeChild(activeCapture);
        activeCapture = null;
    }
}

},{}],27:[function(require,module,exports){
var process=require("__browserify_process");//
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

Signal.prototype.clear = function() {
    this._listeners = [];
}

//
// Exports

module.exports = function(name) { return new Signal(name); }
module.exports.Signal = Signal;
},{"__browserify_process":28}],28:[function(require,module,exports){
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
            if (ev.source === window && ev.data === 'process-tick') {
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
;