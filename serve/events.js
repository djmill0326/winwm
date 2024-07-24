const emitter = new Map();
const emitter_simple = new Map();

let idx = 0;
export const register = control => {
    if (control.evid) return;
    control.evid = ++idx;
    control.emit = (name, data) => emit(name, data, control.evid);
    control.on = (name, callback) => on(name, callback, control.evid);
    control.ignore = name => ignore(name, control.evid);
}

export const emit = (name="unknown", data={}, applies_to=null) => {
    const geset = id => {
        const inner = emitter.get(name);
        if (!inner) return;
        const cb = inner.get(id);
        if (cb) cb(data);
    };
    if (typeof applies_to === "number") geset(applies_to);
    else if (applies_to && applies_to.forEach) applies_to.forEach(geset);
    else {
        const cbs = emitter_simple.get(name);
        if (cbs) cbs.forEach(cb => cb(data));
        if (applies_to) { // applies to all
            const inner = emitter.get(name);
            if (inner) inner.forEach(cb => cb(data));
        }
    }
};

export const on = (name="unknown", callback=data=>{}, id=null) => {
    if (typeof id === "number") {
        const inner = emitter.get(name);
        if (inner) inner.set(id, callback);
        else {
            const inner = new Map();
            inner.set(id, callback);
            emitter.set(name, inner);
        }
    } else {
        const cbs = emitter_simple.get(name);
        if (cbs) cbs.add(callback);
        else {
            const cbs = new Set();
            cbs.add(callback);
            emitter_simple.set(name, cbs);
        }
    }
};

export const ignore = (name="unknown", cb_or_id) => {
    const em = typeof cb_or_id === "number" ? emitter : emitter_simple;
    const inner = em.get(name);
    if (inner) {
        inner.delete(cb_or_id);
        if (inner.size === 0) em.delete(name);
    }
};