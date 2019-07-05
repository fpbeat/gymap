import {ObjectUtil} from '~/js/app/lib/utils';

export default class {
    static store = {};

    static set(name, data) {
        Object.defineProperty(this.store, name, {
            value: data
        });
    }

    static get(path = '') {
        return ObjectUtil.getPath(this.store, path);
    }
};