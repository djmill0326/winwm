// module. count: 2
import wm from "/wm/controls.js";

export const create_input = (spec) => wm.Control("input",{
    children: [],
    init: (ctx) => {
        const input = document.createElement("input");
        input.className = "wm input";

        const copy = (...props) => props.forEach(p => { if (spec[p]) input[p] = spec[p]; });
        copy("value", "type", "placeholder", "id", "oninput", "onchange");

        if (spec.cls) input.classList.add(...(spec.cls.forEach ? spec.cls : [spec.cls]));
        if (spec.label) {
            const label = document.createElement("label");
            label.className = "wm label";
            label.htmlFor = spec.id;
            label.innerText = spec.label;
            ctx.root.append(label);
        }

        ctx.element = input;
        ctx.root.append(input);
    }
});

export const create_form = (name, onsubmit, ...inputs) => wm.Control("form_" + name, {
    children: [],
    init: (ctx) => {
        const root = document.createElement("form");
        root.id = name;
        root.className = "wm form";
        root.onsubmit = ev => {
            ev.preventDefault();
            onsubmit(ev);
        };

        inputs.forEach(spec => wm.add(create_input(spec), ctx.control));
        ctx.element = root;
        ctx.root.append(root);
    }
});

inject("Input", create_input);
inject("Form", create_form);