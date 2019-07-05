import StringUtil from './string';

export default {
    secondsToTime(secs) {
        let pool = [];

        let minutesDivisor = parseInt(secs) % (60 * 60);
        let secondsDivisor = minutesDivisor % 60;

        pool.push(Math.floor(parseInt(secs) / (60 * 60)));
        pool.push(Math.floor(minutesDivisor / 60));
        pool.push(Math.ceil(secondsDivisor));

        return pool.map(value => StringUtil.pad(value, 2)).join(':');
    }
};