const create_object = (name, proto={}) => ({ ...proto, name });

const Control = create_object("Control", {
    children: [],
    init: (ctx) => {},
    update: (ctx) => {},
    draw: (ctx) => {}
});

const create_control = (name, proto=Control, hooks={}) => create_object(name, { ...proto, ...hooks });

const create_button = (name, onclick) => create_control("Button", Control, {
    children: [],
    init: (ctx) => {
        if(ctx.element) {
            ctx.element.remove();
        }
        const root = document.createElement("button");
        root.innerText = name;
        root.className = "wm button";
        root.onclick = onclick;
        ctx.element = root;
        ctx.root.append(root);
    }
});

const create_toolbar = (title) => create_control("Toolbar", Control, {
    children: [],
    init: (ctx) => {
        if(ctx.element) {
            ctx.element.remove();
            delete ctx.element;
        }
        const root = document.createElement("span");
        root.className = "wm toolbar";
        const name = document.createElement("span");
        name.className = "wm title";
        name.innerText = title;
        root.append(name);
        ctx.element = root;

        // toolbar close button
        add_control(create_button("x", () => { 
            // fixme: this is not correct at all
            ctx.root.remove(); 
            delete ctx.control;
        }), ctx.control);

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
                console.log(offsetx, offsety);
            }
        });

        ctx.root.append(root);
    }
});

const create_window = (name, x=0, y=0, width=800, height=600, hooks={}) => create_control(name, Control, {
    children: [],
    init: (ctx) => {
        if (ctx.element) {
            ctx.element.remove();
            delete ctx.element;
        }
        const root = document.createElement("div");
        root.style = `
            position: absolute;
            width: ${width}px;
            height: ${height}px;
            left: ${x}px;
            top: ${y}px;
        `;
        root.className = "wm window";
        ctx.element = root;
        add_control(create_toolbar(name), ctx.control);
        ctx.root.append(root);
    },
    dimensions: (ctx) => ({ 
        x: ctx.element.attributeStyleMap.get("left"), 
        y: ctx.element.attributeStyleMap.get("top"), 
        width: ctx.element.attributeStyleMap.get("width"), 
        height: ctx.element.attributeStyleMap.get("height")
    }),
    ...hooks
});

const move = (ctx, to_x, to_y) => {
    if(ctx.element) {
        element.attributeStyleMap.set("left", to_x);
        element.attributeStyleMap.set("top", to_y);
    }
}

const add_control = (control, parent) => {
    parent.children.push(control);
}

const centered = (size, parent_size) => (parent_size - size) / 2;

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
        const ctx_sub = create_ctx(ctx.name = "/" + ctl.name, ctl, ctx.element);
        run_ctx(ctx_sub);
    });
};

const run_ctx = (ctx) => {
    init_barebones(ctx);
    init_children(ctx);
};

const init = (root) => {
    const x = Math.max(centered(800, root.clientWidth), 0);
    const y = Math.max(centered(600, root.clientHeight), 0);
    
    const wm_root = create_window("John's iMac", x, y, 800, 600);
    
    const wm_hello = create_window("Welcome to John's iMac Webserver!", centered(320, 800), centered(240, 600), 320, 240);
    add_control(wm_hello, wm_root);

    const ctx = create_ctx("Root", wm_root, root);
    run_ctx(ctx);
};

init(document.body);