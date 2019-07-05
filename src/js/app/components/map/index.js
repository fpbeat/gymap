import {GenericUtil, NumberUtil, StringUtil, ElementUtil, FunctionUtil} from '~/js/app/lib/utils';
import DOM from '~/js/app/store/dom';

import Loader from '~/js/app/components/map/extensions/loader';
import SnapToRoute from '~/js/app/components/map/extensions/snap';
import Router from '~/js/app/components/map/extensions/router';

import Color from 'color';
import EventEmitter from 'events';

export default class extends EventEmitter {

    options = {
        canvasOffset: 26,
        map: {
            center: null,
            zoom: 10,
            type: 'roadmap',
            route: {},
            marker: {
                color: '#3a99ff'
            }
        }
    };

    routeSettings = {
        avoidHighways: false,
        avoidTolls: false
    };

    initMarkerPosition = null;
    routeBuildCount = 0;
    routeBuiled = false;
    isLoaded = false;

    constructor(options) {
        super();

        GenericUtil.setOptions(this, options);
    }

    load(callback) {
        this.loader = new Loader(Object.assign({}, this.options.loader, {
            onLoad: callback.bind(this)
        }));

        this.loader.load();
    }

    bootstrap(location) {
        DOM.set('map', this.render());
        this.isLoaded = true;


        FunctionUtil.setImmediate(this.updateDimensions.bind(this));
        this.prepare(location);

        this.restore(this.options.data);
    }

    render() {
        let tpl = require('~/views/components/map/index.njk');

        ElementUtil.empty(DOM.get('container.map'));
        return ElementUtil.inject(DOM.get('container.map'), tpl.render());
    }

    setCenter() {
        if (this.options.map.center !== null) {
            let coordinates = this.options.map.center.match(/^([\d\.]+)(?:[\s,]+)([\d\.]+)$/);


            if (coordinates !== null && GenericUtil.getType(coordinates) === 'array') {
                coordinates.shift();
                return this.bootstrap(new google.maps.LatLng(...coordinates));
            }

            let geocoder = new google.maps.Geocoder();

            geocoder.geocode({
                address: this.options.map.center
            }, (results, status) => {
                if (status === google.maps.GeocoderStatus.OK) {
                    return this.bootstrap(results[0].geometry.location);
                }

                return this.bootstrap(null);
            });
        } else {
            return this.bootstrap(null);
        }
    }

    prepare(location) {
        this.map = new google.maps.Map(DOM.get('map.canvas'), {
            center: location,
            zoom: this.options.map.zoom,
            mapTypeId: this.options.map.type,
            controlSize: 36,
            mapTypeControl: false,
            streetViewControl: false,
            scaleControl: true
        });

        this.router = new Router(this.map, Object.assign({}, this.options.map.route, {
            onDirectionsChanged: (result, places) => {
                this.start(result);

                if (this.routeBuildCount > 0) {
                    this.emit('directionsChanged', places);
                }

                this.routeBuildCount++;
            },
            onEmptyDirections: () => {
                if (this.routeBuiled) {
                    this.infoLine('error', 'POINTS_EMPTY');
                }
            },
            onWait: this.infoLine.bind(this, 'wait'),
            onError: this.infoLine.bind(this, 'error')
        }));

        this.currentMarker = new google.maps.Marker({
            crossOnDrag: false,
            visible: false,
            map: this.map,
            icon: {
                path: "m210 0c-115.792969 0-210 94.207031-210 210 0 93.359375 61.519531 175.210938 150.441406 201.425781l46.140625 92.28125c2.542969 5.082031 7.734375 8.292969 13.417969 8.292969 5.679688 0 10.875-3.210938 13.414062-8.292969l46.140626-92.277343c88.925781-26.214844 150.445312-108.066407 150.445312-201.429688 0-115.792969-94.207031-210-210-210zm0 270c-33.085938 0-60-26.914062-60-60s26.914062-60 60-60 60 26.914062 60 60-26.914062 60-60 60zm0 0",
                fillColor: this.options.map.marker.color,
                fillOpacity: 1,
                scale: 0.07,
                rotation: 180,
                anchor: new google.maps.Point(200, 500),
                strokeColor: '#FFF',
                strokeWeight: 1
            },
            draggable: true
        });

        this.polyline = new google.maps.Polyline({
            strokeWeight: 0,
            map: this.map
        });

        this.snapToRoute = new SnapToRoute(this.map, this.currentMarker, this.polyline);

        google.maps.event.addListener(this.currentMarker, 'drag', evt => {
            if (this.routeBuiled) {
                this.infoLine('route', this.getRouteDistance(), this.getMarkerDistance(evt.latLng));
            }
        });

        for (let entry of Object.entries({
            mousedown: Color(this.options.map.marker.color).darken(.15).hex(),
            mouseup: this.options.map.marker.color
        })) {
            let [event, color] = entry;
            google.maps.event.addListener(this.currentMarker, event, () => {
                this.currentMarker.setIcon(Object.assign({}, this.currentMarker.getIcon(), {
                    fillColor: color
                }));
            });
        }

        if (location === null) {
            this.infoLine('error', 'WRONG_CENTER');
        }
    }

