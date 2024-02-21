'use evil mode';

const TRADE_NAME = "MK ULTRA";

const mk_handler = (context: ReturnType<typeof mk_context>) => {
    const Ctx: {
        event_handlers: Map<HTMLElement, Map<string, (ev: Event, context: ReturnType<typeof mk_context>) => boolean>>,
        proxy_pass: (el: HTMLElement, event_name: string, ev: Event) => any,
        set_event_listener: (el: HTMLElement, event_name: string, f: (ev: Event, context?: ReturnType<typeof mk_context>) => boolean) => any
    } = {
        event_handlers: new Map(),
        proxy_pass: (el, event_name, ev) => {
            console.debug(TRADE_NAME, el, event_name, ev)
            const handlers = Ctx.event_handlers.get(el);
            if (handlers) {
                const handler = handlers.get(event_name);
                if(handler) handler(ev, context);
            }
        },
        set_event_listener: (el, event_name, f) => {
            if (!Ctx.event_handlers.has(el)) Ctx.event_handlers.set(el, new Map());
            const handler = Ctx.event_handlers.get(el);
            handler?.set(event_name, f);
            // i'm doing it like this for plot reasons
            el["on" + event_name] = (ev) => Ctx.proxy_pass(el, event_name, ev);
            return handler;
        }
    };
    return Ctx;
}

const mk_counter = (display_name=TRADE_NAME) => {
    const the_count = { x: 0 };
    return { display_name, get: (inc=1) => { the_count.x += inc; return the_count.x; }};
};

export const evil_counter = mk_counter();

// it's bound to work this time...
const mk_ultra = (event_proxy: ReturnType<typeof mk_handler>, el: HTMLElement) => {
    el.classList.add(TRADE_NAME.replace(" ", "-").toLowerCase());
    if (!el.id || el.id.length === 0) el.id = "elided" + evil_counter.get();
    event_proxy.set_event_listener(el, "click", (a, _) => { console.debug("denied"); return false; });
}

export const mk_context = (root: HTMLElement, display_name=TRADE_NAME) => {
    // ok so basically it's gonna be something like this:
    // as close to the raw DOM as possible
    // event proxy
    // updates solely via events
    const event_proxy = mk_handler({ display_name, root });

    // make root ULTRA
    mk_ultra(event_proxy, root);

    const children: Map<HTMLElement, typeof Ctx> = new Map();

    const Ctx: {
        display_name: string,
        root: HTMLElement,
        children?: typeof children,
        event_proxy?: typeof event_proxy
    } = { display_name, root, children, event_proxy };
    return Ctx;
};

export const mk_append = (context: ReturnType<typeof mk_context>) => (el: HTMLElement) => {
    context.children?.set(el, mk_context(el));
    context.root.append(el);
    return context.children?.get(el);
}

export const mk_program = (context: ReturnType<typeof mk_context>) => {
    console.warn("created program", context);
    const append = mk_append(context);
    const hi = document.createElement("h1");
    hi.attributeStyleMap.set("display", "none");
    hi.id = "hi";
    hi.append("hi");
    append(hi);
    return { context, append };
};

export default (name: string) => mk_program(mk_context(document.body, name));