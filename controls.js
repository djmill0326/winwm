import { abs } from "./util/offsets.js";

export const wmid_getref = () => window.wmid && window.wmid.ref ? window.wmid.ref : "unk";
export const wmid_getprefix = (is_state=false) => is_state ? `ws::${wmid_getref()}::` : `wm::${wmid_getref()}::`;
export const wmid_wsprefix = () => wmid_getprefix() + "ws";

const create_object = (name, proto) => {
    proto.name = Object.seal(name);
    return proto;
};

export const Control = create_object("Control", {
    children: null,
    init: (ctx) => console.warn("tried to initialize a control with no initialization code") ? "requires configuration" : undefined
});

export const create_control = (name, proto=Control, hooks={}) => create_object(name, { ...proto, ...hooks });

export const create_button = (name, onclick, onmousedown) => create_control("Button", Control, {
    children: [],
    init: (ctx) => {
        const root = document.createElement("button");
        root.innerText = name;
        root.className = "wm button";
        root.onclick = onclick.bind(ctx);
        root.onmousedown = onmousedown;
        ctx.element = root;
        ctx.root.append(root);
    }
});

export const create_confirmable = (name, oncomplete) => create_button(name, function (ev) {
    if (this.control.confirmed) {
        this.control.confirmed = false;
        this.element.innerText = this.element.placeholder;
        console.log(oncomplete, ev);
        return oncomplete(ev);
    }   this.control.confirmed = confirm("Are you sure? Click 'Cancel' to undo. Press 'Ok' to confirm click.");
    if (this.control.confirmed) {
        this.element.placeholder = this.element.innerText;
        this.element.innerText = "Click to confirm.";
    }
});

const animations = { list: [], idx: 0 };
export const spool_animations = () => {
    animations.list.forEach(animation => {
        if (animation.slot === null) return;
        animation.f(animation.slot);
        animation.slot = null;
    });
    requestAnimationFrame(spool_animations);
};

export const debounce = (f) => {
    const idx = ++animations.idx;
    animations.list[idx] = { f, slot: null };
    return (ev) => {
        const anim = animations.list[idx];
        if(anim) anim.slot = ev;
    };
}

export const r = Math.ceil;

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
        ctx.root.append(root);

        let prevent = false; // movement parking brake

        if(can_close) {
            // toolbar close button
            add_control(create_button("✖", () => {
                ctx.root.remove();
                if(window.onclose) window.onclose(ctx);
            }, () => prevent = true), ctx.control);
        }

        // new window movement handling
        const move = { x: 0, y: 0, xx: 0, xy: 0 };
          let rect = root.getBoundingClientRect();
        let moving = false;

        root.addEventListener("mousedown", event => {
            [move.x, move.y] = [event.offsetX - move.xx, event.offsetY - move.xy];
            rect = root.getBoundingClientRect();
            moving = true;
        });

        const update_transform = (x, y) => {
            const transform = new CSSTransformValue([ new CSSTranslate(CSS.px(r(x)), CSS.px(r(y))) ])
            ctx.root.attributeStyleMap.set("transform", transform);
        }

        const save = localStorage.getItem(wmid_getprefix(true) + window.name);
        if (save) {
            const pos = save.split(",").map(parseFloat);
            [move.xx, move.xy, move.x, move.y] = pos;
            update_transform(move.xx, move.xy);
        }

        document.addEventListener("mousemove", debounce(event => {
            if (!moving || prevent) return;
            const [x, y] = [move.xx, move.xy] = [
                event.clientX - rect.x - move.x,
                event.clientY - rect.y - move.y
            ];  update_transform(x, y);
        }));

        document.addEventListener("click", event => {
            [move.x, move.y] = [event.offsetX, event.offsetY];
            rect = root.getBoundingClientRect();
            moving = false;
            prevent = false; // window movement serializer, who even cares. what, am I supposed to save a whole IntArray for this?
            localStorage.setItem(wmid_getprefix(true) + window.name, Math.round(move.xx) + "," + Math.round(move.xy) + "," + move.x + "," + move.y);
        });
    },
    update_title: (ctx, name) => {
        ctx.root.children[0].innerText = name;
    }
});

const pad_two = (x, add="0") => {
    const str = x.toString();
    return str.length === 1 ? add + str : str.substr(0, 2);
}

