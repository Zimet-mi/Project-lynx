'use strict';

(function() {
    if (typeof window === 'undefined') return;

    const stateMap = new WeakMap();

    function getState(el) {
        let s = stateMap.get(el);
        if (!s) {
            s = { scale: 1, x: 0, y: 0, startX: 0, startY: 0, isPanning: false, lastTap: 0 };
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
        const now = Date.now();
        if (now - s.lastTap < 300) {
            // double-tap
            const touch = e.touches[0];
            if (s.scale === 1) {
                zoomAt(el, 2, touch.clientX, touch.clientY);
            } else { s.scale = 1; s.x = 0; s.y = 0; applyTransform(el); }
            s.lastTap = 0;
        } else {
            s.lastTap = now;
        }
    }

    // Делегирование событий на документ
    document.addEventListener('wheel', onWheel, { passive: false });
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerup', onPointerUp);
    document.addEventListener('dblclick', onDblClick);
    document.addEventListener('touchstart', onTouchStart, { passive: true });

    // Инициализируем transform для уже вставленных изображений модалки (если есть)
    function initExisting() {
        document.querySelectorAll('.image-modal-img').forEach(applyTransform);
    }
    document.addEventListener('DOMContentLoaded', initExisting);
})();


