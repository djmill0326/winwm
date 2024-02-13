const create_object = (name, proto={}) => ({ ...proto, name });

export const Control = create_object("Control", {
    children: null,
    init: (ctx) => console.warn("tried to initialize a control with no initialization code")
});

export const create_control = (name, proto=Control, hooks={}) => create_object(name, { ...proto, ...hooks });

export const create_button = (name, onclick) => create_control("Button", Control, {
    children: [],
    init: (ctx) => {
        const root = document.createElement("button");
        root.innerText = name;
        root.className = "wm button";
        root.onclick = onclick;

        ctx.element = root;
        ctx.root.append(root);
    }
});

let animation_queue = new Map();
export const spool_animations = () => {
    animation_queue.forEach(animation => {
        const len = animation.queue.length;
        if (len === 0) return;
        animation.f(animation.queue[len - 1]);
        animation.queue = [];
    });
    requestAnimationFrame(spool_animations);
};

const anim_ms = 1000/48;
export const debounce = (f, ms=anim_ms) => {
    animation_queue.set(f, { f, queue: [] });
    let disabled = false;
    return (ev) => {
        if (disabled) return;
        disabled = true;
        setTimeout(() => disabled = false, ms);
        const anim = animation_queue.get(f);
        if(anim) anim.queue.push(ev);
    }
}

const absolute_pos = (el) => {
    const parent = el.offsetParent;
    const rec = parent ? absolute_pos(parent) : [0, 0];
    return [el.offsetLeft + rec[0], el.offsetTop + rec[1]];
};

export const create_toolbar = (title, window, can_close=true) => create_control("Toolbar", Control, {
    children: [],
    init: (ctx) => {
        const root = document.createElement("span");
        root.className = "wm toolbar";
        const name = document.createElement("span");
        name.className = "wm title";
        name.innerText = title;
        root.append(name);
        ctx.element = root;

        if(can_close) {
            // toolbar close button
            add_control(create_button("✖", () => { 
                // fixme: this is not correct at all
                ctx.root.remove();
                if(window.onclose) window.onclose(ctx);
            }), ctx.control);
        }

        // window movement handling (god is dead)
        let mousedown = false;
        let offset = { x: 0, y: 0 };
        let transform = { x: 0, y: 0 };
        root.addEventListener("mousedown", (ev) => {
            offset.x = ev.x - transform.x;
            offset.y = ev.y - transform.y;
            mousedown = true;
        });
        document.body.addEventListener("click", (ev) => {
            if(mousedown) {
                transform.x = ev.x - offset.x;
                transform.y = ev.y - offset.y;
                mousedown = false;
            }
        });
        document.body.addEventListener("mousemove", debounce((ev) => {
            if(mousedown) {
                const transform =  new CSSTransformValue([new CSSTranslate(
                    CSS.px(ev.x - offset.x), 
                    CSS.px(ev.y - offset.y)
                )]);
                ctx.root.attributeStyleMap.set("transform", transform);
            }
        }));

        ctx.element = root;
        ctx.root.append(root);
    }
});

const pad_two = (x, add="0") => {
    const str = x.toString();
    return str.length === 1 ? add + str : str.substr(0, 2);
}

const daily_ms = 1000 * 60 * 60 * 24;
export const create_clock = (cb) => create_control("Clock", Control, {
    children: [],
    update: (ctx) => {
        const sec = Math.floor(Date.now() % daily_ms / 1000);
        const min = Math.floor(sec / 60);
        const hr = Math.floor(min / 60);
        const str_sec = pad_two(sec % 60);
        const str_min = pad_two(min % 60);
        const str_hr = pad_two(hr % 24);
        const str_hr_loc = str_hr >= 12 ? "PM" : "AM";
        ctx.element.innerText = `${str_hr%12}:${str_min}:${str_sec} ${str_hr_loc}`;
    },
    init: (ctx) => {
        const root = document.createElement("span");
        root.className = "wm clock";

        ctx.element = root;
        ctx.root.append(root);
        ctx.control.update(ctx);
        setInterval(() => ctx.control.update(ctx), 1000);
    }
});

export const create_frame = (name, src, width, height, interactive=1, img) => create_control(name, Control, {
    children: [],
    init: (ctx) => {
        const root = document.createElement("div");
        if(interactive < 1) {
            const overlay = document.createElement("div");
            overlay.style = `
                position: absolute;
                width: 100%;
                height: ${interactive*100}%;
                z-index: 1;
            `;
            root.append(overlay);
        }
        const frame = img ? document.createElement("img") : document.createElement("iframe");
        frame.className = "wm frame";
        frame.src = src;
        frame.width = width;
        frame.height = height;
        root.append(frame);

        ctx.element = root;
        ctx.root.append(root);
    }
});

const create_proxy_frame = (src) => create_control("ProxyFrame", Control, {
    children: [],
    update: (ctx) => {
        if(!ctx.src) return;
        fetch(ctx.src, {
            mode: "no-cors",
            method: "GET"
        }).then(res => res.text()).then(text => {
            ctx.element.innerHTML = text;
        });
    },
    init: (ctx) => {
        const root = document.createElement("div");
        const shadow = root.attachShadow({ mode:"open" });
        ctx.element = shadow;
        ctx.src = src;
        ctx.control.update(ctx);
        ctx.root.append(root);
    }
});

const create_browser = (src="http://localhost/vending", width=1280, height=720, interactive=0.1) => create_control("Browser", Control, {
    children: [],
    init: (ctx) => {
        const root = document.createElement("div");
        root.className = "wm browser";
        add_control(create_frame("BrowserFrame", src, width-6, height-26, interactive), ctx.control);

        ctx.element = root;
        ctx.root.append(root);
    }
});

export const add_control = (control, parent, to_front) => {
    if(to_front) {
        parent.children = [control, ...parent.children];
    } else {
        parent.children.push(control);
    }
}

export const add_hook = (control, hook, cb) => {
    control[hook] = cb;
}

export const wm = {
    Object: create_object,
    Control: create_control,
    Button: create_button,
    Toolbar: create_toolbar,
    Clock: create_clock,
    Frame: create_frame,
    ProxyFrame: create_proxy_frame,
    Browser: create_browser,
    add_control, add_hook, debounce, spool_animations
}

export default wm;