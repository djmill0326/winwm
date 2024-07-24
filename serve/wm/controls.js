import { register } from "./events.js";
import { pos } from "./options.js";
import determine_theme from "./util/theme.js";

export const wmid_getref = () => window.wmid && window.wmid.ref ? window.wmid.ref : "unk";
export const wmid_getprefix = (is_state=false) => is_state ? `ws::${wmid_getref()}::` : `wm::${wmid_getref()}::`;
export const wmid_wsprefix = () => wmid_getprefix() + "ws";

const create_object = (name, proto) => {
    proto.name = name;
    return proto;
};

export const Control = create_object("Control", {
    children: null,
    init: (ctx) => console.warn("tried to initialize a control with no initialization code") ? "requires configuration" : undefined
});

export const create_control = (name, proto=Control, hooks={}, should_register=false) => {
    const control = create_object(name, { ...proto, ...hooks });
    if (should_register) register(control);
    return control;
};

export const create_button = (name, onclick, onmousedown, ...info) => create_control("Button", Control, {
    children: [],
    init: (ctx) => {
        const root = document.createElement("button");
        root.className = "wm button";
        const label = document.createElement("span");
        if (typeof name === "object") {
            label.textContent = name.display;
            if (name.classes) root.classList.add(...name.classes);
            if (name.id) root.dataset.id = name.id;
        } else label.textContent = name;
        root.append(label);
        if (onclick) root.onclick = onclick.bind(ctx);
        if (onmousedown) root.onmousedown = onmousedown.bind(ctx);
        if (info[0] === "toggle") {
            const box = document.createElement("input");
            if (typeof info[1] === "boolean") ctx.control.checked = box.checked = info[1]; 
            box.type = "checkbox";
            box.class = "wm check";
            label.className = "grow";
            root.append(box);
            box.onchange = () => {
                ctx.control.checked = box.checked;
                root.focus();
            }
        }
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
    }   this.control.confirmed = confirm("Press 'Ok' (Enter) to confirm. To decline, click 'Cancel' (Esc).");
    if (this.control.confirmed) {
        this.element.placeholder = this.element.innerText;
        this.element.innerHTML = "<b>Confirm click</b>&nbsp;(<i>Enter</i>)";
    }
});

const animations = { list: [], idx: 0, time: -1 };
const avg_length = 60;
const fps = { c: 0, v: [], avg: null };
export const spool_animations = (t) => {
    const delta = t - animations.time;
    animations.time = t;
    fps.v[fps.c] = delta;
    fps.c++;
    if (fps.c >= avg_length) {
        fps.c = 0;
        const rate = 1000 / (fps.v.reduce((p, v) => p + v) / fps.v.length);
        if (!isNaN(rate)) {
            fps.avg = rate;
            // console.debug("frame time (approx.)", rate.toFixed(2));
        }
    }
    animations.list.forEach(anim => {
        const slot = anim.slot;
        if (slot === null) return;
        anim.f(slot);
        anim.prev = slot;
        anim.slot = null;
    });
    requestAnimationFrame(spool_animations);
};

export const animate = (f) => {
    const inf = { f, slot: null, prev: null };
    animations.list[++animations.idx] = inf;
    let lock = false;
    return (ev) => {
        if (lock) return;
        inf.slot = ev;
        lock = true;
        setTimeout(() => lock = false, 1000 / (fps.avg || avg_length));
    }
}

export const r = Math.ceil;

const togglistener = (listeners, enabled=true) => {
    const entries = Object.entries(listeners);
    const toggles = {
        enable:  () => entries.forEach(([name, l]) => l[0].addEventListener(name, l[1])),
        disable: () => entries.forEach(([name, l]) => l[0].removeEventListener(name, l[1]))
    };
    if (enabled) toggles.enable();
    return toggles;
};

const p = (cl, name="p", l=0) => {
    cl.add(name);
    setTimeout(() => cl.remove(name), l);
};

