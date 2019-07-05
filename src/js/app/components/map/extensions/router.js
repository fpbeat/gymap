import {GenericUtil} from '~/js/app/lib/utils';
import EventEmitter from 'events';

export default class extends EventEmitter {

    options = {
        color: '#e57b4a'
    };

    constructor(map, options) {
        super();

        GenericUtil.setOptions(this, options);

        this.router = new google.maps.DirectionsService();
        this.directionsDisplay = new google.maps.DirectionsRenderer({
            map: map,
            draggable: true,
            markerOptions: {},
            polylineOptions: {
                strokeColor: this.options.color
            }
        });

        this.attachEvents();
    }

    route(settings, directions) {
        if (!!directions.from && !!directions.to) {

            this.emit('wait');
            let waypoints = directions.points.map((point) => {
                return {
                    location: point,
                    stopover: true
                };
            });

            this.router.route({
                origin: directions.from,
                destination: directions.to,
                avoidHighways: settings.avoidHighways,
                avoidTolls: settings.avoidTolls,
                travelMode: google.maps.TravelMode.DRIVING,
                unitSystem: google.maps.UnitSystem.METRIC,
                waypoints: waypoints

            }, (result, status) => {
                if (this.routingErrorHandler(status)) {
                    this.directionsDisplay.setDirections(result);
                    this.emit('route', result);
                }
            });
        } else {
            this.emit('emptyDirections');
        }
    }

    attachEvents() {
        google.maps.event.addDomListener(this.directionsDisplay, 'directions_changed', () => {
            this.emit('wait');

            let directions = this.directionsDisplay.getDirections();
            if (this.routingErrorHandler(directions.status)) {
                this.updateDestination(directions);
            }
        });
    }

    updateDestination(result) {
        let places = [];
        for (let point of Object.values(result.geocoded_waypoints)) {
            places.push(point.place_id);
        }

        this.emit('directionsChanged', result, places);
    }

    routingErrorHandler(status) {
        if (status === google.maps.DirectionsStatus.OK) {
            return true;
        }
        this.emit('error', status);
        return false;
    }

    draggable(state) {
        this.directionsDisplay.setOptions({
            draggable: state
        });
    }

}