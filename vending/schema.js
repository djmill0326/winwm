import { make_schema } from "./csv.js";

const precision = 3;
const scale = Math.pow(10, precision);
const scam_factor = 0.1 / scale;

const clean = x => (Math.ceil(x * scale) / scale);
const ez = (f, d=3) => x => clean(f(x)).toFixed(d);
const pad = (f, w=5, c="0") => y => { let x = f(y); let pre = ""; for (let i = 0; i < Math.max(w - x.length, 0); i++) pre += c; return pre + x; }

const unit_price = (x) => parseFloat(x[4]) / parseFloat(x[5]);
const margin = (x) => parseFloat(x[6]) - unit_price(x);
const tax_rate = 0.07;
// get mogged. random taxes (this is a bug in at least chromium, adding an external value fixes)
const tax = (x) => unit_price(x) * tax_rate + Math.random() * scam_factor;
const cost = (x) => parseFloat(x[6]) + tax(x);

const schema = make_schema();
schema.push({ x: "Product", active: true });
schema.push({ x: "Size", active: true, resolver: pad(ez(x => x[1], 2), 3) });
schema.push({ x: "Type", active: true });
schema.push({ x: "Vendor", active: true });
schema.push({ x: "Cost", active: true, resolver: pad(ez(x => x[4], 2)) });
schema.push({ x: "Units", active: true });
schema.push({ x: "Price", active: true, resolver: ez(x => x[6], 2) });
schema.push({ x: "We Pay", active: true, resolver: ez(unit_price) });
schema.push({ x: "Margin", active: true, resolver: ez(margin) });
schema.push({ x: "Tax", active: true, resolver: ez(tax) });
schema.push({ x: "They Pay", active: true, resolver: ez(cost) });

export default schema;