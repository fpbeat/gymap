import '~/styles/index.less';

import {ElementUtil, GenericUtil, ObjectUtil, StringUtil, FunctionUtil} from "./app/lib/utils";

import EventEmitter from 'events';
import {Base64} from 'js-base64';

import PopupComponent from '~/js/app/components/popup/index';
import GYMapContainer from '~/js/app/gymap';

class Gymap extends EventEmitter {
    options = {
        videoID: null,
        data: {
            direction: null,
            map: null,
            controls: null,
            binding: null,
            video: null
        },

        loader: {
            key: 'AIzaSyAbLRXldZlrnJJLmwmUewPNHJwv3pF1nsw',
            lang: 'ru'
        },

        map: {
            center: '50.45466 30.5238', // Kiev
            zoom: 6,
            type: 'roadmap',
            route: {
                color: '#e57b4a'
            }
        },

        direction: {
            maxPoints: 22
        },

        video: {
            hl: 'ru',
            loop: 1
        },

        input: {
            name: NAMESPACE + '-data',
            after: null
        }
    };

    constructor(element, options = {}) {
        super();

        try {
            this.button = document.querySelector(element);
            if (GenericUtil.isEmpty(this.button)) {
                throw new Error('Passed invalid button element');
            }

            GenericUtil.setOptions(this, options);
            this.setGyMapDataFromAttribute();
            this.createInput();
            this.bootstrap();
        } catch (e) {
            console.error(`GYmap fatal error: ${e.message}`);
        }
    }

    bootstrap() {
        this.gymapContainer = new GYMapContainer(this.options);

        this.popup = new PopupComponent(this.button, {
            onOpen: element => {
                this.gymapContainer.initialize(element);

                this.emit('open');
            },
            onClose: () => {
                let data = this.gymapContainer.getData();
                ElementUtil.set(this.input, 'value', Base64.encode(JSON.stringify(data)));

                this.emit('close', data);
            },
            onDimensionsChanged: () => this.gymapContainer.getContainer().emit('resize', null)
        });

        this.gymapContainer.on('controllClickFullscreen', this.popup.toggleFullScreen.bind(this.popup));
    }

    createInput() {
        this.input = ElementUtil.create('INPUT', {
            type: 'hidden',
            name: this.options.input.name
        });

        ElementUtil.inject(this.options.input.after || this.button, this.input, 'after');
    }

    setGyMapDataFromAttribute() {
        let data = Base64.decode(this.button.getAttribute('data-gymap') || '');

        if (StringUtil.trim(data) !== '' && FunctionUtil.isValidJson(data)) {
            let parsed = JSON.parse(data);

            ObjectUtil.merge(true, this.options, {
                data: GenericUtil.getType(parsed) === 'object' ? parsed : {}
            });
        }
    }
}

export default {
    version: VERSION,
    create: (element, options) => new Gymap(element, options)
};