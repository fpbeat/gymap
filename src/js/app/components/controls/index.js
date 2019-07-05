import {GenericUtil, ElementUtil} from '~/js/app/lib/utils';
import DOM from '~/js/app/store/dom';

import EventEmitter from 'events';
import Store from 'store/dist/store.modern';

export default class extends EventEmitter {
    store = Store.namespace(NAMESPACE);

    options = {};

    isSync = false;
    isFrozen = false;
    isFullscreen = false;

    constructor(options) {
        super();

        GenericUtil.setOptions(this, options);
        this.bootstrap();
    }

    bootstrap() {
        DOM.set('controls', this.render());
        this.toggleSync(this.store.get('sync') || false);
        this.toggleFullscreen(this.store.get('fullscreen') || false);

        this.attachEvents();
    }

    initialize() {
        this.restore(this.options.data);
    }

    render() {
        let tpl = require('~/views/components/controls/index.njk');

        return ElementUtil.inject(DOM.get('container.controls'), tpl.render());
    }

    attachEvents() {
        DOM.get('controls.actionAdd').addEventListener('click', this.emit.bind(this, 'clickAdd'));
        DOM.get('controls.actionSync').addEventListener('click', this.toggleSync.bind(this));
        DOM.get('controls.actionFreeze').addEventListener('click', this.toggleFreeze.bind(this));
        DOM.get('controls.actionFullscreen').addEventListener('click', this.toggleFullscreen.bind(this));
    }

    toggleSync(state = null) {
        let button = DOM.get('controls.actionSync');

        this.isSync = (GenericUtil.getType(state) === 'boolean') ? state : !this.isSync;
        ElementUtil.set(button, 'class', this.isSync ? 'gymap-active' : '!gymap-active');

        this.emit('clickSync', this.isSync);
        this.store.set('sync', this.isSync);
    }

    toggleFullscreen(state = null) {
        let button = DOM.get('controls.actionFullscreen');

        this.isFullscreen = (GenericUtil.getType(state) === 'boolean') ? state : !this.isFullscreen;
        ElementUtil.set(button, 'class', this.isFullscreen ? 'gymap-active' : '!gymap-active');

        this.emit('clickFullscreen', this.isFullscreen);
        this.store.set('fullscreen', this.isFullscreen);
    }

    toggleFreeze(state = null) {
        let button = DOM.get('controls.actionFreeze');

        this.isFrozen = (GenericUtil.getType(state) === 'boolean') ? state : !this.isFrozen;
        ElementUtil.set(button, 'class', this.isFrozen ? 'gymap-active' : '!gymap-active');

        this.emit('clickFreeze', this.isFrozen);
    }

    get() {
        return {
            frozen: this.isFrozen
        };
    }

    restore(data) {
        if (data !== null && data.frozen) {
            this.toggleFreeze(true);
        }
    }

    get sync() {
        return this.isSync;
    }

    get frozen() {
        return this.isFrozen;
    }

    get fullscreen() {
        return this.isFullscreen;
    }
}