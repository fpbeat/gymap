import ElementUtil from './element';
import GenericUtil from './generic';

export default {
    setImmediate(callback) {
        require('setimmediate');

        return setImmediate(callback);
    },

    isValidJson(string) {
        try {
            JSON.parse(string);
        } catch (e) {
            return false;
        }

        return true;
    },

    transitionEndEventName() {
        let element = ElementUtil.create('DIV'),
            transitions = {
                'transition': 'transitionend',
                'OTransition': 'otransitionend',
                'MozTransition': 'transitionend',
                'WebkitTransition': 'webkitTransitionEnd'
            };

        for (let i in transitions) {
            if (!GenericUtil.isEmpty(element.style[i])) {
                return transitions[i];
            }
        }

        return null;
    }
};