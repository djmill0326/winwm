function haha(a, b) {
    return { ...a, ...b };
}
function object_create(proto, addl) {
    const object_a = Object.create(proto);
    Object.keys(addl).forEach(k => object_a[k] = addl[k]);
    return object_a;
}
function object_seal(obj) {
    return Object.seal(obj);
}
export const create = object_create;
export const seal = object_seal;
export const config_simple = () => {
    const name_name = "_name";
    const data_name = "_data";
    const proto = {
        _sanitize: function (feature) {
            return feature === name_name || feature === this[name_name] || feature === this[name_name] + data_name;
        },
        _get_getter: function () {
            return this[this[name_name]];
        },
        _get_storage: function () {
            return this[this[name_name] + data_name];
        },
        test: function (feature) {
            return !!this._get_getter()[feature];
        },
        get: function (feature) {
            if (feature && feature.length) {
                if (this._sanitize(feature))
                    return null;
                return this.test(feature) ? this._get_storage()[feature] : null;
            }
            return null;
        },
        dump: function () {
            const dump = {};
            Object.keys(this._get_storage()).forEach(x => {
                if (this._sanitize(x))
                    return;
                dump[x] = this.get(x);
            });
            return dump;
        },
        enable: function (feature, value, update_if_enabled = false) {
            if (this._sanitize(feature) || (!update_if_enabled && this.test(feature)))
                return;
            this._get_getter()[feature] = true;
            this._get_storage()[feature] = value;
        },
        disable: function (feature) {
            if (this._sanitize(feature) || !this.test(feature))
                return;
            this._get_getter()[feature] = false;
            delete this._get_storage()[feature];
        },
        if_enabled: function (feature, f) {
            return this.test(feature) ? f(feature) : null;
        },
        update: function (feature, value, enable_if_nonexistent = false) {
            if (enable_if_nonexistent || this.test(feature)) {
                this.enable(feature, value, true);
                return true;
            }
            else
                return false;
        },
        pluck: function (...features) {
            let feature_list = features;
            if (features.length === 1) {
                if (typeof features[0] === "string") {
                    if (!this.test(features[0]))
                        return {};
                    const conf = this.get(features[0]);
                    const why = {};
                    why[features[0]] = conf;
                    return why;
                }
                else if (features[0].length) {
                    feature_list = features[0];
                }
            }
            if (feature_list.length === 0)
                return {};
            const why = {};
            feature_list.forEach(feature => this.if_enabled(feature, () => why[feature] = this.get(feature)));
            return why;
        }
    };
    const config = object_create(proto, {
        name_name,
        [name_name]: {},
        [name_name + data_name]: {}
    });
    return object_seal(config);
};
export default config_simple;