export const create_toolbar = (title, window, closable=true) => create_control("Toolbar", Control, {
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

        ctx.control.title = name => root.children[0].innerText = name;
        const close = () => {
            window.control.emit("wm_close", "@toolbar");
            listeners.disable();
        };

        const tool = (icon, cls, toggle, cb) => add(create_button({ display: icon, classes: [cls] }, () => {
            if (toggle) window.element.classList.toggle(toggle);
            if (cb) cb();
        }, () => gated = true), ctx.control);
        // why does this end up clean?
        tool("⇱", "minimize", "hidden");
        let frame, fdim;
        setTimeout(() => {
            frame = window.element.querySelector("iframe");
            if (frame) fdim = [frame.style.width, frame.style.height];
        }, 0);
        tool("🗖", "maximize", "expand", () => {
            const s = (x, e=window.element) => { e.remove(); x.append(e) };
            if (window.root.contains(window.element)) {
                s(document.body);
                frame.style.width = "100%";
                frame.style.height = "calc(100vh - 26px)";
            }
            else {
                s(window.root);
                if (fdim) {
                    frame.style.width = fdim[0];
                    frame.style.height = fdim[1];
                }
            }
        });
        if (closable) tool("✖", "close", null, close);

        let moving = false; // window movement handling
        let gated  = false;
        const move = { x: 0, y: 0, xx: 0, xy: 0 };
        let rect   = root.getBoundingClientRect();

        const update_transform = ctx.root.attributeStyleMap ? (x, y) => {
            const translate = new CSSTransformValue([ new CSSTranslate(CSS.px(r(x)), CSS.px(r(y))) ]);
            ctx.root.attributeStyleMap.set("transform", translate);
        } : (x, y) => ctx.root.style.transform = `translate(${r(x)}px, ${r(y)}px)`;

        const save = localStorage.getItem(wmid_getprefix(true) + window.name);
        if (save) {
            const pos = save.split(",").map(parseFloat);
            [move.xx, move.xy, move.x, move.y] = pos;
            p(ctx.root.classList);
            update_transform(move.xx, move.xy);
        }

        const is_fullscreen = () => window.element.classList.contains("expand");

        const listeners = ctx.control.listeners = togglistener({
            "mousedown": [root, event => {
                if (is_fullscreen()) return;
                [move.x, move.y] = [event.offsetX - move.xx + 5, event.offsetY - move.xy + 1];
                moving = true;
                rect = root.getBoundingClientRect();
            }],
            "mousemove": [document, animate(event => {
                if (!moving || gated) return;
                const [x, y] = [move.xx, move.xy] = [
                    event.clientX - rect.x - move.x,
                    event.clientY - rect.y - move.y
                ];  update_transform(x, y);
            })],
            "click": [document, event => {
                gated = false;
                if (!moving) return;
                [move.x, move.y] = [event.offsetX, event.offsetY];
                rect = root.getBoundingClientRect();
                moving = false;
                localStorage.setItem(wmid_getprefix(true) + window.name, r(move.xx) + "," + r(move.xy) + "," + r(move.x) + "," + r(move.y));
            }]
        });
    },
    close: (ctx) => {
        const el = ctx.element.querySelector("button.wm.close");
        if (el) el.click();
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
        const msec = Date.now() % daily_ms;
        const sec = Math.floor(msec / 1000);
        const min = Math.floor(sec / 60);
        const hr  = Math.floor(min / 60);
        const str_sec = pad_two(sec % 60);
        const str_min = pad_two(min % 60);
        const str_hr  = pad_two(hr % 24);
        const str_hr_loc = str_hr >= 12 ? "PM" : "AM";
        ctx.element.innerText = `${str_hr%12}:${str_min}:${str_sec}${window.icw ? "." + pad_two(Math.round((msec % 1000) / 10)) : ""} ${str_hr_loc}`;
        onupdate(ctx.element.innerText);
        if (window.icw) requestAnimationFrame(() => ctx.control.update(ctx));
        else setTimeout(() => ctx.control.update(ctx), 1000);
    },
    init: (ctx) => {
        const root = document.createElement("span");
        root.className = "wm clock";
        ctx.element = root;
        ctx.root.append(root);
        ctx.control.update(ctx);
    }
});

export const get_window = (el, cb) => {
    let p = el; while (p) {
        if (!p) break; 
        if (p.classList.contains("window")) {
            if (p.classList.contains("wm")) break; 
            p = null;
        };
        p = p.parentElement;
    }
    if (p) console.debug("[WindowFinder] Found one.", p);
    else console.warn("[WindowFinder] Wasted processsor time >:c");
    if (cb) setTimeout(() => cb(p), 0);
    return p;
};

