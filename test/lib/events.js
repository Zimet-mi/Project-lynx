'use strict';

(function() {
    if (typeof window === 'undefined') return;
    const listeners = {};

    function on(event, handler) {
        (listeners[event] = listeners[event] || new Set()).add(handler);
        return () => off(event, handler);
    }

    function off(event, handler) {
        if (!listeners[event]) return;
        listeners[event].delete(handler);
    }

    function emit(event, payload) {
        if (!listeners[event]) return;
        // Копируем, чтобы не сломаться при отписке в обработчике
        Array.from(listeners[event]).forEach(fn => {
            try { fn(payload); } catch (e) { console.error(e); }
        });
    }

    window.AppEvents = { on, off, emit };
})();


