import GenericUtil from './generic';
import ObjectUtil from './object';
import StringUtil from './string';

export default {
    inject(el, element, where = 'bottom') {
        var appendInserters = {
            before: 'beforeBegin',
            after: 'afterEnd',
            bottom: 'beforeEnd',
            top: 'afterBegin'
        };

        GenericUtil.getType(element) === 'element' ? el.insertAdjacentElement(appendInserters[where], element) : el.insertAdjacentHTML(appendInserters[where], element);

        return this.discover(el);
    },

    destroy(element) {
        this.empty(element);
        this.dispose(element);
    },

    empty(element) {
        Array.from(element.childNodes).forEach(this.dispose);
    },

    dispose(element) {
        return (element.parentNode) ? element.parentNode.removeChild(element) : element;
    },

    create(name, options = {}) {
        let element = document.createElement(name.toLowerCase());
        this.set(element, options);

        return element;
    },

    discover(container, name = 'data-dom') {
        let elements = container.querySelectorAll(`*[${name}]`);

        let collection = {};
        elements.forEach((node) => {
            let dom = node.getAttribute(name);

            node.removeAttribute(name);
            if (!!dom) {
                collection[StringUtil.toCamelCase(dom)] = node;
            }
        });

        return collection;
    },

    getDataAttibutes(element, base = '') {
        let response = {};
        if (GenericUtil.getType(element) === 'element' && GenericUtil.isIterable(element.attributes)) {
            for (let attribute of element.attributes) {
                let components = String(attribute.nodeName).match(new RegExp(`^data\-${base}\-(.*)`, 'i'));

                if (!GenericUtil.isEmpty(components)) {
                    response[StringUtil.toCamelCase(components[1])] = String(attribute.nodeValue);
                }
            }
        }

        return response;
    },

    getText(element, name = null, def = null) {
        let attibutes = this.getDataAttibutes(element, 'text');

        return name !== null ? (attibutes[name] || def) : attibutes;
    },

    set(element, ...args) {
        let params = args.length === 2 ? {[args[0]]: args[1]} : args[0];

        for (let param of Object.keys(params)) {
            switch (param) {
                case 'html':
                    element.innerHTML = params[param];
                    break;
                case 'text':
                    if (['input', 'button', 'checkbox'].includes(element.tagName.toLowerCase())) {
                        element.value = params[param];
                    } else {
                        element.innerText = params[param];
                    }
                    break;
                case 'class':
                    params[param].split(' ').forEach((name) => {
                        let classTest = String(name).match(/^(\!)?(.*)/);

                        if (StringUtil.trim(name) !== '' && classTest) {
                            element.classList[classTest[1] === '!' ? 'remove' : 'add'].call(element.classList, classTest[2]);
                        }
                    });
                    break;
                default:
                    let hyphenatedParam = StringUtil.hyphenate(param);

                    if (/^data\-/.test(hyphenatedParam) && params[param] === null) {
                        element.removeAttribute(hyphenatedParam);
                    } else {
                        element.setAttribute(hyphenatedParam, params[param]);
                    }
            }
        }

        return element;
    },

    getSize(element) {
        let bounds = element.getBoundingClientRect();

        return ObjectUtil.map(ObjectUtil.pick(['width', 'height'], bounds), parseInt);
    }
};