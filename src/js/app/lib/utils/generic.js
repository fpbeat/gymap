import {ObjectUtil, StringUtil} from "../utils";

export default {
    getType(obj) {
        if (typeof obj === 'undefined' && obj === void 0) {
            return void 0;
        }

        if (obj === null) {
            return null;
        }

        if (!!(obj && obj.nodeType === 1)) {
            return 'element';
        }

        return {}.toString.call(obj).split(' ')[1].slice(0, -1).toLowerCase();
    },

    isEmpty(obj) {
        return this.getType(obj) === null || this.getType(obj) === void 0;
    },

    isIterable(obj) {
        if (this.isEmpty(obj)) {
            return false;
        }
        return typeof obj[Symbol.iterator] === 'function';
    },

    setOptions: function (instance, options) {
        if (!this.isEmpty(options)) {
            for (let option of Object.keys(options)) {
                if (/^on/.test(option) && this.getType(instance.on) === 'function') {
                    instance.on(StringUtil.lcFirst(option.substr(2)), options[option].bind(instance));
                }
            }

            ObjectUtil.merge(true, instance.options || {}, options);
        }
    }
};