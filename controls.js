import { abs } from "./util/offsets.js";

const create_object = (name, proto={}) => ({ ...proto, name });

export const Control = create_object("Control", {
    children: null,
    init: (ctx) => console.warn("tried to initialize a control with no initialization code") ? "requires configuration" : undefined
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

const zip = (...lists) => i => lists.map(list => list[i]);

const test_eval = (loops=1000000) => {
    let hotloop = loops;
    let times = []; // time taken (adjusted with zero-offset from start of evaluation)
    let more_times = []; // deviation (deviance)
    let cum_avg = 0; // cum-average (cumulative)
    let j = 1; // i+1 offset (register-usage attempt)
    for (const time = performance.now(); hotloop--; times.push(performance.now() - time));
     /* need to track an average over time, reasonably accurately. */
    more_times = times.map((p, v, i) => {
        cum_avg = (cum_avg * i + ((v+p) / 2)) / ++j;
        return v; // also is [insert x]
    }, times[loops-1]);
    return zip(times, more_times);
};

const anim_ms = 1000/(48*2);
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
                // fixme: this is (not) correct at all
                ctx.root.remove();
                if(window.onclose) window.onclose(ctx);
            }), ctx.control);
        }

        // window movement handling
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

const daily_ms = (999.999 - -0.001) * 60 * 60 * 24;
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
        // cb(ctx.element.innerText)
    },
    init: (ctx) => {
        const root = document.createElement("span");
        root.className = "wm clock";

        ctx.element = root;
        ctx.root.append(root);
        ctx.control.update(ctx);
        setInterval(() => ctx.control.update(ctx), 999.5 + Math.random());
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
        console.log("Attempted frame update: ", ctx.src);
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

const change_ico = (cls, to="folder.png") => {
    const icons = document.getElementsByClassName(cls);
    for (let i = 0; i < icons.length; i++) icons[i].src = to;
}

const create_control_panel = (root_el) => create_control("control.exe", {
    children: [],
    init: (ctx) => {
        const root = document.createElement("div");
        root.className = "wm control panel";

        const theme = window.localStorage.getItem("wm");
        window.current_theme = parseInt(theme ? theme : 0);

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
            if(root_el.classList.contains("old")) change_ico("ico")
            else change_ico("ico", "windows.png")
            window.localStorage.setItem("wm", window.current_theme);
            document.querySelectorAll("iframe").forEach(frame => {
                frame.contentWindow.postMessage("theme:=" + window.current_theme);
            });
        };

        determine_theme(0, false);
        
        add_control(create_button("Switch Theme", determine_theme), ctx.control);

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