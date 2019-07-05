import GenericUtil from './generic';

export default {
    trim(string) {
        return String(string).replace(/^\s+|\s+$/g, '');
    },

    stringToPath(path) {
        if (GenericUtil.getType(path) !== 'string') {
            return path;
        }

        let output = [];
        path.split('.').forEach((item) => {
            item.split(/\[([^}]+)\]/g).forEach((key) => {
                if (key.length > 0) {
                    output.push(key);
                }
            });
        });

        return output;
    },

    substitute(string, object, regexp) {
        return String(string).replace(regexp || (/\\?\{([^{}]+)\}/g), (match, name) => {
            if (match.charAt(0) === '\\') return match.slice(1);
            return (object[name] !== null) ? object[name] : '';
        });
    },

    ucFirst(string) {
        let first = string.charAt(0).toUpperCase();
        return first + string.substr(1, string.length - 1);
    },

    lcFirst(string) {
        let first = string.charAt(0).toLowerCase();
        return first + string.substr(1, string.length - 1);
    },

    toCamelCase(string) {
        return String(string).replace(/-\D/g, (match) => match.charAt(1).toUpperCase());
    },

    sanitize(string) {
        return String(string).replace(/[^a-z0-9]/gi, '').toLowerCase();
    },

    hyphenate(string) {
        return this.lcFirst(String(string)).replace(/[A-Z]/g, match => {
            return ('-' + match.charAt(0).toLowerCase());
        });
    },

    pad(num, size) {
        let s = num + "";
        while (s.length < size) s = "0" + s;
        return s;
    }
};