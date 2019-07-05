import {GenericUtil, GeoUtil, ObjectUtil, DateUtil, StringUtil, ElementUtil, FunctionUtil} from '~/js/app/lib/utils';
import DOM from '~/js/app/store/dom';
import Swal from '~/js/app/lib/swal';

import EventEmitter from 'events';
import Sortable from 'sortablejs';
import PerfectScrollbar from 'perfect-scrollbar';

export default class extends EventEmitter {

    indexCurrent = 0;
    options = {};
    pool = [];

    constructor(options) {
        super();

        GenericUtil.setOptions(this, options);
        this.bootstrap();
    }

    bootstrap() {
        DOM.set('binding', this.render());
        this.creteScrollbar();

        FunctionUtil.setImmediate(this.restore.bind(this, this.options.data));
    }

    build(data) {
        let tpl = require('~/views/components/binding/point.njk');

        let elements = ElementUtil.inject(DOM.get('binding.points'), tpl.render(Object.assign({}, {
            unbinded: true,
            char: this.indexCurrent + 1
        }, data)));

        this.indexCurrent++;
        this.makeSortable();

        return elements;
    }

    add(data = {}) {
        this.toggleNoPoints(true);

        let point = this.build(data);
        this.attachPointEvents(point);
        this.pool.push(point);

        this.emit('domChanged', Boolean(data.scrollDown));

        return point;
    }

    toggleNoPoints(state) {
        ElementUtil.set(DOM.get('binding.pointsContainer'), 'class', state ? '!hidden' : 'hidden');
        ElementUtil.set(DOM.get('binding.noPoints'), 'class', state ? 'hidden' : '!hidden');

        this.emit('domChanged');
    }

    render() {
        let tpl = require('~/views/components/binding/index.njk');

        ElementUtil.empty(DOM.get('container.binding'));
        return ElementUtil.inject(DOM.get('container.binding'), tpl.render());
    }

    creteScrollbar() {
        this.scollbar = new PerfectScrollbar(DOM.get('container.binding'), {
            wheelPropagation: false,
            suppressScrollX: true,
            wheelSpeed: 0.5,
            scrollYMarginOffset: 30
        });
    }

    attachPointEvents(point) {
        point.remove.addEventListener('click', this.remove.bind(this, point));
        point.makeBinding.addEventListener('click', this.makeBinding.bind(this, point));
        point.seekMap.addEventListener('click', this.seekToMap.bind(this, point));
        point.seekVideo.addEventListener('click', this.seekToVideo.bind(this, point));
    }

    makeSortable() {
        if (this.sortable instanceof Sortable) {
            this.sortable.destroy();
        }

        this.sortable = new Sortable(DOM.get('binding.points'), {
            ghostClass: 'gymap-sortable-ghost',
            handle: 'span',
            onEnd: (event) => {
                if (parseInt(event.newIndex, 10) !== parseInt(event.oldIndex, 10)) {
                    this.rebuild();
                }
            }
        });
    }

    remove(point) {
        Swal.confirm(ElementUtil.getText(point.container, 'remove')).then(() => {
            ElementUtil.destroy(point.container);

            this.rebuild();

            if (this.indexCurrent === 0) {
                this.toggleNoPoints(false);
            }

            this.emit('domChanged');
            this.pool = this.pool.filter(element => element !== point);
        });
    }

    removeAllPoints() {
        this.indexCurrent = 0;
        this.pool = [];

        ElementUtil.empty(DOM.get('binding.points'));
        this.emit('domChanged');
    }

    resetBinding() {
        for (let point of this.pool) {
            if (point.container.getAttribute('data-binded') !== null) {
                this.setBinding(point, {}, {});
            }
        }
    }

    rebuild() {
        let elements = DOM.get('binding.points').childNodes;

        this.indexCurrent = 0;
        for (let element of elements) {
            let elementsSpan = element.querySelector('span');

            if (GenericUtil.getType(elementsSpan) === 'element') {
                ElementUtil.set(elementsSpan, 'text', this.indexCurrent + 1);
                this.indexCurrent++;
            }
        }
    }

