const header = "// module. count:";
window.injected = new Set();

export const load = (name, cb=()=>{}, force=false) => {
    if (!force && window.injected.has(name)) {
        cb(window[name]);
        return;
    };
    fetch(`${location.origin}/wm/modules/${name}.js`).then(res => res.text()).then(text => {
        if (text.startsWith(header)) {
            const expected = parseInt(text.substring(header.length, text.indexOf("\n")));
            window.injected.add(name);
            const script = document.createElement("script");
            script.type = "module";
            script.innerHTML = 
`// loaded by wmoduloader (module: ${name})
const inject = (name, f) => {
    if (!window.${name}) window.${name} = {};
    window.${name}[name] = f;
    console.info("[wmoduloader] Injected", "${name}" + "::" + name);
    console.debug(f);
}
${text}`;
            document.head.append(script);
            console.info(`[wmoduloader] Loaded module '${name}'\n`);
            console.debug(script.innerHTML);
            const wait = () => (!window[name] || Object.keys(window[name]).length < expected) ? setTimeout(wait, 0) : cb(window[name]);
            wait();
        } else throw new Error("malformed header");
    }).catch(err => {
        console.warn(`Error while loading module ${name}`, err);
        throw err;
    });
};