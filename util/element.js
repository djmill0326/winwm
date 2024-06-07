const bind_id = 0;
export const bind_variable = (value, name="bound") => Object.seal({
    name: name.length && name !== "bound" ? name.toString() : "bound" + bind_id++,
    value: null,
    pending: value,
    bindings: new Map(),

    listen: function (on_update = (value, previous, tag) => {}) {
        this.bindings.set(on_update, (value, previous, tag) => {
            console.debug(`<bound ${this.name}/callback/${tag}> updated from ${previous} to ${value}`);
            on_update(value, previous, tag);
        });
    },

    mute: function (on_update = (value, previous, tag) => {}) {
        this.bindings.delete(on_update);
    },

    mute_all: function() {
        this.bindings.clear();
    },

    update: function (get_value = previous => previous + 1) {
        this.value = this.pending;
        this.pending = get_value(this.value);
        let tag = 0;
        Object.values(bindings).forEach(callback => callback(this.pending, this.value, tag++));
    },

    get: function () {
        return this.pending;
    },

    previous: function () {
        return this.value;
    },

    takeown: function (el, event="change", transform=(ev, prev)=>ev.target.value) {
        el[event] = (ev) => this.update(prev => transform(ev, prev));
    }
});

export const unbound = bind_variable(null);

export const element = (el) => {
    let to_wrap = el;
    if (typeof el === "string") to_wrap = document.createElement(el);
    return Object.seal({
        root: document.body,
        element: document.createElement(null),
        nodes: [],
        active: false,
    
        assign_root: function (root=document.body, set_active=true) {
            if (this.active) this.toggle();
            const bound_root = root;
            if (!root.bind_attribute) bound_root = element(root);
            bound_root.nodes.push(this);
            this.root = bound_root;
            if(set_active) this.toggle();
            return this.root;
        },

        toggle: function () {
            if (this.active) {
                this.element.remove();
                this.active = false;
            } else {
                this.root.appendChild(this.element);
                this.active = true;
            }
            return this.active;
        },
    
        append: function (...nodes) {
            if (nodes.length && nodes[0].bind_attribute) nodes.forEach(child => child.assign_root(this));
            else nodes.forEach(child => element(child).assign_root(this));
            return this.nodes;
        },
    
        bind_attribute: function (name="innerText", variable=unbound, takeown) {
            let bound_variable = variable;
            if(!variable.mute_all) bound_variable = bind_variable(variable);
            bound_variable.listen(value => this.element[name] = value);
            this.element[name] = bound_variable.get();
            if(takeown) bound_variable.takeown(el, takeown.event ? takeown.event : takeown, takeown.transform)
            return bound_variable;
        }
    });
}