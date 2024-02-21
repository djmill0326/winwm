import { make_schema } from "./csv.js";

const precision = 3;
const scale = Math.pow(10, precision);
const scam_factor = 0.1 / scale;

const ez = f => x => "$" + (Math.ceil(f(x) * scale) / scale).toFixed(3);

const schema = make_schema(["Product", "Size", "Type", "Vendor", "Cost/pkg", "Units/pkg", "Price"]);
const unit_price = (x) => parseFloat(x[4]) / parseFloat(x[5]);
const margin = (x) => parseFloat(x[6]) - unit_price(x);
const tax_rate = 0.07;
// get mogged. random taxes (this is a bug in at least chromium, adding an external value fixes)
const tax = (x) => unit_price(x) * tax_rate + Math.random() * scam_factor;
const cost = (x) => parseFloat(x[6]) + tax(x);
schema.push({ x: "Unit", active: true, resolver: ez(unit_price) });
schema.push({ x: "Margin", active: true, resolver: ez(margin) });
schema.push({ x: "Tax", active: true, resolver: ez(tax) });
schema.push({ x: "Cost", active: true, resolver: ez(cost) });

export default schema;