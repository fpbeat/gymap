import {GenericUtil, StringUtil} from "../utils";

export default {
    isEqual(...input) {
        let sorted = [];
        for (let value of Object.values(input)) {
            if (GenericUtil.getType(value) !== 'array') {
                return false;
            }

            sorted.push(JSON.stringify([...value].sort()));
        }
        return sorted.every((val, i, arr) => val === arr[0]);
    },

    sum(input) {
        return input.reduce((accumulator, value) => accumulator + parseFloat(value), 0);
    },

    pick(key, input, notEmpty = true) {
        let result = input.reduce((accumulator, value) => ([...accumulator, value[key] || null]), []);

        if (notEmpty) {
            return this.notEmpty(result);
        }

        return result;
    },

    notEmpty(input) {
        return input.filter(e => !['true', 'false', 'null', '', '0', 'undefined', 'NaN'].includes(StringUtil.trim(e)));
    }
};