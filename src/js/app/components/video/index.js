import {GenericUtil, DateUtil, ElementUtil, FunctionUtil} from '~/js/app/lib/utils';
import DOM from '~/js/app/store/dom';

import Loader from '~/js/app/components/video/extensions/loader';
import EventEmitter from 'events';

export default class extends EventEmitter {
    options = {
        fs: 0,
        hl: 'ru',
        iv_load_policy: 3,
        loop: 1,
        rel: 1,
        showinfo: 0,
        start: 1,
        modestbranding: 1,
        origin: 'https://www.youtube.com'
    };

    ready = false;
    shouldBePaused = false;

    constructor(options) {
        super();

        GenericUtil.setOptions(this, options);
    }

    load(videoID) {
        this.videoID = videoID;

        this.loader = new Loader({
            onLoad: this.initialize.bind(this)
        });

        this.loader.load();
    }

    initialize() {
        DOM.set('video', this.render());

        if (GenericUtil.isEmpty(this.videoID)) {
            ElementUtil.empty(DOM.get('container.videoLoading'));
            return;
        }

        this.player = new YT.Player(DOM.get('video.container'), {
            height: 0,
            width: 0,
            videoId: this.videoID,
            playerVars: this.options,
            events: {
                onReady: this.setVideoInitial.bind(this),
                onStateChange: this.checkVideoStage.bind(this)
            }
        });

        ElementUtil.empty(DOM.get('container.videoLoading'));
        FunctionUtil.setImmediate(this.updateDimensions.bind(this));
    }

    setVideoInitial() {
        this.ready = true;
        FunctionUtil.setImmediate(this.updateDimensions.bind(this));

        this.restore(this.options.data);
    }

    checkVideoStage(state) {
        if (this.shouldBePaused && state.data === 1) {
            this.shouldBePaused = false;

            this.player.pauseVideo();
            this.player.unMute();
        }
    }

    updateDimensions() {
        let controls = ElementUtil.getSize(DOM.get('container.controls'));
        let video = ElementUtil.getSize(DOM.get('container.second'));

        if (this.player) {
            this.player.setSize('100%', video.height - controls.height);
        }
    }

    render() {
        let tpl = require('~/views/components/video/index.njk');

        return ElementUtil.inject(DOM.get('container.video'), tpl.render());
    }

    getVideoPosition() {
        if (this.ready) {
            return {
                value: parseInt(this.player.getCurrentTime()),
                formatted: DateUtil.secondsToTime(this.player.getCurrentTime())
            };
        }

        return null;
    }

    setVideoPosition(position) {
        if (this.ready) {
            this.player.seekTo(position);
        }
    }

    get() {
        let position = this.getVideoPosition();

        return {
            position: position !== null ? position.value : 0
        };
    }

    restore(data) {
        if (data !== null && parseInt(data.position) > 0) {
            this.shouldBePaused = true;

            this.player.mute();
            this.setVideoPosition(data.position);
        }
    }
}

