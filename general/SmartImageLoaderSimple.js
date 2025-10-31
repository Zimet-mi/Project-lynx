class SmartImageLoader {
    constructor() {
        this.queue = []; this.inProgress = new Set(); this.loaded = new Set();
        this.maxConcurrent = 4; this.isIdle = false; this.callbacks = new Map();
    }
    addImages(urls, priority = 'normal', onLoadCallback = null) {
        urls.forEach(url => {
            if (this.loaded.has(url)) { if (onLoadCallback) onLoadCallback(url); return; }
            if (this.queue.some(i => i.url === url)) { return; }
            if (onLoadCallback) { const set = this.callbacks.get(url) || new Set(); set.add(onLoadCallback); this.callbacks.set(url, set); }
            this.queue.push({ url, priority: 50, added: Date.now() });
        });
        this.processQueue();
    }
    processQueue() { while (this.inProgress.size < this.maxConcurrent && this.queue.length) { const t = this.queue.shift(); this.loadImage(t.url); } if (!this.queue.length && !this.inProgress.size) this.isIdle = true; }
    loadImage(url) { if (this.inProgress.has(url)) return; this.inProgress.add(url); const img = new Image();
        img.onload = () => { this.loaded.add(url); const set = this.callbacks.get(url); if (set) { set.forEach(cb => { try { cb(url); } catch {} }); this.callbacks.delete(url); } this.inProgress.delete(url); this.processQueue(); };
        img.onerror = () => { this.inProgress.delete(url); this.processQueue(); };
        img.src = url; }
    startBackgroundLoading(urls) { if (this.isIdle) this.addImages(urls, 'low'); }
}
window.imageLoader = new SmartImageLoader();


