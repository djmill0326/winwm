let w = window;

let r;
export const con = (f, cb) => (...x) => (r = f(...x)) ? cb(r) : void 0; // con = with

export const get = (x, fb=null) => w[x] ? w[x] : w[x] = fb;
export const set = (x, value) => w[x] = value;

export const list_get = (x, i=-1) => i >= 0 ? get(x, [])[i] : get(x, []);
export const list_set = (x, i, v) => get(x, [])[i] = v;
export const list_put = (x, v) => get(x, []).push(v);
export const list_pop = (x, s) => s ? get(x, []).shift() : get(x, []).pop();

export const map_get  = (x, k) => k ? get(x, new Map()).get(k) : get(x, new Map());
export const map_set  = (x, k, v) => get(x, new Map()).set(k, v);
export const map_del  = (x, k) => get(x, new Map()).delete(k);

export const set_get  = (x, v) => v ? (get(x, new Set()).has(v) ? v : void 0) : get(x, new Set());
export const set_set  = (x, v) => get(x, new Set()).add(v);
export const set_del  = (x, v) => get(x, new Set()).delete(v);

function _has(x, k, f) {
    const v = this.f(x, k);
    if (f && v) f(v);
    return !!v;
}

export const map_has = _has.bind({ f: map_get });
export const set_has = _has.bind({ f: set_get });