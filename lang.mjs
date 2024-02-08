import { stdin, stdout } from "process";
import wm from "./node_mirror/wm.mjs";
import readline from "readline";
const rl = readline.createInterface(stdin, stdout);

const ssm = () => {
    const ctx = new Uint32Array(2048);
    const load = (x) => ctx.at(x);
    const store = (i, x) => ctx.set([x], i);
    const inc = (i) => {
        const x = load(i);
        store(i, x + 1);
        return x;
    }
    const sp = () => load(0);
    const sp_inc = () => inc(0);
    const store_sp = (x) => store(sp(), x);
    const store_sp_inc = (x) => store(sp_inc(), x);
    return {
        ctx: () => ctx,
        load, store, inc, sp, sp_inc, store_sp, store_sp_inc
    };
};

const namespace = {
    meta: {
        welcome: () => { console.log(">>> welcome to wmc"); parse("meta::help") },
        help: () => console.warn(">>> i don't feel like adding a help page yet. try meta::dbg for more info"),
        ns: (x) => globalThis.ns_wm[x],
        dbg: (x) => console.debug(x, globalThis.ns_wm),
        eval: (x) => eval(x),
    },
    wm,
    ssm: ssm()
};
globalThis.ns_wm = namespace;

const execution_engine = {
    line_cache: new Map()
};

//const call_cached = (f, args) => f.call({ ns: namespace, args });

const parse = (input, delim="::") => input.split("\n").map(line => {
    try {
        const [ns, f, ...args] = line.split(delim);
        const cached_line = execution_engine.line_cache.get(line);
        if (cached_line) return cached_line();
        const line_cache = [];
        if (f) {
            const curry = f.split("$");
            if (curry.length === 1) {
                line_cache.push(`return this.ns.${ns}.${curry[0]}(...this.args)`)
            } else {
                line_cache.push(`return this.ns.${ns}.${curry[0]}(${curry[1]})(...this.args)`);
            }
        } else {
            const tok = ns.split(" ");
            switch (tok[0]) {
                case "if":
                    const a = parse(tok[1], ':');
                    const b = parse(tok[3], ':');
                    const op = tok[2];
                    console.log(a, op, b);
                    switch (op) {
                        case "==":
                            line_cache.push(`console.log("equality check")`);
                    }
            }
        }
        const exe = new Function(line_cache).bind({ ns: namespace, args });
        execution_engine.line_cache.set(line, exe);
        return exe();
    } catch (err) {
        console.error("wmc-runtime fatal error - see native error info:");
        console.trace(err);
        console.warn("this is likely recoverable, and the runtime will attempt to continue execution");
    }
});

const repl = (rl) => {
    rl.question("wmc $ ", (input) => {
        console.debug(parse(input));
        repl(rl);
    });
}

parse("meta::welcome");
repl(rl);