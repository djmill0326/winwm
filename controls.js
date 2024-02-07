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
        const str_hr_loc = str_hr > 12 ? "PM" : "AM";
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

export const create_frame = (name, src, width, height) => create_control(name, Control, {
    children: [],
    init: (ctx) => {
        const root = document.createElement("div");
        const overlay = document.createElement("div");
        overlay.style = `
            position: absolute;
            width: 100%;
            height: 75%;
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
    add_control, add_hook
}

export default wm;