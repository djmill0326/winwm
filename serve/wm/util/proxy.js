import determine_theme from "./theme.js";

const theme = window.localStorage.getItem("wm");
determine_theme(document.body, parseInt(theme ? theme : 0));

window.onmessage = (msg => {
    const expr = msg.data.split(":=");
    if (expr.length > 1) console.log("winwm-Proxy: assigned " + expr[0] + " to " + expr[1]);
    switch (expr[0]) {
        case "theme": (window.determine_theme ? window.determine_theme : determine_theme)(document.body, parseInt(expr[1]));
    }
});

console.info("[winwm-Proxy] receiving messages from any outer frames.");