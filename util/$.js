const opt    = ["id", "href", "style", "type", "value", ["html", "innerHTML"], ["text", "innerText"], ["cls", "className"]]
const $      = i => {
    const _  = typeof i === "string" ? document.createElement(i) : i.cls ? i.$ : i; const f = n => (...x) => { _[n](...x); return $ }
    const $  = { $: _, get: {}, str: () => _.outerHTML, on: f("addEventListener"), add: (...x) => f("append")(...x.map(x => $$(x).$)), swap: x => f("replace")($$(x).$) }
    const se = t => x => { $.$[t] = x; return $ }; const ge = (x, k) => $.get[x] = () => $.$[k]
    opt.forEach(x => { if (typeof x === "string") { $[x] = se(x); ge(x, x) } else { $[x[0]] = se(x[1]); ge(x[0], x[1]) } })
    return $
};  export const $$ = $