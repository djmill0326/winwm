const Value = (data, transform, validation) => ({ 
    data, cache: null, listeners: new Set(),
    resolve: transform ? 
        function () {
            if (!this.cache) this.cache = transform(this.data, this.index);
            return this.cache;
        } 
        : function () { return this.data; },
    _update_and_notify: function (value) {
        const old_value = this.data;
        if(value === old_value) return;
        this.cache = null;
        this.data = value;
        this.listeners.forEach(listener => listener(this)); 
    },
    update: validation ? 
        function (value) { return validation(value, this.index) ? this._update_and_notify(value) : null; }
        : function (value) { return this._update_and_notify(value); },
    listen: function (on_update) { this.listeners.add(on_update); },
    unlisten: function(on_update) { this.listeners.delete(on_update); },
    bind_to_event: function(element, event_name, transform=ev=>ev.target.value) {
        element.addEventListener(event_name, event => this.value.update(transform(event)));
    },
    element: function(on_update = function (value) { this.innerHTML = value.resolve(); }) {
        const column = document.createElement("td");
        column.className = "column";
        column.innerHTML = this.resolve();
        this.listen(on_update.bind(column));
        return column;
    },
    create_input: function(type="text", postprocess=x=>x) {
        const input = document.createElement("input");
        input.type = type;
        input.className = "bound-input";
        this.bind_to_event(input, "input");
        postprocess(input);
        return input;
    }
});

const ComputedValue = (transform, ...values) => {
    // why is it this easy to implement?
    const computed_value = Value(null, () => transform(...values.map(value => value.resolve())));
    values.forEach(value => value.listen(_ => { computed_value.update(performance.now()) }));
    return computed_value;
}

const List = (values) => ({ 
    values,
    resolve: function () { return this.values.map(x => x.resolve()); }
});

const Column = (data, transform, validation, index=0) => {
    const value = Value(data, transform, validation);
    value.index = index;
    return value;
};

const Row = (columns) => {
    const list = List(columns);
    list.element = function() {
        const row = document.createElement("tr");
        row.className = "row";
        list.values.forEach(col => row.appendChild(col.element()));
        return row;
    };
    return list;
};

const Table = (rows, column_decoration=[]) => {
    const list = List(rows);
    list.rows = rows.map(row => {
        const decorated_row = Row(row.values.map((col, i) => column_decoration[i] ? ComputedValue(column_decoration[i], col) : col));
        console.log(decorated_row);
        return decorated_row;
    });
    list.element = function() {
        const table = document.createElement("table");
        table.className = "table";
        list.rows.forEach(row => table.appendChild(row.element()));
        return table;
    };
    return list;
};

const ReadCsv = (input, input_transform, output_transform, validation, column_decoration) => 
    Table(input.split("\n").map(row => 
        Row(row.split(",").map((column, i) => 
            Column(
                input_transform ? input_transform(column.trim(), i) :  column.trim(), 
                output_transform, validation, i)))), column_decoration);

const prettify = (pre, postprocess) => {
    if (pre) return postprocess ? x => `${pre.toLowerCase()}${postprocess(x)}` : x => pre.toLowerCase() + x;
    else return postprocess ? x => postprocess(x) : x => x;
}

const repeat = (x, n) => {
    let output = "";
    for (let i = 0; i < n; i++) output += x;
    return output;
}

const fix_length = (length, pad="0") => x => repeat(pad, Math.max(length - x.length, 0)) + x;