    setClonedPlaces(points) {
        if (points.length > 0) {
            this.removeAllPoints();
            points.forEach(point => this.add({name: point}));
        }

    }

    makeBinding(point) {
        this.emit('bind', point);
    }

    updateDimensions(scrollBottom) {
        this.scollbar.update();

        if (scrollBottom) {
            DOM.get('container.binding').scrollTop = 100000;
        }
    }

    setBinding(point, map, video) {
        let texts = ElementUtil.getText(point.makeBinding),
            isBinded = point.container.getAttribute('data-binded') !== null;

        if (map === null || video === null) {
            Swal.alert(ElementUtil.getText(point.makeBinding, map === null ? 'noMapRouted' : 'noVideoLoaded'));

            return;
        }

        if (!isBinded && this.checkSimilarBinding(map.position, video.value)) {
            Swal.alert(ElementUtil.getText(point.makeBinding, 'alreadyPresent'));

            return;
        }

        ElementUtil.set(point.map, {
            dataPosition: !isBinded ? GeoUtil.toStringCoordinates(map.position) : null,
            text: !isBinded ? StringUtil.substitute(ElementUtil.getText(point.map, 'distance'), {
                distance: map.distance
            }) : '-'
        });

        ElementUtil.set(point.video, {
            dataPosition: !isBinded ? video.value : null,
            text: !isBinded ? video.formatted : '-'
        });

        ElementUtil.set(point.makeBinding, 'text', !isBinded ? texts.unbind : texts.bind);

        [point.seekMap, point.seekVideo].forEach(element => ElementUtil.set(element, 'class', isBinded ? 'gymap-binding-control-disabled' : '!gymap-binding-control-disabled'));

        ElementUtil.set(point.container, 'data-binded', !isBinded || null);
    }

    checkSimilarBinding(map, video) {
        for (let point of this.pool) {
            if (point.container.getAttribute('data-binded') !== null) {
                let attr = [point.video.getAttribute('data-position'), point.map.getAttribute('data-position')].map(String);

                if (attr.join('') === [video, GeoUtil.toStringCoordinates(map)].map(String).join('')) {
                    return true;
                }
            }
        }

        return false;
    }

    seekToMap(point) {
        if (point.container.getAttribute('data-binded') !== null) {
            let coordinates = GeoUtil.parseCoordinates(point.map.getAttribute('data-position'));

            if (coordinates === null) {
                Swal.alert(ElementUtil.getText(point.seekMap, 'noSeek'));
                return;
            }

            this.emit('seekToMarker', coordinates);
        }
    }

    seekToVideo(point) {
        if (point.container.getAttribute('data-binded') !== null) {
            let position = parseInt(point.video.getAttribute('data-position'));

            if (position === null) {
                Swal.alert(ElementUtil.getText(point.seekVideo, 'noSeek'));
                return;
            }

            this.emit('seekToVideo', position);
        }
    }

    get() {
        let bindings = [];

        for (let point of this.pool) {
            let params = {
                binded: point.container.getAttribute('data-binded') !== null,
                name: StringUtil.trim(point.name.value),
            };

            if (params.binded) {
                Object.assign(params, {
                    video: parseInt(point.video.getAttribute('data-position')),

                    map: {
                        distance: parseFloat(point.map.value.replace(/([^\d\.]+)/, '')),
                        coordinates: GeoUtil.parseCoordinates(point.map.getAttribute('data-position'))
                    }
                });
            }

            bindings.push(params);
        }

        return bindings;
    }

    restore(data) {
        if (data !== null) {
            let bindings = Array.from(data);
            if (bindings.length > 0) {
                for (let binding of bindings) {
                    let point = this.add(ObjectUtil.pick(['name'], binding));

                    if (binding.binded) {
                        this.setBinding(point, {
                            position: GeoUtil.parseCoordinates(binding.map.coordinates),
                            distance: binding.map.distance
                        }, {
                            value: binding.video,
                            formatted: DateUtil.secondsToTime(parseInt(binding.video))
                        });
                    }
                }
            }
        }
    }
}