window.onmessage = (msg => {
    console.log("proximal engaged")
    const expr = msg.data.split(":=");
    if (expr.length > 1) console.log("assign " + expr[0] + " to " + expr[1]);
    switch (expr[0]) {
        case "theme": window.determine_theme(document.body, parseInt(expr[1]));
    }
});