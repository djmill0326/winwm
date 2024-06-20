j = 0;
function serversidestresstest(root, routes, rps=50, verbose=true, limit) {
    const select = typeof routes === "object" && typeof routes.length === "number" ?
        routes : [];
    if (select.length === 0) select.push("/");
    j = 0;
    const t = 1000/rps;
    const interval = setInterval(() => {
        const i = Math.floor((Math.random() * select.length));
        const beginTime = performance.now();
        const route = select[i];
        fetch(root + route).then(() => {
            ++window.j;
            if (limit && window.j < limit) clearInterval(interval);
            if (verbose) console.debug(`time: ${(performance.now() - beginTime).toFixed(3)}ms, route: ${route}`);
        });
    }, t);
    return () => clearInterval(interval);
}

serversidestresstest("http://ehpt.org", ["/about.html","/favicon.ico","/IF_LICENSE_CONSIDERED_MISAPPLIED_FALLBACK","/package.json","/termemu.js","/wmdoes.jpg", "/controls.js","/folder.ico","/index.html","/proxy.js","/util","/determine_theme.js","/fs.js","/LICENSE","/server.js","/vending","/example.js","/gl.js","/melu.css","/server_simple.js","/wm.js"], 
    100, true, 6000);