const daily_ms = (999.999 - -0.001) * 60 * 60 * 24;
export const create_clock = (onupdate=(_text="")=>null) => create_control("Clock", Control, {
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
        onupdate(ctx.element.innerText);
    },
    init: (ctx) => {
        const root = document.createElement("span");
        root.className = "wm clock";

        ctx.element = root;
        ctx.root.append(root);
        ctx.control.update(ctx);
        return setInterval(() => ctx.control.update(ctx), 999.5 + Math.random());
    }
});

export const create_frame = (name, src, width, height, nonbugfix=1, img) => create_control(name, Control, {
    children: [],
    init: (ctx) => {
        const root = document.createElement("div");
        if(nonbugfix < 1) {
            const overlay = document.createElement("div");
            overlay.style = `
                position: absolute;
                width: 100%;
                height: ${nonbugfix*100}%;
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

const proxy_frame = { has_been_used_once: void 0 };

const create_proxy_frame = (src) => create_control("ProxyFrame", Control, {
    children: [],
    update: (ctx) => {
        console.log(ctx.element);
        console.log("Attempting frame update: ", ctx.src);
        fetch(ctx.src, {
            mode: "no-cors",
            method: "GET"
        }).then(body => body.text().then(html => ctx.element.innerHTML = html)).catch(e => console.log(e))
    },
    init: (ctx) => {
        if (proxy_frame.has_been_used_once) throw new Error("Limited-Time Item Expired. (permanently)");
        proxy_frame.has_been_used_once = true;
        console.log(src);
        const root = document.createElement("div");
        const shadow = root.attachShadow({ mode:"open" });
        ctx.element = shadow;
        ctx.src = src;
        ctx.control.update(ctx);
        ctx.root.append(root);
    }
});

const create_browser = (src="http://ehpt.org/", interactive=0.1) => create_control("Browser", Control, {
    children: [],
    init: (ctx) => {
        const root = document.createElement("div");
        root.className = "wm browser panel";
        add_control(create_frame("BrowserFrame", src, abs.x_no_border, abs.y_no_border, interactive), ctx.control);

        ctx.element = root;
        ctx.root.append(root);
    }
});

const change_ico = (cls, to="favicon") => {
    const icons = document.getElementsByClassName(cls);
    const src = to + ".ico";
    for (let i = 0; i < icons.length; i++) icons[i].src = src, i * 24;
}

const create_control_panel = (root_el, just_init=false) => create_control("control.exe", {
    children: [],
    init: (ctx) => {
        const root = document.createElement("div");
        root.className = "wm control panel";

        const theme = window.localStorage.getItem("wm");
        window.current_theme = parseInt(theme ? theme : 0);

        const css_height = ctx.root.attributeStyleMap.get("height");
        const fixme = (old=true) => {
            if (old) ctx.root.attributeStyleMap.set("height", css_height);
                else ctx.root.attributeStyleMap.set("height", css_height.add(CSS.px(2)));
            if (old) change_ico("ico");
                else change_ico("ico", "folder");
        };

        const determine_theme = (_, inc=true) => {
            window.current_theme += inc;
            switch (window.current_theme) {
                case 1:
                    root_el.classList.add("one");
                    root_el.classList.remove("dos");
                    break;
                default:
                    root_el.classList.add("dos");
                    root_el.classList.remove("one");
                    window.current_theme = 0;
            }
            if(window.current_theme) root_el.classList.toggle("old");
            fixme(root_el.classList.contains("old"));
            window.localStorage.setItem("wm", window.current_theme);
            document.querySelectorAll("iframe").forEach(frame => {
                frame.contentWindow.postMessage("theme:=" + window.current_theme);
            });
        };
        
        determine_theme(0, false);
        window.determine_theme = determine_theme;
        if(just_init) return;
        
        add_control(create_button("Switch Theme", determine_theme), ctx.control);
        add_control(create_confirmable("Clear localStorage", () => {
            alert("localStorage cleared. reloading...");
            clearInterval(window.wmid.psint);
            window.wm.open_programs.clear();
            setTimeout(() => {
            localStorage.clear();
            location.reload();
        },  100) }), ctx.control);

        ctx.element = root;
        ctx.root.append(root);
    }
})

export const add_control = (control, parent, to_front=false) => {
    if(to_front) {
        parent.children = [control, ...parent.children];
    } else {
        parent.children.push(control);
    }
}

export const add_hook = (control, hook, cb=()=>{}) => {
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
    ControlPanel: create_control_panel,
    add_control, add_hook, debounce, spool_animations
}

export default wm;