'use evil mode';
const TRADE_NAME = "MK ULTRA";
const mk_handler = (context) => {
    const Ctx = {
        event_handlers: new Map(),
        proxy_pass: (el, event_name, ev) => {
            console.debug(TRADE_NAME, el, event_name, ev);
            const handlers = Ctx.event_handlers.get(el);
            if (handlers) {
                const handler = handlers.get(event_name);
                if (handler)
                    handler(ev, context);
            }
        },
        set_event_listener: (el, event_name, f) => {
            if (!Ctx.event_handlers.has(el))
                Ctx.event_handlers.set(el, new Map());
            const handler = Ctx.event_handlers.get(el);
            handler === null || handler === void 0 ? void 0 : handler.set(event_name, f);
            // i'm doing it like this for plot reasons
            el["on" + event_name] = (ev) => Ctx.proxy_pass(el, event_name, ev);
            return handler;
        }
    };
    return Ctx;
};
const mk_counter = (display_name = TRADE_NAME) => {
    const the_count = { x: 0 };
    return { display_name, get: (inc = 1) => { the_count.x += inc; return the_count.x; } };
};
export const evil_counter = mk_counter();
// it's bound to work this time...
const mk_ultra = (event_proxy, el) => {
    el.classList.add(TRADE_NAME.replace(" ", "-").toLowerCase());
    if (!el.id || el.id.length === 0)
        el.id = "elided" + evil_counter.get();
    event_proxy.set_event_listener(el, "click", (a, _) => { console.debug("denied"); return false; });
};
export const mk_context = (root, display_name = TRADE_NAME) => {
    // ok so basically it's gonna be something like this:
    // as close to the raw DOM as possible
    // event proxy
    // updates solely via events
    const event_proxy = mk_handler({ display_name, root });
    // make root ULTRA
    mk_ultra(event_proxy, root);
    const children = new Map();
    const Ctx = { display_name, root, children, event_proxy };
    return Ctx;
};
export const mk_append = (context) => (el) => {
    var _a, _b;
    (_a = context.children) === null || _a === void 0 ? void 0 : _a.set(el, mk_context(el));
    context.root.append(el);
    return (_b = context.children) === null || _b === void 0 ? void 0 : _b.get(el);
};
export const mk_program = (context) => {
    console.warn("created program", context);
    const append = mk_append(context);
    const hi = document.createElement("h1");
    hi.attributeStyleMap.set("display", "none");
    hi.id = "hi";
    hi.append("hi");
    append(hi);
    return { context, append };
};
export default (name) => mk_program(mk_context(document.body, name));