    getRouteDistance() {
        if (!this.routeBuiled) {
            return 0;
        }

        return (parseFloat(google.maps.geometry.spherical.computeLength(this.polyline.getPath())) || 0) / 1000;
    }

    getMarkerDistance(latLng = null) {
        if (!this.routeBuiled) {
            return 0;
        }

        return (parseFloat(this.snapToRoute.getDistAlongRoute(latLng)) || 0) / 1000;
    }

    start(result) {
        if (result && result.routes && result.routes[0] && result.routes[0].legs) {
            this.routeBuiled = true;

            this.currentMarker.setPosition(this.initMarkerPosition || result.routes[0].legs[0].start_location);
            this.currentMarker.setVisible(true);
            this.polyline.setPath(result.routes[0].overview_path);

            this.infoLine('route', void 0, 0);
            this.snapToRoute.snap();

            this.initMarkerPosition = null;
        }
    }

    infoLine(type, ...params) {
        let element = DOM.get('map.statistics'),
            texts = ElementUtil.getText(element);

        ElementUtil.set(element, 'class', '!loading !error');
        switch (type) {
            case 'route':
                let [distance = this.getRouteDistance(), current = this.getMarkerDistance()] = params;

                ElementUtil.set(element, 'text', StringUtil.substitute(texts.route, {
                    distance: NumberUtil.round(distance, Number(distance < 1)),
                    current: NumberUtil.round(current, Number(current < 1))
                }));
                break;
            case 'wait':
                ElementUtil.set(element, {
                    text: texts.loading,
                    class: 'loading'
                });
                break;
            case 'idle':
                ElementUtil.set(element, 'text', texts.idle);
                break;
            case 'error':
                let [error] = params.map(StringUtil.sanitize);

                ElementUtil.set(element, {
                    text: texts['error' + StringUtil.ucFirst(error)] || texts.errorError,
                    class: 'error'
                });
                break;
        }
    }

    fitToBounds() {
        if (this.routeBuiled) {
            let bounds = new google.maps.LatLngBounds(),
                path = this.polyline.getPath();

            if (path.length > 0) {
                path.forEach(bounds.extend.bind(bounds));
                this.map.fitBounds(bounds);
            }
        }
    }

    frozen(state = true) {
        ElementUtil.set(DOM.get('container.map'), 'class', state ? 'frozen' : '!frozen');
        this.router.draggable(!state);
    }

    getMarketPosition() {
        let distance = this.getMarkerDistance(),
            position = this.currentMarker.getPosition();

        if (!GenericUtil.isEmpty(position) && this.routeBuiled) {
            return {
                position: position.toJSON(),
                distance: NumberUtil.round(distance, Number(distance < 1))
            };
        }

        return null;
    }

    setMarketPosition(coordinates) {
        if (this.currentMarker.visible && this.routeBuiled) {
            this.currentMarker.setPosition(coordinates);
        }
    }

    updateDimensions() {
        if (this.isLoaded) {
            let size = ElementUtil.getSize(DOM.get('container.map'));
            DOM.get('map.canvas').style.height = `${size.height - this.options.canvasOffset}px`;
        }
    }

    get() {
        if (this.isLoaded && this.routeBuiled && this.currentMarker.visible) {
            let distance = this.getRouteDistance();

            return {
                polyline: google.maps.geometry.encoding.encodePath(this.polyline.getPath()),
                marker: this.currentMarker.getPosition().toJSON(),
                distance: NumberUtil.round(distance, Number(distance < 1))
            };
        }

        return null;
    }

    restore(data) {
        if (data !== null) {
            this.initMarkerPosition = new google.maps.LatLng(data.marker);

            FunctionUtil.setImmediate(this.emit.bind(this, 'restore'));
        }
    }

    get canvas() {
        return this.map;
    }
};
