export default class {
    eventsPool = [];

    constructor(map, marker, polyline) {
        this.routePixels = [];
        this.map = map;
        this.marker = marker;
        this.polyline = polyline;
    }

    snap() {
        this.unsnap();

        this.normalProj = this.map.getProjection();
        this.loadLineData();
        this.loadMapListener();
    }

    unsnap() {
        this.normalProj = null;
        this.routePixels = [];
        this.eventsPool.map(instance => instance.remove());
    }

    // updateTargets() {
    //     this.marker = marker || this.marker;
    //     this.polyline = polyline || this.polyline;
    //     this.loadLineData();
    // }

    loadMapListener() {
        let dragendEvent = google.maps.event.addListener(this.marker, "dragend", evt => {
            this.updateMarkerLocation(evt.latLng);
        });

        let dragEvent = google.maps.event.addListener(this.marker, "drag", evt => {
            this.updateMarkerLocation(evt.latLng);
        });

        let zoomEndEvent = google.maps.event.addListener(this.map, "zoomend", evt => {
            this.loadLineData();
        });

        this.eventsPool.push(dragendEvent, dragEvent, zoomEndEvent);
    }

    loadLineData() {
        this.routePixels = [];
        let path = this.polyline.getPath();
        for (let i = 0; i < path.getLength(); i++) {
            let Px = this.normalProj.fromLatLngToPoint(path.getAt(i));
            this.routePixels.push(Px);
        }
    };

    updateMarkerLocation(mouseLatLng) {
        let markerLatLng = this.getClosestLatLng(mouseLatLng);
        this.marker.setPosition(markerLatLng);
    };

    getClosestLatLng(latlng) {
        let r = this.distanceToLines(latlng);
        return this.normalProj.fromPointToLatLng(new google.maps.Point(r.x, r.y));
    };

    getDistAlongRoute(latlng) {
        if (typeof (opt_latlng) === 'undefined') {
            latlng = this.marker.getPosition();
        }

        let r = this.distanceToLines(latlng);
        return this.getDistToLine(r.i, r.to);
    };

    distanceToLines(mouseLatLng) {
        let mousePx = this.normalProj.fromLatLngToPoint(mouseLatLng);
        let routePixels = this.routePixels;
        return this.getClosestPointOnLines(mousePx, routePixels);
    };

    getDistToLine(line, to) {
        let routeOverlay = this.polyline.getPath();
        let d = 0;
        for (let n = 1; n < line; n++) {
            d += google.maps.geometry.spherical.computeDistanceBetween(routeOverlay.getAt(n - 1), routeOverlay.getAt(n));
        }
        d += google.maps.geometry.spherical.computeDistanceBetween(routeOverlay.getAt(line - 1), routeOverlay.getAt(line)) * to;
        return d;
    };

    getClosestPointOnLines(pXy, aXys) {
        let minDist;
        let to;
        let from;
        let x;
        let y;
        let i;
        let dist;

        if (aXys.length > 1) {
            for (let n = 1; n < aXys.length; n++) {
                if (aXys[n].x !== aXys[n - 1].x) {
                    let a = (aXys[n].y - aXys[n - 1].y) / (aXys[n].x - aXys[n - 1].x);
                    let b = aXys[n].y - a * aXys[n].x;
                    dist = Math.abs(a * pXy.x + b - pXy.y) / Math.sqrt(a * a + 1);
                } else {
                    dist = Math.abs(pXy.x - aXys[n].x);
                }

                let rl2 = Math.pow(aXys[n].y - aXys[n - 1].y, 2) + Math.pow(aXys[n].x - aXys[n - 1].x, 2);
                let ln2 = Math.pow(aXys[n].y - pXy.y, 2) + Math.pow(aXys[n].x - pXy.x, 2);
                let lnm12 = Math.pow(aXys[n - 1].y - pXy.y, 2) + Math.pow(aXys[n - 1].x - pXy.x, 2);
                let dist2 = Math.pow(dist, 2);
                let calcrl2 = ln2 - dist2 + lnm12 - dist2;
                if (calcrl2 > rl2) {
                    dist = Math.sqrt(Math.min(ln2, lnm12));
                }

                if ((minDist == null) || (minDist > dist)) {
                    to = Math.sqrt(lnm12 - dist2) / Math.sqrt(rl2);
                    from = Math.sqrt(ln2 - dist2) / Math.sqrt(rl2);
                    minDist = dist;
                    i = n;
                }
            }
            if (to > 1) {
                to = 1;
            }
            if (from > 1) {
                to = 0;
                from = 1;
            }
            let dx = aXys[i - 1].x - aXys[i].x;
            let dy = aXys[i - 1].y - aXys[i].y;

            x = aXys[i - 1].x - (dx * to);
            y = aXys[i - 1].y - (dy * to);
        }
        return {
            'x': x,
            'y': y,
            'i': i,
            'to': to,
            'from': from
        };
    };
}
