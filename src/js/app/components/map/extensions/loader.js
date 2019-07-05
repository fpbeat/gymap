import {GenericUtil, NumberUtil, StringUtil, ElementUtil} from '~/js/app/lib/utils';
import EventEmitter from 'events';

export default class extends EventEmitter {
    options = {
        url: 'https://maps.googleapis.com/maps/api/js?libraries=places&language={lang}&key={key}&callback={callback}',
        key: '',
        lang: 'en'
    };

    constructor(options) {
        super();

        GenericUtil.setOptions(this, options);
        this.bootstrap();
    }

    bootstrap() {
        this.callback = this.createCallback();
    }

    load() {
        var injector = document.head || document.body || document.lastChild;

        if (GenericUtil.getType(injector) === 'element') {
            let tag = ElementUtil.create('SCRIPT', {
                type: 'text/javascript',
                src: StringUtil.substitute(this.options.url, {
                    key: this.options.key,
                    callback: this.callback,
                    lang: this.options.lang
                })
            });

            ElementUtil.inject(injector, tag);
        }
    }

    createCallback() {
        var funcName = 'googleMapCallback' + NumberUtil.random(0, 2147483647);
        window[funcName] = this.emit.bind(this, 'load');

        return funcName;
    }
};
