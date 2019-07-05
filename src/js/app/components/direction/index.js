import {GenericUtil, ArrayUtil, ElementUtil, StringUtil} from '~/js/app/lib/utils';
import DOM from '~/js/app/store/dom';
import Swal from '~/js/app/lib/swal';


import Sortable from 'sortablejs';
import PerfectScrollbar from 'perfect-scrollbar';

import EventEmitter from 'events';

export default class extends EventEmitter {

    charsArray = [];
    charCurrent = 0;

    options = {
        maxPoints: 22
    };

    routeSettings = {
        avoidHighways: false,
        avoidTolls: false
    };

    placesCache = {};
    isInitialized = false;
    isFreeze = false;

    constructor(options) {
        super();

        GenericUtil.setOptions(this, options);
    }

    bootstrap() {
        for (let i = 65; i <= 90; i++) {
            this.charsArray.push(String.fromCharCode(i));
        }

        DOM.set('direction', this.render());
        this.creteScrollbar();
    }

    render() {
        let tpl = require('~/views/components/direction/index.njk');

        ElementUtil.empty(DOM.get('container.directions'));
        return ElementUtil.inject(DOM.get('container.directions'), tpl.render());
    }

    creteScrollbar() {
        this.scollbar = new PerfectScrollbar(DOM.get('container.directions'), {
            wheelPropagation: false,
            suppressScrollX: true,
            wheelSpeed: 0.5,
            scrollYMarginOffset: 25
        });
    }

    makeSortable() {
        if (this.sortable instanceof Sortable) {
            this.sortable.destroy();
        }

        this.sortable = new Sortable(DOM.get('direction.points'), {
            ghostClass: 'gymap-sortable-ghost',
            handle: 'span',
            onEnd: evt => {
                if (parseInt(evt.newIndex, 10) !== parseInt(evt.oldIndex, 10)) {
                    this.rebuild();
                    this.emit('process');
                }
            }
        });
    }

    build(data) {
        let tpl = require('~/views/components/direction/point.njk');

        let elements = ElementUtil.inject(DOM.get('direction.points'), tpl.render(Object.assign({}, {
            char: this.charsArray[this.charCurrent++],
            index: this.charCurrent - 1
        }, data)));

        this.makeSortable();

        return elements;
    }

    add(data = {}) {
        if (this.isFreeze) {
            return;
        }

        let point = this.build(data);
        this.createAutocomplete(point.input);

        point.remove.addEventListener('click', this.remove.bind(this, point.container, point.input));

        if (this.charCurrent >= this.options.maxPoints) {
            DOM.get('direction.addDirection').classList.add('hidden');
        }

        this.hideRemoveControll();

        this.emit('domChanged', Boolean(data.scrollDown));
    }

    initialize(map) {
        this.bootstrap();

        this.placesService = new google.maps.places.PlacesService(map);
        this.attachEvents();

        for (let i = 0; i < 2; i++) {
            this.add();
        }

        this.isInitialized = true;

        this.restore(this.options.data);
    }

    remove(container, input) {
        if (this.isFreeze) {
            return;
        }

        Swal.confirm(ElementUtil.getText(container, 'remove')).then(() => {
            let isNotEmpty = !!input.getAttribute('data-place-id');
            ElementUtil.destroy(container);

            this.rebuild();
            this.hideRemoveControll();

            if (this.charCurrent <= this.options.maxPoints) {
                DOM.get('direction.addDirection').classList.remove('hidden');
            }

            if (isNotEmpty) {
                this.emit('process');
            }

            this.emit('domChanged');
        });
    }

    rebuild() {
        let elements = DOM.get('direction.points').childNodes;

        this.charCurrent = 0;
        for (let element of elements) {
            let elementsPool = {
                'input': element.querySelector('input'),
                'span': element.querySelector('span')
            };

            if (GenericUtil.getType(elementsPool.input) === 'element' && GenericUtil.getType(elementsPool.span) === 'element') {
                elementsPool.input.setAttribute('data-index', this.charCurrent);
                elementsPool.span.innerText = this.charsArray[this.charCurrent];
                this.charCurrent++;
            }
        }
    }

    attachEvents() {
        DOM.get('direction.addDirection').addEventListener('click', this.add.bind(this, {scrollDown: true}));
        DOM.get('direction.toggleSettings').addEventListener('click', this.toggleSettings.bind(this));

        for (let setting of Object.keys(this.routeSettings)) {
            DOM.get('direction.setting' + StringUtil.ucFirst(setting)).addEventListener('change', (event) => {
                this.routeSettings[setting] = Boolean(event.target.checked);

                this.emit('process');
            });
        }
    }

    createAutocomplete(input) {
        let autocomplete = new google.maps.places.Autocomplete(input, {
            types: ['geocode']
        });

        autocomplete.addListener('place_changed', () => {
            let place = autocomplete.getPlace();

            if (place && String(input.getAttribute('data-place-id')) !== String(place.place_id)) {
                if (!!place.place_id) {
                    this.setPlaceCache(place);
                    ElementUtil.set(input, {
                        dataPlaceId: place.place_id,
                        dataPlaceName: place.name
                    });
                }

                this.emit('process');
            }
        });

        input.addEventListener('keyup', () => {
            if (StringUtil.trim(input.value) === '') {
                ElementUtil.set(input, {
                    dataPlaceId: null,
                    dataPlaceName: null
                });
            }
        });
    }

