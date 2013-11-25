function maybeNumber(value, defaultValue) {
    return (typeof value === 'undefined') ? defaultValue : parseFloat(value, 10);
}

function box(hk) {
    var box = new hk.Box();
    box.setBackgroundColor('#404040');
    return box;
}

function isWidget(object) {
    return (typeof object === 'object') && (typeof object.getRoot === 'function');
}

function create(hk, thing) {
    if (typeof thing === 'string') {
        return new hk[thing]();
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

    var split = new hk.SplitPane();
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

    if (orientation === hk.SPLIT_PANE_VERTICAL) {
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
    return s2(hk, hk.SPLIT_PANE_VERTICAL, options);
}

// horizontal split with two panes
exports.h2 = function(hk, options) {
    return s2(hk, hk.SPLIT_PANE_HORIZONTAL, options);
}

// horizontal split, canvas at top, console at bottom
exports.canvasAndConsole = function(hk, options) {

    options = options || {};

    var layout = exports.h2(hk, {
        top     : {widget: 'Canvas2D', id: 'canvas'},
        bottom  : {widget: 'Console', id: 'console'},
        split   : maybeNumber(options.split, 0.7)
    });
    
    return layout;

}

// horizontal split, canvas at top, tab bar at bottom.
// tabs can be passed via options.tabs
exports.canvasAndTabs = function(hk, options) {
    
    options = options || {};

    var layout = exports.h2(hk, {
        top     : {widget: 'Canvas2D', id: 'canvas'},
        bottom  : {widget: 'TabPane', id: 'tabPane'},
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
