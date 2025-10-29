'use strict';

(function() {
    if (typeof window === 'undefined') return;

    const stateMap = new WeakMap();

    function getState(el) {
        let s = stateMap.get(el);
        if (!s) {
            s = { 
                scale: 1, x: 0, y: 0,
                startX: 0, startY: 0, isPanning: false,
                lastTap: 0,
                // pinch state
                isPinching: false, pinchStartDist: 0, pinchStartScale: 1,
                pinchCenterX: 0, pinchCenterY: 0,
                rafId: 0
            };
            stateMap.set(el, s);
        }
        return s;
    }

    function applyTransform(el) {
        const s = getState(el);
        el.style.transform = `translate(${s.x}px, ${s.y}px) scale(${s.scale})`;
        el.style.transformOrigin = '0 0';
        el.style.cursor = s.scale > 1 ? 'grab' : 'auto';
        el.style.touchAction = 'none';
    }

    function clamp(val, min, max) { return Math.max(min, Math.min(max, val)); }

    function getBounds(el) {
        const rect = el.getBoundingClientRect();
        const parent = el.parentElement || document.body;
        const pRect = parent.getBoundingClientRect();
        return { rect, pRect };
    }

    function limitPan(el) {
        const s = getState(el);
        const { rect, pRect } = getBounds(el);
        // Размеры исходного изображения до трансформации неизвестны; приблизим по отображаемым
        const scaledW = rect.width;
        const scaledH = rect.height;
        const maxOffsetX = Math.max(0, (scaledW - pRect.width));
        const maxOffsetY = Math.max(0, (scaledH - pRect.height));
        s.x = clamp(s.x, -maxOffsetX, 0);
        s.y = clamp(s.y, -maxOffsetY, 0);
    }

    function zoomAt(el, deltaScale, centerX, centerY) {
        const s = getState(el);
        const prevScale = s.scale;
        const nextScale = clamp(prevScale * deltaScale, 1, 4);
        if (nextScale === prevScale) return;

        // Корректируем панорамирование так, чтобы точка под курсором оставалась на месте
        const rect = el.getBoundingClientRect();
        const offsetX = (centerX - rect.left - s.x) / prevScale;
        const offsetY = (centerY - rect.top - s.y) / prevScale;

        s.x -= offsetX * (nextScale - prevScale);
        s.y -= offsetY * (nextScale - prevScale);
        s.scale = nextScale;
        limitPan(el);
        applyTransform(el);
    }

    function touchesInfo(touches) {
        const [t1, t2] = [touches[0], touches[1]];
        const dx = t2.clientX - t1.clientX;
        const dy = t2.clientY - t1.clientY;
        const dist = Math.sqrt(dx*dx + dy*dy);
        const cx = (t1.clientX + t2.clientX)/2;
        const cy = (t1.clientY + t2.clientY)/2;
        return { dist, cx, cy };
    }

    function onWheel(e) {
        const el = e.target.closest('.image-modal-img');
        if (!el) return;
        e.preventDefault();
        const delta = e.deltaY < 0 ? 1.1 : 0.9;
        zoomAt(el, delta, e.clientX, e.clientY);
    }

    function onPointerDown(e) {
        const el = e.target.closest('.image-modal-img');
        if (!el) return;
        const s = getState(el);
        if (e.pointerType !== 'mouse' || s.scale > 1) {
            s.isPanning = true;
            s.startX = e.clientX - s.x;
            s.startY = e.clientY - s.y;
            el.setPointerCapture && el.setPointerCapture(e.pointerId);
            el.style.cursor = 'grabbing';
        }
    }

    function onPointerMove(e) {
        const el = e.target.closest('.image-modal-img');
        if (!el) return;
        const s = getState(el);
        if (!s.isPanning) return;
        s.x = e.clientX - s.startX;
        s.y = e.clientY - s.startY;
        limitPan(el);
        applyTransform(el);
    }

    function onPointerUp(e) {
        const el = e.target.closest('.image-modal-img');
        if (!el) return;
        const s = getState(el);
        s.isPanning = false;
        el.style.cursor = s.scale > 1 ? 'grab' : 'auto';
    }

    function onDblClick(e) {
        const el = e.target.closest('.image-modal-img');
        if (!el) return;
        const s = getState(el);
        if (s.scale === 1) {
            zoomAt(el, 2, e.clientX, e.clientY);
        } else {
            s.scale = 1; s.x = 0; s.y = 0; applyTransform(el);
        }
    }

    // Простейший double-tap для touch
    function onTouchStart(e) {
        const el = e.target.closest('.image-modal-img');
        if (!el) return;
        const s = getState(el);
        if (e.touches && e.touches.length === 2) {
            // start pinch
            const { dist, cx, cy } = touchesInfo(e.touches);
            s.isPinching = true;
            s.pinchStartDist = dist || 1;
            s.pinchStartScale = s.scale;
            s.pinchCenterX = cx;
            s.pinchCenterY = cy;
            // захват для плавного pan при pinch
            e.preventDefault();
        } else if (e.touches && e.touches.length === 1) {
            // double-tap detection
            const now = Date.now();
            if (now - s.lastTap < 300) {
                const touch = e.touches[0];
                if (s.scale === 1) {
                    zoomAt(el, 2, touch.clientX, touch.clientY);
                } else { s.scale = 1; s.x = 0; s.y = 0; applyTransform(el); }
                s.lastTap = 0;
            } else {
                s.lastTap = now;
            }
        }
    }

    function onTouchMove(e) {
        const el = e.target.closest('.image-modal-img');
        if (!el) return;
        const s = getState(el);
        if (s.isPinching && e.touches && e.touches.length === 2) {
            // pinch zoom
            const { dist, cx, cy } = touchesInfo(e.touches);
            const factor = dist / (s.pinchStartDist || 1);
            const prevScale = s.scale;
            const nextScale = clamp(s.pinchStartScale * factor, 1, 4);
            if (nextScale !== prevScale) {
                // корректируем x/y чтобы центр оставался под пальцами
                const rect = el.getBoundingClientRect();
                const offsetX = (cx - rect.left - s.x) / prevScale;
                const offsetY = (cy - rect.top - s.y) / prevScale;
                s.x -= offsetX * (nextScale - prevScale);
                s.y -= offsetY * (nextScale - prevScale);
                s.scale = nextScale;
                limitPan(el);
            }
            // requestAnimationFrame для плавности
            if (!s.rafId) {
                s.rafId = requestAnimationFrame(() => { s.rafId = 0; applyTransform(el); });
            }
            e.preventDefault();
        }
    }

    function onTouchEnd(e) {
        const el = e.target.closest('.image-modal-img');
        if (!el) return;
        const s = getState(el);
        if (e.touches.length < 2) {
            s.isPinching = false;
        }
    }

    // Делегирование событий на документ
    document.addEventListener('wheel', onWheel, { passive: false });
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerup', onPointerUp);
    document.addEventListener('dblclick', onDblClick);
    document.addEventListener('touchstart', onTouchStart, { passive: false });
    document.addEventListener('touchmove', onTouchMove, { passive: false });
    document.addEventListener('touchend', onTouchEnd, { passive: true });

    // Инициализируем transform для уже вставленных изображений модалки (если есть)
    function initExisting() {
        document.querySelectorAll('.image-modal-img').forEach(applyTransform);
    }
    document.addEventListener('DOMContentLoaded', initExisting);
})();


