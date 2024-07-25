const list = [];

let running = false;
let last_time = 0;
let est_time = 0;
let frames = 0;

setInterval(() => est_time = performance.now(), 100);

export const spool_animations = () => {
    if (!running) return;
    frames++;
    list.forEach(anim => {
        if (anim.ran || !anim.data) return;
        anim.f(anim.data);
        anim.ran = true;
    });
    if (est_time - last_time > 200) {
        console.debug(`[wm_animate] animation finished at ${frames} frames`);
        running = false;
    };
    requestAnimationFrame(spool_animations);
};

export const animate = f => {
    const anim = { f, ran: false, data: null };
    list.push(anim);
    return (ev) => {
        if (!running) {
            running = true;
            spool_animations();
        };
        last_time = est_time;
        anim.data = ev;
        anim.ran = false;
    }
};