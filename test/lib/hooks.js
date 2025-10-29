'use strict';

(function() {
    if (typeof window === 'undefined' || typeof React === 'undefined') return;
    const { useCallback, useRef } = React;

    function useDebounce() {
        const timeoutsRef = useRef({});
        const pendingSavesRef = useRef({});

        const debounce = useCallback((key, callback, delay, ...args) => {
            if (timeoutsRef.current[key]) {
                clearTimeout(timeoutsRef.current[key]);
            }
            pendingSavesRef.current[key] = { callback, args };
            timeoutsRef.current[key] = setTimeout(() => {
                callback(...args);
                delete pendingSavesRef.current[key];
                delete timeoutsRef.current[key];
            }, delay);
        }, []);

        const flush = useCallback(() => {
            Object.entries(timeoutsRef.current).forEach(([key, timeout]) => {
                clearTimeout(timeout);
                const pending = pendingSavesRef.current[key];
                if (pending) {
                    pending.callback(...pending.args);
                }
                delete timeoutsRef.current[key];
                delete pendingSavesRef.current[key];
            });
        }, []);

        const cancelAll = useCallback(() => {
            Object.values(timeoutsRef.current).forEach(clearTimeout);
            timeoutsRef.current = {};
            pendingSavesRef.current = {};
        }, []);

        const cancel = useCallback((key) => {
            if (timeoutsRef.current[key]) {
                clearTimeout(timeoutsRef.current[key]);
                delete timeoutsRef.current[key];
                delete pendingSavesRef.current[key];
            }
        }, []);

        return { debounce, flush, cancelAll, cancel };
    }

    window.AppHooks = { useDebounce };
})();


