/* 阅读器导出用的 IndexedDB 小封装（扩展自身 origin，后台 service worker 和打印页共用）。
 * 不走 chrome.storage.session / runtime 消息：session 只有 10MB 配额，单条消息上限 64MiB，整本书带内联图片轻易就超。
 * docs 表：id -> { id, title, ts, warn, count }；sections 表："id:序号" -> { html, css, ... } */
const ReaderDB = {
  NAME: "bc_reader_export",
  open() {
    return new Promise((res, rej) => {
      const r = indexedDB.open(this.NAME, 1);
      r.onupgradeneeded = () => {
        const db = r.result;
        if (!db.objectStoreNames.contains("docs")) db.createObjectStore("docs");
        if (!db.objectStoreNames.contains("sections")) db.createObjectStore("sections");
      };
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error || new Error("indexedDB open failed"));
    });
  },
  async tx(store, mode, fn) {
    const db = await this.open();
    return new Promise((res, rej) => {
      const t = db.transaction(store, mode);
      let out;
      try { out = fn(t.objectStore(store)); } catch (e) { db.close(); return rej(e); }
      t.oncomplete = () => { db.close(); res(out && out.result !== undefined ? out.result : out); };
      t.onerror = () => { db.close(); rej(t.error || new Error("indexedDB tx failed")); };
      t.onabort = () => { db.close(); rej(t.error || new Error("indexedDB tx aborted")); };
    });
  },
  putDoc(meta) { return this.tx("docs", "readwrite", st => st.put(meta, meta.id)); },
  getDoc(id) { return this.tx("docs", "readonly", st => st.get(id)); },
  putSection(id, i, sec) { return this.tx("sections", "readwrite", st => st.put(sec, id + ":" + i)); },
  getSection(id, i) { return this.tx("sections", "readonly", st => st.get(id + ":" + i)); },
  async remove(id) {
    const meta = await this.getDoc(id).catch(() => null);
    const n = meta && meta.count || 0;
    await this.tx("sections", "readwrite", st => { for (let i = 0; i < Math.max(n, 1); i++) st.delete(id + ":" + i); });
    await this.tx("docs", "readwrite", st => st.delete(id));
  },
  // 清掉超过 maxAge 的旧导出（打印页没打开、打完没触发 afterprint 之类）
  async purge(maxAge) {
    const ids = await this.tx("docs", "readonly", st => {
      const out = { result: [] };
      st.openCursor().onsuccess = ev => { const c = ev.target.result; if (!c) return; if (Date.now() - (c.value.ts || 0) > maxAge) out.result.push(c.key); c.continue(); };
      return out;
    });
    for (const id of ids || []) await this.remove(id).catch(() => {});
  }
};
