# hudkit-layouts

A collection of predefined layouts for [hudkit](https://github.com/jaz303/hudkit.js). 

## Install

    $ npm install hudkit
    $ npm install hudkit-layouts

Setup:

    var hk = require('hudkit');
    hk.init();

    var hl = require('hudkit-layouts');

## Layouts

All functions return an object that collects all created widgets.

#### `hl.v2(hk, options)`

2-way vertical split.

    hl.v2(hk, {
        left: 'Console',
        right: 'Canvas2D',
        split: 0.5
    });

#### `hl.h2(hk, options)`

2-way horizontal split.

    hl.h2(hk, {
        top: 'Canvas2D',
        bottom: 'Console',
        split: 0.7
    });

#### `hl.canvasAndConsole(hk, options)`

Canvas at top, console at bottom.

    hl.canvasAndConsole(hk, {
        split: 0.6
    });

#### `hl.canvasAndTabs(hk, options)`

Canvas at top, array of tabs at bottom.

    hl.canvasAndTabs(hk, {
        tabs: [
            {widget: 'Console', id: 'console'},
            {widget: 'Console', id: 'logger'}
        ]
    });