import {GenericUtil, ElementUtil, FunctionUtil} from '~/js/app/lib/utils';
import DOM from '~/js/app/store/dom';
import Swal from '~/js/app/lib/swal';

import EventEmitter from 'events';

export default class extends EventEmitter {
    options = {
        closeOnLiningClick: false,
        closeOnEscapeKey: true
    };

    isOpened = false;

    constructor(button, options) {
        super();

        Object.assign(this, {button});
        if (GenericUtil.isEmpty(this.button)) {
            throw new Error('Passed invalid button element');
        }

        GenericUtil.setOptions(this, options);

        this.bootstrap();
        this.attachEvents();
    }

    bootstrap() {
        DOM.set('popup', this.render());
    }

    attachEvents() {
        this.button.addEventListener('click', this.open.bind(this));

        if (this.options.closeOnLiningClick) {
            DOM.get('popup.lining').addEventListener('click', this.handleLiningClick.bind(this));
        }

        if (this.options.closeOnEscapeKey) {
            document.addEventListener('keydown', this.handleEscapeKey.bind(this));
        }

        DOM.get('popup.close').addEventListener('click', this.close.bind(this));
    }


    handleEscapeKey(evt) {
        if (this.isOpened && !Swal.isVisible() && ['escape', 'esc'].includes(String(evt.key).toLowerCase())) {
            this.confirmClose();
        }
    }

    handleLiningClick(evt) {
        let target = evt.target;
        while (target && target.nodeType === 3) {
            target = target.parentNode;
        }

        if (this.isOpened && GenericUtil.getType(target) === 'element' && target.classList.contains('gymap-popup-lining')) {
            this.confirmClose();
        }
    }

    confirmClose() {
        Swal.confirm(ElementUtil.getText(DOM.get('popup.lining'), 'closeConfirm')).then(this.close.bind(this));
    }

    open() {
        this.toggle();

        this.emit('open', DOM.get('popup.app'));
    }

    close() {
        this.toggle();

        this.emit('close');
    }

    toggle() {
        ElementUtil.set(DOM.get('popup.lining'), 'class', this.isOpened ? '!gymap-popup-lining-active' : 'gymap-popup-lining-active');
        ElementUtil.set(DOM.get('popup.container'), 'class', this.isOpened ? '!gymap-popup-container-active' : 'gymap-popup-container-active');
        this.isOpened = !this.isOpened;
    }

    toggleFullScreen(state) {
        ElementUtil.set(DOM.get('popup.container'), 'class', state ? 'gymap-popup-container-fullscreen' : '!gymap-popup-container-fullscreen');
        this.emit('dimensionsChanged');
    }

    render() {
        let tpl = require('~/views/components/popup/index.njk');

        var injector = document.body || document.lastChild;
        if (GenericUtil.getType(injector) === 'element') {
            return ElementUtil.inject(injector, tpl.render());
        }

        return null;
    }
}

