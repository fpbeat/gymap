import GenericUtil from "./generic";

export default {
    toStringCoordinates(coords) {
        if (GenericUtil.getType(coords) === 'object' && coords.hasOwnProperty('lat') && coords.hasOwnProperty('lng')) {
            return Object.values(coords).join(',');
        }

        return null;
    },

    parseCoordinates(coords) {
        switch (GenericUtil.getType(coords)) {
            case 'string':
                return this.parseCoordinates(coords.split(','));
            case 'object':
                return this.parseCoordinates(Object.values(coords));
            case 'array':
                if (coords.length === 2) {
                    return {
                        lat: parseFloat(coords[0]),
                        lng: parseFloat(coords[1])
                    };
                }
                break;
        }

        return null;
    }
};