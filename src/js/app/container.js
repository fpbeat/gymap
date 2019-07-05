import {GenericUtil, ElementUtil, ArrayUtil, StringUtil} from '~/js/app/lib/utils';
import Browser from '~/js/app/lib/browser';
import DOM from '~/js/app/store/dom';

import EventEmitter from 'events';

import Store from 'store/dist/store.modern';
import Split from 'split.js';
import {FunctionUtil} from "./lib/utils";

export default class extends EventEmitter {

    store = Store.namespace(NAMESPACE);

    options = {
        split: {
            basic: {
                gutter: (index, direction) => ElementUtil.create('div', {
                    class: `gymap-gutter gymap-gutter-${direction}`
                })
            },
            middle: {
                sizes: this.splitterRestoreState('middle', [50, 50]),
                elementStyle: (dimension, size, gutterSize) => ({
                    'flex-basis': `calc(${size}% - ${gutterSize}px)`
                }),

                gutterStyle: (dimension, gutterSize) => ({
                    'flex-basis': `${gutterSize}px`
                }),
                minSize: [450, 315],
                direction: 'horizontal',
            },
            right: {
                sizes: this.splitterRestoreState('right', [25, 75]),
                minSize: [145, 150],
                direction: 'vertical'
            },
            left: {
                sizes: this.splitterRestoreState('left', [25, 75]),
                minSize: [110, 150],
                direction: 'vertical'
            }
        }
    };

    constructor(container) {
        super();

        Object.assign(this, {container});
        if (GenericUtil.isEmpty(this.container)) {
            throw new Error('Passed invalid container element');
        }

        DOM.set('container', {app: container, ...this.render()});
        this.setBrowserFlag();
        this.attachSplitter();
    }

    render() {
        let tpl = require('~/views/container.njk');

        this.initLoaded();
        return ElementUtil.inject(this.container, tpl.render());
    }

    setBrowserFlag() {
        ElementUtil.set(this.container, 'class', 'gymap-browser-' + Browser.detect().name);
    }

    attachSplitter() {
        Split([DOM.get('container.left'), DOM.get('container.right')], Object.assign({}, {
            onDragEnd: this.splitterSaveState.bind(this, 'middle'),
        }, this.options.split.basic, this.options.split.middle));

        Split([DOM.get('container.binding'), DOM.get('container.second')], Object.assign({}, {
            onDragEnd: this.splitterSaveState.bind(this, 'left'),
        }, this.options.split.basic, this.options.split.left));

        Split([DOM.get('container.directions'), DOM.get('container.map')], Object.assign({}, {
            onDragEnd: this.splitterSaveState.bind(this, 'right')
        }, this.options.split.basic, this.options.split.right));
    }

    splitterSaveState(name, size) {
        this.emit('resize', name);

        if (GenericUtil.getType(size) === 'array') {
            let sizes = size.map((value) => value.toFixed(2));

            if (ArrayUtil.sum(sizes) <= 100) {
                this.store.set('split_' + name, sizes);
            }
        }
    }

    splitterRestoreState(name, def) {
        var sizes = this.store.get('split_' + name) || [];
        if (sizes.length === 2 && parseFloat(sizes[0]) > 0 && parseFloat(sizes[1]) > 0) {
            return sizes.map(value => parseFloat(value));
        }

        return def;
    }

    initLoaded() {
        ElementUtil.empty(this.container);
        ElementUtil.set(this.container, 'class', 'gymap-loaded');
    }
}