export default class {
    static detect() {
        let {detect} = require('detect-browser'),
            browser = detect();

        return browser ? browser : {name: 'unknown', version: 0, os: 'unknown'};
    }

    static get chrome() {
        return this.detect().name === 'chrome';
    }

    static get firefox() {
        return this.detect().name === 'firefox';
    }

    static get opera() {
        return this.detect().name === 'opera';
    }

    static get edge() {
        return this.detect().name === 'edge';
    }

    static get ie() {
        return this.detect().name === 'ie';
    }
}