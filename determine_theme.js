const determine_theme = (root, theme) => {
    switch (theme) {
        case 1:
            root.classList.add("one");
            root.classList.remove("dos");
            break;
        default:
            root.classList.add("dos");
            root.classList.remove("one");
    }
    window.localStorage.setItem("wm", theme);
};

const theme = window.localStorage.getItem("wm");
if (theme) determine_theme(document.body, parseInt(theme));

export default determine_theme;