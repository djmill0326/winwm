export const array_iter = (input, offset = 0, reverse = false) => {
    const factor = reverse * 2 - 1;
    const x = reverse ? input.length - offset - 1 : offset;
    let index = 0;
    return () => input[x - index++ * factor];
};
export const kv_iter = (input, offset = 0, reverse = false) => array_iter(Object.keys(input).map(key => ({ key, value: input[key] })), offset, reverse);
export const rev = (f) => (input, offset = 0) => f(input, offset, true);
const transformed = (next, f = x => x) => () => f(next());
const conditional = (next, condition = () => true) => condition() ? next() : null;
const dependent_conditional = (next, condition = (x) => !!x) => {
    const output = next();
    if (condition(output))
        return output;
    else
        return null;
};
const with_accumulator = (next, extend = () => []) => {
    const pre = extend();
    const proto = pre.push ? pre : [];
    for (let x; x = next(); proto.push(x))
        ;
    return proto;
};
const with_accumulator_transformed = (next, f = x => x, extend = () => []) => {
    const pre = extend();
    const proto = pre.push ? pre : [];
    for (let x; x = next(); proto.push(f(x)))
        ;
    return proto;
};
const with_accumulator_conditional = (next, condition = x => !!x, extend = () => []) => {
    const pre = extend();
    const proto = pre.push ? pre : [];
    for (let x; x = next(); condition(x) ? proto.push(x) : null)
        ;
    return proto;
};
const with_accumulator_conditional_transformed = (next, f = x => x, condition = x => !!x, extend = () => []) => {
    const pre = extend();
    const proto = pre.push ? pre : [];
    for (let x; x = next(); condition(x) ? proto.push(f(x)) : null)
        ;
    return proto;
};
export const map = transformed;
export const independent_filter = conditional;
export const filter = dependent_conditional;
export const collect = with_accumulator;
export const collect_map = with_accumulator_transformed;
export const collect_filter = with_accumulator_conditional;
export const collect_filter_map = with_accumulator_conditional_transformed;
export const reduce = (next, sauce = (x, accumulator) => accumulator + x, extend = () => 0) => {
    const accumulator = extend();
    for (let x; x = next(); sauce(x, accumulator))
        ;
    return accumulator;
};
export const map_reduce = (next, f = x => x, sauce = (x, accumulator) => accumulator + x, extend = () => 0) => {
    const accumulator = extend();
    for (let x; x = next(); sauce(f(x), accumulator));
    return accumulator;
};
export const filter_reduce = (next, condition = x => !!x, sauce = (x, accumulator) => accumulator + x, extend = () => 0) => {
    const accumulator = extend();
    for (let x; x = next(); condition(x) ? sauce(x, accumulator) : null);
    return accumulator;
};
export const filter_map_reduce = (next, f = x => x, condition = x => !!x, sauce = (x, accumulator) => accumulator + x, extend = () => 0) => {
    const accumulator = extend();
    for (let x; x = next(); condition(x) ? sauce(f(x), accumulator) : null);
    return accumulator;
};
export const lazy = (next, f = x => x) => () => new Promise((resolve, reject) => {
    const x = next();
    if (x) resolve(f(x));
    else reject("iterator failed to yield");
});
export const lazy_run = (lazy, on_next = () => { }, on_finish = () => { }, init = () => ({})) => {
    const data = init();
    const promise = new Promise(async (resolve) => {
        let x = true;
        while (x) {
            x = await lazy().catch(x => on_finish(x, data));
            x ? on_next(x, data) : null;
        }
        resolve(data);
    });
    return promise;
};
export const lazy_collect = (lazy, accumulator = (x, data) => data.arr.push(x)) => lazy_run(lazy, accumulator, () => { }, () => ({ arr: [] })).then(x => x.arr);
