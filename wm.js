const create_object = (name, proto={}) => ({ ...proto, name });

const Control = create_object("Control", {
    children: null,
    init: (ctx) => console.warn("tried to initialize a control with no initialization code")
});

const create_control = (name, proto=Control, hooks={}) => create_object(name, { ...proto, ...hooks });

const create_button = (name, onclick) => create_control("Button", Control, {
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

const create_toolbar = (title, window, can_close=true) => create_control("Toolbar", Control, {
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
            add_control(create_button("x", () => { 
                // fixme: this is not correct at all
                ctx.root.remove();
                if(window.onclose) window.onclose(ctx);
            }), ctx.control);
        }

        // window movement handling (i don't trust that performance scales on this)
        let prev_x = null;
        let prev_y = null;
        let prev_mousex = null;
        let prev_mousey = null;
        let mousedown = false;
        root.addEventListener("mousedown", (ev) => {
            prev_x = ctx.root.attributeStyleMap.get("left").value;
            prev_y = ctx.root.attributeStyleMap.get("top").value;
            prev_mousex = ev.clientX;
            prev_mousey = ev.clientY;
            mousedown = true;
        });
        document.body.addEventListener("mouseup", () => {
            mousedown = false;
        });
        document.body.addEventListener("mousemove", (ev) => {
            if(mousedown) {
                let offsetx = ev.clientX - prev_mousex;
                let offsety = ev.clientY - prev_mousey;
                ctx.root.attributeStyleMap.set("left", prev_x + offsetx + "px");
                ctx.root.attributeStyleMap.set("top", prev_y + offsety + "px");
            }
        });

        ctx.element = root;
        ctx.root.append(root);
    }
});

const create_frame = (name, src, width, height) => create_control(name, Control, {
    children: [],
    init: (ctx) => {
        const root = document.createElement("div");
        const overlay = document.createElement("div");
        overlay.style = `
            position: absolute;
            width: ${width}px;
            height: ${height * 0.8}px;
            z-index: 1;
        `;
        const frame = document.createElement("iframe");
        frame.className = "wm frame";
        frame.src = src;
        frame.width = width;
        frame.height = height;
        root.append(overlay, frame);

        ctx.element = root;
        ctx.root.append(root);
    }
});

const create_window = (name, x=0, y=0, width=800, height=600, can_close=true, cb=()=>{}) => create_control(name, Control, {
    children: [],
    init: (ctx) => {
        const root = document.createElement("div");
        root.style = `
            position: absolute;
            width: ${width}px;
            height: ${height}px;
            left: ${x}px;
            top: ${y}px;
        `;
        root.className = "wm window shadow";
        ctx.element = root;
        add_control(create_toolbar(name, ctx.control, can_close), ctx.control, true);
        cb(ctx);
        ctx.root.append(root);
    },
    dimensions: (ctx) => ({ 
        x: ctx.element.attributeStyleMap.get("left"), 
        y: ctx.element.attributeStyleMap.get("top"), 
        width: ctx.element.attributeStyleMap.get("width"), 
        height: ctx.element.attributeStyleMap.get("height")
    })
});

const move = (ctx, to_x, to_y) => {
    if(ctx.element) {
        element.attributeStyleMap.set("left", to_x);
        element.attributeStyleMap.set("top", to_y);
    }
}

const add_control = (control, parent, to_front) => {
    if(to_front) {
        parent.children = [control, ...parent.children];
    } else {
        parent.children.push(control);
    }
}

const add_hook = (control, hook, cb) => {
    control[hook] = cb;
}

const create_ctx = (name, control, el_root) => create_object(name, {
    root: el_root,
    element: null,
    control
});

const init_barebones = (ctx) => {
    ctx.control.init(ctx);
};

const init_children = (ctx) => {
    ctx.control.children.forEach(ctl => {
        const ctx_sub = create_ctx(ctx.name = "::" + ctl.name, ctl, ctx.element);
        run(ctx_sub);
    });
};

const run = (ctx) => {
    if(ctx.element) return;
    init_barebones(ctx);
    init_children(ctx);
};

const centered = (size, parent_size) => (parent_size - size) / 2;

const create_program = (name, root, cb, width=800, height=600) => {
    const x = Math.max(centered(width, root.clientWidth), 0);
    const y = Math.max(centered(height, root.clientHeight), 0);
    return create_ctx(name, cb(x, y, width, height), root);
};

let first_run = true;
const ctx = create_program("Root", document.body, (x, y, w, h) => {
    const program_list = {
        wm_hello: () => create_window(first_run ? "Welcome to John's iMac Webserver!" : "John's iMac - About", centered(320, w), centered(240, h), 320, 240, true, (ctx) => {
            add_control(create_frame("HelloFrame", "./about.html", 314, 214), ctx.control);
        })
    };
    const programs = {};
    const open_programs = new Set();
    
    const wm_root = create_window("John's iMac - Desktop", x, y, w, h, false);
    const wm_desktop = create_control("Desktop", Control, {
        children: [],
        init: (ctx) => {
            const root = document.createElement("section");
            root.className = "wm desktop";
            const desktop_programs = Object.keys(program_list).map(name => {
                programs[name] = () => create_program(name, root, () => {
                    const window = program_list[name]();
                    add_hook(window, "onclose", () => open_programs.delete(name));
                    return window;
                });

                const container = document.createElement("button");
                container.className = "wm desktop-icon";
                const icon = document.createElement("img");
                icon.className = "wm shadow";
                icon.src = "./folder.png";
                const label = document.createElement("a");
                label.className = "wm shadow";
                label.innerText = name;

                container.addEventListener("click", () => {
                    if (open_programs.has(name)) return;
                    run(programs[name]());
                    open_programs.add(name);
                });

                container.append(icon, label);
                return container;
            });
            root.append(...desktop_programs);
            ctx.element = root;
            ctx.root.append(root);
            run(programs.wm_hello());
            open_programs.add("wm_hello");
        }
    });
    add_control(wm_desktop, wm_root);
    return wm_root;
});
run(ctx);
first_run = false;