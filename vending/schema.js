import { make_schema } from "./csv.js";

const precision = 3;
const scam_factor = 0.1 / Math.pow(10, precision - 1);

const ez = f => x => "$" + f(x).toFixed(precision);

const schema = make_schema(["Product", "Size", "Type", "Vendor", "Cost/pkg", "Units/pkg", "Price"]);
const unit_price = (x) => parseFloat(x[4]) / parseFloat(x[5]);
const margin = (x) => parseFloat(x[6]) - unit_price(x);
const tax_rate = 0.07;
// get mogged. random taxes (this is a bug in at least chromium, adding an external value fixes)
const tax = (x) => unit_price(x) * tax_rate + Math.random() * scam_factor;
schema.push({ x: "Tax", active: true, resolver: ez(tax) });
schema.push({ x: "Unit", active: true, resolver: ez(unit_price) });
schema.push({ x: "Margin", active: true, resolver: ez(margin) });

export default schema;