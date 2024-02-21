export const kv_map = (obj, f) => Object.keys(obj).map((x, idx) => f(obj[x], x, idx));
export const trim = x => x.trim();
export const trim_array_by_index_length = arr => arr.filter(x => x.length !== 0);

export const read_csv = uri => fetch(uri).then(res => res.text()).then(text => trim_array_by_index_length(text
    .split("\n")
    .map(row => row
        .split(",")
        .map(trim)
    )
    .map(trim_array_by_index_length)
));

/* 
  schema format:
  [[idx]: { x, active?, resolver }]
*/

export const make_schema = scheme => scheme.map(x => ({ x, active: true, resolver: null }));

export const get_row = (schema, data, index) => {
    const row = [];
    for (let i = 0; i < schema.length; i++) {
        if (!schema[i].active) return;
        const res = schema[i].resolver;
        if(res) row.push(res(data[index], index, schema[i]));
        else row.push(data[index][i])
    }
    return row;
};

export const manage_csv = (data, schema) => {
    return {
        resolve: () => {
            const rows = [];
            for (let i = 0; i < data.length; i++) {
                rows[i] = get_row(schema, data, i);
            }
            return rows;
        }
    };;
}

export const read_managed = async (uri, schema) => manage_csv(await read_csv(uri), schema);