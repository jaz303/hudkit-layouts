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
