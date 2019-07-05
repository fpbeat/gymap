import '~/styles/index.less';

import {GenericUtil, ObjectUtil} from "./lib/utils";

import Container from './container';
import DirectionComponent from './components/direction/index';
import BindingComponent from './components/binding/index';
import VideoComponent from './components/video/index';
import MapComponent from './components/map/index';
import ControlsComponent from './components/controls/index';

import EventEmitter from 'events';
import Store from 'store/dist/store.modern';

export default class extends EventEmitter {
    store = Store.namespace(NAMESPACE);

    isInitialized = false;
    options = {};

    constructor(options = {}) {
        super();

        GenericUtil.setOptions(this, options);
    }

    initialize(container) {
        if (!this.isInitialized) {
            Object.assign(this, {container});
            if (GenericUtil.isEmpty(this.container)) {
                throw new Error('Passed invalid container element');
            }

            this.bootstrap();
            this.load();
            this.attachInitialEvents();
        }

        this.isInitialized = true;
    }

    bootstrap() {
        this.container = new Container(this.container);
        this.map = new MapComponent(Object.assign({}, ObjectUtil.pick(['map', 'loader'], this.options), {
            data: this.options.data.map
        }));

        this.direction = new DirectionComponent(Object.assign(this.options.direction, {
            onProcess: this.process.bind(this, true),
            onWait: this.map.infoLine.bind(this.map, 'wait'),
            onLoadedPlaces: this.map.infoLine.bind(this.map, 'route', (void 0), 0),
            onError: this.map.infoLine.bind(this.map, 'error'),
            onDomChanged: scrolldown => this.direction.updateDimensions(scrolldown),
            data: this.options.data.direction
        }));

        this.video = new VideoComponent(Object.assign({}, this.options.video, {
            data: this.options.data.video
        }));

        this.binding = new BindingComponent(Object.assign({}, {
            onBind: point => this.binding.setBinding(point, this.map.getMarketPosition(), this.video.getVideoPosition()),
            onSeekToMarker: this.map.setMarketPosition.bind(this.map),
            onSeekToVideo: this.video.setVideoPosition.bind(this.video),
            onDomChanged: scrolldown => this.binding.updateDimensions(scrolldown),
            data: this.options.data.binding
        }));

        this.controls = new ControlsComponent(Object.assign({}, {
            onClickFreeze: state => {
                this.map.frozen(state);
                this.direction.frozen(state);
            },
            onClickAdd: this.binding.add.bind(this.binding, {scrollDown: true}),
            onClickFullscreen: state => this.emit('controllClickFullscreen', state),
            data: this.options.data.controls
        }));
    }

    afterMapLoaded() {
        this.map.setCenter();
        this.direction.initialize(this.map.canvas);
        this.controls.initialize();

        this.map.on('directionsChanged', places => {
            if (this.controls.sync) {
                this.binding.setClonedPlaces(this.direction.getPlaceNames());
            }

            this.binding.resetBinding();
            this.direction.setPlaces(places);
        });

        this.map.on('restore', this.process.bind(this, false));
    }

    load() {
        this.map.load(this.afterMapLoaded.bind(this));
        this.video.load(this.options.videoID);
    }

    attachInitialEvents() {
        this.container.on('resize', name => {
            switch (name) {
                case 'left':
                    this.binding.updateDimensions();
                    this.video.updateDimensions();
                    break;
                case 'right':
                    this.direction.updateDimensions();
                    this.map.updateDimensions();
                    break;
                default:
                    this.video.updateDimensions();
                    this.binding.updateDimensions();
                    this.direction.updateDimensions();
                    this.map.updateDimensions();
            }

            this.map.fitToBounds();
        });

        window.addEventListener('resize', this.container.emit.bind(this.container, 'resize', null));
    }

    process(resetBinding = true) {
        if (resetBinding) {
            this.binding.resetBinding();
        }

        if (this.controls.sync) {
            this.binding.setClonedPlaces(this.direction.getPlaceNames());
        }

        this.map.router.route(this.direction.settings, this.direction.directions);
    }

    getData() {
        return this.isInitialized ? {
            direction: this.direction.get(),
            map: this.map.get(),
            controls: this.controls.get(),
            binding: this.binding.get(),
            video: this.video.get()
        } : null;
    }

    getContainer() {
        return this.container;
    }
}

