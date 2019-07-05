import Swal from 'sweetalert2/dist/sweetalert2.js';
import DOM from '~/js/app/store/dom';

export default class {
    static options = {
        showCloseButton: true,
        showCancelButton: false,
        scrollbarPadding: false,
        animation: false,
        heightAuto:false,
        onClose: swal => swal.classList.remove('swal2-open-animation'),
        customClass: {
            popup: 'swal2-open-animation'
        }
    };

    static confirm(text, options = {}) {
        return new Promise(resolve => {
            Swal.fire(Object.assign({}, this.options, {
                confirmButtonText: 'Да',
                cancelButtonText: 'Нет',
                showCancelButton: true,
                text: text,
                target: DOM.get('container.app')
            }, options)).then(response => {
                if (response.value) {
                    resolve();
                }
            });
        });
    }

    static alert(text, options = {}) {
        Swal.fire(Object.assign({}, this.options, {
            confirmButtonText: 'OK',
            text: text,
            target: DOM.get('container.app')
        }, options));
    }

    static isVisible() {
        return Swal.isVisible();
    }
}