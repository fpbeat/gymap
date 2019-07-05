import {GenericUtil, NumberUtil, StringUtil, ElementUtil} from '~/js/app/lib/utils';
import EventEmitter from 'events';

export default class extends EventEmitter {
    options = {
        url: 'https://www.youtube.com/iframe_api',
        callback: 'onYouTubeIframeAPIReady'
    };

    constructor(options) {
        super();

        GenericUtil.setOptions(this, options);
        this.bootstrap();
    }

    bootstrap() {
        this.callback = this.createCallback(this.options.callback);
    }

    load() {
        var injector = document.head || document.body || document.lastChild;

        if (GenericUtil.getType(injector) === 'element') {
            let tag = ElementUtil.create('SCRIPT', {
                type: 'text/javascript',
                src: StringUtil.substitute(this.options.url, {
                    key: this.options.key
                })
            });

            ElementUtil.inject(injector, tag);
        }
    }

    createCallback(callback) {
        window[callback] = this.emit.bind(this, 'load');
    }
};
