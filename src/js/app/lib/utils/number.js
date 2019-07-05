export default {
    random(min, max) {
        return Math.floor(Math.random() * (max - min + 1) + min);
    },

    round(number, precision) {
        precision = Math.pow(10, precision || 0).toFixed(precision < 0 ? -precision : 0);
        return Math.round(number * precision) / precision;
    }
};