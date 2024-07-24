export default function determine_theme(root, t) {
    const cl = root.classList;
    cl.remove("old", "one", "dos");
    const o = !t || t === 1;
    if (o) cl.add("old");
    if (t % 2) cl.add("one");
    else cl.add("dos");
    window.localStorage.setItem("wm", t);
    return o;
};