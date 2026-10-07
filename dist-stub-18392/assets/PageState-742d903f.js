import{c as i,j as e,a6 as o,a7 as l}from"./index-ac2c9d1b.js";/**
 * @license lucide-react v0.378.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const c=i("Inbox",[["polyline",{points:"22 12 16 12 14 15 10 15 8 12 2 12",key:"o97t9d"}],["path",{d:"M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z",key:"oot6mr"}]]);/**
 * @license lucide-react v0.378.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const h=i("TriangleAlert",[["path",{d:"m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3",key:"wmoenq"}],["path",{d:"M12 9v4",key:"juzpu7"}],["path",{d:"M12 17h.01",key:"p32p05"}]]);function p({query:r,children:a,empty:s,isEmpty:d=n=>Array.isArray(n)&&n.length===0}){return r.isPending?e.jsxs(t,{children:[e.jsx(o,{className:"h-5 w-5 animate-spin","aria-hidden":!0})," ",e.jsx("span",{children:"Loading…"})]}):r.isError?e.jsxs(t,{role:"alert",children:[e.jsx(h,{className:"h-5 w-5 text-destructive","aria-hidden":!0}),e.jsx("span",{children:l(r.error).message}),e.jsx("button",{type:"button",onClick:()=>r.refetch(),disabled:r.isFetching,className:"rounded-lg border px-3 py-1.5 text-sm hover:bg-accent disabled:opacity-50",children:"Try again"})]}):s!==void 0&&d(r.data)?e.jsxs(t,{children:[e.jsx(c,{className:"h-5 w-5","aria-hidden":!0})," ",e.jsx("span",{children:s})]}):e.jsx(e.Fragment,{children:a(r.data)})}function t({children:r,role:a}){return e.jsx("div",{role:a,className:"flex flex-wrap items-center justify-center gap-3 rounded-xl border border-dashed p-8 text-sm text-muted-foreground",children:r})}export{p as P};