    setPlaceCache(place) {
        this.placesCache[place.place_id] = {address: place.formatted_address, name: place.name};
    }

    getPlace(placeId) {
        return new Promise((resolve, reject) => {
            if (this.placesCache.hasOwnProperty(placeId)) {
                return resolve(Object.assign({}, this.placesCache[placeId], {place: placeId}));
            }

            this.placesService.getDetails({
                placeId: placeId,
                fields: ['formatted_address', 'address_components', 'name', 'place_id']
            }, (place, status) => {
                if (status === google.maps.places.PlacesServiceStatus.OK) {
                    this.formatPointAddress(place);
                    this.setPlaceCache(place);

                    resolve({place: place.place_id, address: place.formatted_address, name: place.name});
                } else {
                    reject(status);
                }
            });
        });
    }

    setPlaces(places) {
        if (ArrayUtil.isEqual(places, this.directionPlaces()) || this.isFreeze) {
            return;
        }

        this.emit('wait');
        let promises = places.map(this.getPlace.bind(this));
        Promise.all(promises).then(points => {
            this.removeAllDirections();

            points.forEach(point => this.add(Object.assign({}, point, {scrollDown: true})));
            this.emit('loadedPlaces');
        }, (status) => {
            this.emit('error', status);
        });
    }

    hideRemoveControll() {
        let elements = DOM.get('direction.points').querySelectorAll('a');

        for (let element of elements) {
            element.classList[this.charCurrent > 2 ? 'remove' : 'add'].call(element.classList, 'hidden');
        }
    }

    removeAllDirections() {
        this.charCurrent = 0;

        ElementUtil.empty(DOM.get('direction.points'));

        this.emit('domChanged');
    }

    toggleSettings() {
        if (this.isFreeze) {
            return;
        }

        let isHidden = DOM.get('direction.settings').classList.contains('hidden'),
            texts = ElementUtil.getText(DOM.get('direction.toggleSettings'));

        DOM.get('direction.toggleSettings').innerText = isHidden ? texts.visible : texts.hidden;
        DOM.get('direction.settings').classList.toggle('hidden');

        this.emit('domChanged', true);
    }

    directionPlaces(selector = 'place-id') {
        let elements = DOM.get('direction.points').querySelectorAll('input');

        let directions = [];
        for (let element of elements) {
            let placeId = element.getAttribute(`data-${selector}`);

            if (!!placeId) {
                directions.push(placeId);
            }
        }

        return directions;
    }

    frozen(state = true) {
        this.isFreeze = state;
        if (this.sortable instanceof Sortable) {
            this.sortable.option('disabled', state);
        }

        let elements = DOM.get('direction.points').querySelectorAll('input');
        for (let element of elements) {
            state ? element.setAttribute('disabled', true) : element.removeAttribute('disabled');
        }

        DOM.get('container.directions').classList[state ? 'add' : 'remove'].call(DOM.get('container.directions').classList, 'frozen');
    }

    getPlaceNames() {
        return this.directionPlaces('place-name');
    }

    updateDimensions(scrollBottom) {
        if (this.isInitialized) {
            this.scollbar.update();

            if (scrollBottom) {
                DOM.get('container.directions').scrollTop = 100000;
            }
        }
    }

    formatPointAddress(place) {
        let disallowedTypes = ['route', 'postal_code', 'premise', 'street_address', 'street_number', 'room', 'post_box', 'point_of_interest', 'airport', 'intersection'];

        let addressComponent = ArrayUtil.pick('long_name', Array.from(place.address_components).filter(component => {
            for (let check of disallowedTypes) {
                if (Array.from(component.types).includes(check)) {
                    return false;
                }
            }

            return true;
        }));

        if (addressComponent.length > 0) {
            addressComponent = addressComponent.map(StringUtil.ucFirst);

            Object.assign(place, {
                formatted_address: addressComponent.join(', '),
                name: addressComponent.slice(0, 2).join(', '),
            });
        }
    }

    get() {
        if (this.isInitialized) {
            let elements = DOM.get('direction.points').querySelectorAll('input');

            let directions = [];
            for (let element of elements) {
                let placeId = element.getAttribute('data-place-id');
                let placeName = element.getAttribute('data-place-name');

                if (!!placeId && !!placeName && StringUtil.trim(element.value) !== '') {
                    directions.push({
                        place: placeId,
                        name: placeName,
                        address: StringUtil.trim(element.value)
                    });
                }
            }

            return {
                directions: directions,
                settings: this.routeSettings
            };
        }

        return null;
    }

    restore(data) {
        if (data !== null) {
            for (let setting of Object.keys(data.settings)) {
                if (data.settings[setting]) {
                    this.routeSettings[setting] = true;
                    DOM.get('direction.setting' + StringUtil.ucFirst(setting)).checked = true;
                }
            }

            let directions = Array.from(data.directions);
            if (directions.length > 0) {

                for (let direction of directions) {
                    this.setPlaceCache({
                        place_id: direction.place,
                        formatted_address: direction.address,
                        name: direction.name
                    });
                }

                this.removeAllDirections();
                directions.forEach(this.add.bind(this));
                directions.length < 2 && this.add();
            }
        }
    }

    get directions() {
        let directions = Array.from(this.directionPlaces()).map((place) => {
            return {'placeId': place};
        });

        return {
            from: directions[0],
            to: directions.length > 1 ? directions[directions.length - 1] : null,
            points: directions.slice(1, -1)
        };
    }

    get settings() {
        return this.routeSettings;
    }
};
       