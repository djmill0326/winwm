const cb = [];

export default function determine_theme(root, theme, inc=false) {
    let t = window.current_theme = (theme + inc) % 4;
    const cl = root.classList;
    cl.remove("old", "one", "dos");
    const o = !t || t === 1;
    if (o) cl.add("old");
    if (t % 2) cl.add("one");
    else cl.add("dos");
    window.localStorage.setItem("wm", t);
    cb.forEach(f => f(t, o));
};

export const watch_theme = (f) => cb.push(f);