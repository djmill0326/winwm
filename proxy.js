import determine_theme from "/determine_theme.js";

window.onmessage = (msg => {
    const expr = msg.data.split(":=");
    if (expr.length > 1) console.log("assign " + expr[0] + " to " + expr[1]);
    switch (expr[0]) {
        case "theme":
            determine_theme(document.body, parseInt(expr[1]));
    }
});