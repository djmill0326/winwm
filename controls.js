import { pos } from "./util/opt.js";

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

export const create_button = (name, onclick, onmousedown, ...info) => create_control("Button", Control, {
    children: [],
    init: (ctx) => {
        const root = document.createElement("button");
        root.className = "wm button";
        const label = document.createElement("span");
        if (typeof name === "object") {
            root.append()
            label.textContent = name.display;
            root.classList.add(...name.classes);
        } else label.textContent = name;
        root.append(label);
        if (onclick) root.onclick = onclick.bind(ctx);
        if (onmousedown) root.onmousedown = onmousedown;
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
            if(window.onclose) window.onclose(ctx);
            ctx.root.remove();
            listeners.disable();
        };

        if (closable) add_control(create_button({ display: "✖", classes: ["close"] }, close, () => prevent = true), ctx.control);

        let prevent = false; // window movement handling
        const move = { x: 0, y: 0, xx: 0, xy: 0 };
          let rect = root.getBoundingClientRect();
        let moving = false;

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

        const listeners = ctx.control.listeners = togglistener({
            "mousedown": [root, event => {
                [move.x, move.y] = [event.offsetX - move.xx, event.offsetY - move.xy];
                rect = root.getBoundingClientRect();
                moving = true;
            }],
            "mousemove": [document, debounce(event => {
                if (!moving || prevent) return;
                const [x, y] = [move.xx, move.xy] = [
                    event.clientX - rect.x - move.x,
                    event.clientY - rect.y - move.y
                ];  update_transform(x, y);
            })],
            "click": [document, event => {
                if (!moving) return;
                [move.x, move.y] = [event.offsetX, event.offsetY];
                rect = root.getBoundingClientRect();
                moving = false;
                prevent = false;
                localStorage.setItem(wmid_getprefix(true) + window.name, Math.round(move.xx) + "," + Math.round(move.xy) + "," + move.x + "," + move.y);
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

const create_browser = (src="http://ehpt.org:442", nip=10, onload=ev=>ev) => create_control("Browser", Control, {
    children: [],
    init: (ctx) => {
        const root = document.createElement("div");
        root.className = "wm browser panel";
        add_control(create_frame("BrowserFrame", src, pos.x_no_border, pos.y_no_border, nip, false, onload), ctx.control);
        ctx.element = root;
        ctx.root.append(root);
    }
});

const change_ico = (cls, to="favicon") => {
    const icons = document.getElementsByClassName(cls);
    const src = to + ".ico";
    for (let i = 0; i < icons.length; i++) icons[i].src = src;
}

const create_control_panel = (root_el, just_init=false) => create_control("control.exe", {
    children: [],
    init: (ctx) => {
        const root = document.createElement("div");
        root.className = "wm control panel";

        const theme = window.localStorage.getItem("wm");
        window.current_theme = parseInt(theme ? theme : 0);
        if (localStorage.getItem("wasteful_clock") === "yea") window.icw = true;
        else window.icw = false;

        const css_height = parseFloat(ctx.root.style.height.split("px")[0]);
        const fixme = (old=true) => {
            if (old) ctx.root.style.height =  css_height +      "px";
                else ctx.root.style.height = (css_height + 6) + "px";
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
        
        add_control(create_button("Wasteful Clock", function () { window.icw = this.control.checked }, null, "toggle", window.icw), ctx.control);
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
    if(to_front) parent.children = [control, ...parent.children];
    else parent.children.push(control);
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