export const create_frame = (name, src, width, height, nip=100, img=false, onload=ev=>ev) => create_control(name, Control, {
    children: [],
    init: (ctx) => {
        const root = document.createElement("div");
        if(nip > 0) {
            const overlay = document.createElement("div");
            overlay.style = `
                position: absolute;
                width: 100%;
                height: ${nip}%;
                z-index: 1;
            `;
            root.append(overlay);
        }
        const frame = img ? document.createElement("img") : document.createElement("iframe");
        frame.onload = onload.bind(ctx);
        frame.className = "wm frame";
        frame.src = src;
        frame.width = width;
        frame.height = height;
        root.append(frame);

        ctx.element = root;
        ctx.root.append(root);
        
        if (img) get_window(root, w => {
            // todo: expand upon this efficiently, it makes enough sense in my mind
            w.children[0].querySelector("button.close").addEventListener("click", () => frame.src = "/favicon.ico");
        });
    }
});

export const create_proxy_frame = (src) => create_control("ProxyFrame", Control, {
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
        if (localStorage.lto) throw new Error("Limited-Time Item Expired.");
        localStorage.lto = true;
        console.log(src);
        const root = document.createElement("div");
        const shadow = root.attachShadow({ mode:"open" });
        ctx.element = shadow;
        ctx.src = src;
        ctx.control.update(ctx);
        ctx.root.append(root);
    }
});

export const create_browser = (src="http://ehpt.org", nip=10, onload=ev=>ev) => create_control("Browser", Control, {
    children: [],
    init: (ctx) => {
        const root = document.createElement("div");
        root.className = "wm browser panel";
        add(create_frame("BrowserFrame", src, pos.x_no_border, pos.y_no_border, nip, false, onload), ctx.control);
        ctx.element = root;
        ctx.root.append(root);
    }
});

export const change_ico = (cls="ico", to="folder") => {
    const icons = document.getElementsByClassName(cls);
    const src = `res/${to}.ico`;
    for (let i = 0; i < icons.length; i++) {
        icons[i].src = src;
    }
};

export const create_control_panel = (root_el, just_init=false) => create_control("ctl.exe", {
    children: [],
    init: (ctx) => {
        const root = document.createElement("div");
        root.className = "wm control panel";

        const theme = window.localStorage.getItem("wm");
        window.current_theme = parseInt(theme ? theme : 0);
        if (localStorage.getItem("wasteful_clock") === "yea") window.icw = true;
        else window.icw = false;

        const fixme = (old) => {
            if (old) change_ico("ico");
            else change_ico("ico", "modern");
        };

        window.determine_theme = (root, t) => fixme(determine_theme(root, t));

        const get_theme = (_, inc=true) => {
            let t = window.current_theme = (window.current_theme + inc) % 4;
            fixme(determine_theme(root_el, t))
            document.querySelectorAll("iframe").forEach(frame => frame.contentWindow.postMessage("theme:=" + t));
        };
        
        get_theme(void 0, false);
        if(just_init) return;
        
        add(create_button("Wasteful Clock", function () { window.icw = this.control.checked }, null, "toggle", window.icw), ctx.control);
        add(create_button("Switch Theme", get_theme), ctx.control);
        add(create_confirmable("Clear localStorage", () => {
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
});

export const create_taskbar = (name, open_programs, container="footer") => create_control("locked taskbar", Control, {
    children: [],
    init: (ctx) => {
        const root = document.createElement(container);
        root.className = "wm taskbar";
        ctx.element = root;

        const prg_button = (program) => {
            const btn = create_button({ display: `${program.name} ↺`, id: program.name }, () => {
                const cl = program.element.classList;
                cl.toggle("hidden"); // janky as shit, works.
                if (!cl.contains("hidden")) Wm.focus(program);
            });
            // copied from init_children (immediate eval)
            const ctx_sub = Wm.Ctx(ctx.name + "::" + program.name, btn, ctx.element);
            Wm.run(ctx_sub);
        };
        prg_button({ name: "winwm", element: document.querySelector(`[data-prg="${name}"].window`)});
        open_programs.forEach(prg_button);

        ctx.control.add = (name) => {
            const prg = open_programs.get(name);
            if (prg) prg_button(prg);
        };

        ctx.control.remove = (name) => {
            const el = document.querySelector(`.wm.taskbar > [data-id=${name}].button`);
            if (el) el.remove();
        };

        ctx.root.append(root);
        window.wm.wm_bar = ctx;
    }
});

export const add = (control, parent, to_front=false) => {
    if(to_front) parent.children = [control, ...parent.children];
    else parent.children.push(control);
};

export const set_hook = (control, hook, cb=()=>{}) => {
    control[hook] = cb;
};

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
    Taskbar: create_taskbar,
    add, set_hook, animate, spool_animations
};  export default wm;