const b="str";const u=b+"ing";const s="sub"+u
const opt    = ["id", "href", "style", "type", "value", ["html", "innerHTML"], ["text", "innerText"], ["cls", "className"]]
const $      = i => {
    const _  = typeof i === u ? (i[0] === "|" ? document.querySelector(i[s](1)) : document.createElement(i)) : i.cls ? i._ : i; const f = n => (...x) => { _[n](...x); return $ }
    const $  = { $: x => { return $$(x) }, get: {}, [b]: () => _.outerHTML, on: f("addEventListener"), add: (...x) => f("append")(...x.map(x => $$(x)._)), swap: x => f("replace")($$(x)._), _ }
    const se = t => x => { _[t] = x; return $ }; const ge = (x, k) => $.get[x] = () => $._[k]
    for (const x of opt) { if (typeof x === u) { $[x] = se(x); ge(x, x) } else { $[x[0]] = se(x[1]); ge(x[0], x[1]) } }
    return $
};  const $$ = window.$ = $; export default $