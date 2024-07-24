const std = 4/3;
const alt = 5/3;
const full = 16/9;
const tall = 16/10;

const spec = { std, alt, full, tall };
const frac = Object.freeze({ ...spec, inv: Object.freeze(Object.fromEntries(Object.entries(spec).map(([k, v]) => [k, 1/v]))) });

const r = (h=240, scale=frac.std) => Object.freeze({ w: h * scale, h });

const qvga = r(240, std);
export const res = {

};

// WIP