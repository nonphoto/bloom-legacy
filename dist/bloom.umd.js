var __getOwnPropSymbols=Object.getOwnPropertySymbols,__hasOwnProp=Object.prototype.hasOwnProperty,__propIsEnum=Object.prototype.propertyIsEnumerable,__objRest=(e,t)=>{var n={};for(var o in e)__hasOwnProp.call(e,o)&&t.indexOf(o)<0&&(n[o]=e[o]);if(null!=e&&__getOwnPropSymbols)for(var o of __getOwnPropSymbols(e))t.indexOf(o)<0&&__propIsEnum.call(e,o)&&(n[o]=e[o]);return n};!function(e,t){"object"==typeof exports&&"undefined"!=typeof module?t(exports,require("s-js")):"function"==typeof define&&define.amd?define(["exports","s-js"],t):t((e="undefined"!=typeof globalThis?globalThis:e||self).Bloom={},e.S)}(this,(function(e,t){"use strict";function n(e){return e&&"object"==typeof e&&"default"in e?e:{default:e}}var o=n(t),r="undefined"!=typeof globalThis?globalThis:"undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof self?self:{},i="[object Symbol]",f=/[^\x00-\x2f\x3a-\x40\x5b-\x60\x7b-\x7f]+/g,u=/[\xc0-\xd6\xd8-\xf6\xf8-\xff\u0100-\u017f]/g,s="\\u2700-\\u27bf",a="a-z\\xdf-\\xf6\\xf8-\\xff",l="A-Z\\xc0-\\xd6\\xd8-\\xde",c="\\xac\\xb1\\xd7\\xf7\\x00-\\x2f\\x3a-\\x40\\x5b-\\x60\\x7b-\\xbf\\u2000-\\u206f \\t\\x0b\\f\\xa0\\ufeff\\n\\r\\u2028\\u2029\\u1680\\u180e\\u2000\\u2001\\u2002\\u2003\\u2004\\u2005\\u2006\\u2007\\u2008\\u2009\\u200a\\u202f\\u205f\\u3000",d="['’]",p="["+c+"]",y="[\\u0300-\\u036f\\ufe20-\\ufe23\\u20d0-\\u20f0]",m="\\d+",b="[\\u2700-\\u27bf]",g="["+a+"]",x="[^\\ud800-\\udfff"+c+m+s+a+l+"]",h="(?:\\ud83c[\\udde6-\\uddff]){2}",j="[\\ud800-\\udbff][\\udc00-\\udfff]",A="["+l+"]",O="(?:"+g+"|"+x+")",v="(?:"+A+"|"+x+")",w="(?:['’](?:d|ll|m|re|s|t|ve))?",E="(?:['’](?:D|LL|M|RE|S|T|VE))?",N="(?:[\\u0300-\\u036f\\ufe20-\\ufe23\\u20d0-\\u20f0]|\\ud83c[\\udffb-\\udfff])?",S="[\\ufe0e\\ufe0f]?",_=S+N+("(?:\\u200d(?:"+["[^\\ud800-\\udfff]",h,j].join("|")+")"+S+N+")*"),C="(?:"+[b,h,j].join("|")+")"+_,L=RegExp(d,"g"),I=RegExp(y,"g"),T=RegExp([A+"?"+g+"+"+w+"(?="+[p,A,"$"].join("|")+")",v+"+"+E+"(?="+[p,A+O,"$"].join("|")+")",A+"?"+O+"+"+w,A+"+"+E,m,C].join("|"),"g"),P=/[a-z][A-Z]|[A-Z]{2,}[a-z]|[0-9][a-zA-Z]|[a-zA-Z][0-9]|[^a-zA-Z0-9 ]/,$="object"==typeof r&&r&&r.Object===Object&&r,z="object"==typeof self&&self&&self.Object===Object&&self,R=$||z||Function("return this")();var U,Z=(U={"À":"A","Á":"A","Â":"A","Ã":"A","Ä":"A","Å":"A","à":"a","á":"a","â":"a","ã":"a","ä":"a","å":"a","Ç":"C","ç":"c","Ð":"D","ð":"d","È":"E","É":"E","Ê":"E","Ë":"E","è":"e","é":"e","ê":"e","ë":"e","Ì":"I","Í":"I","Î":"I","Ï":"I","ì":"i","í":"i","î":"i","ï":"i","Ñ":"N","ñ":"n","Ò":"O","Ó":"O","Ô":"O","Õ":"O","Ö":"O","Ø":"O","ò":"o","ó":"o","ô":"o","õ":"o","ö":"o","ø":"o","Ù":"U","Ú":"U","Û":"U","Ü":"U","ù":"u","ú":"u","û":"u","ü":"u","Ý":"Y","ý":"y","ÿ":"y","Æ":"Ae","æ":"ae","Þ":"Th","þ":"th","ß":"ss","Ā":"A","Ă":"A","Ą":"A","ā":"a","ă":"a","ą":"a","Ć":"C","Ĉ":"C","Ċ":"C","Č":"C","ć":"c","ĉ":"c","ċ":"c","č":"c","Ď":"D","Đ":"D","ď":"d","đ":"d","Ē":"E","Ĕ":"E","Ė":"E","Ę":"E","Ě":"E","ē":"e","ĕ":"e","ė":"e","ę":"e","ě":"e","Ĝ":"G","Ğ":"G","Ġ":"G","Ģ":"G","ĝ":"g","ğ":"g","ġ":"g","ģ":"g","Ĥ":"H","Ħ":"H","ĥ":"h","ħ":"h","Ĩ":"I","Ī":"I","Ĭ":"I","Į":"I","İ":"I","ĩ":"i","ī":"i","ĭ":"i","į":"i","ı":"i","Ĵ":"J","ĵ":"j","Ķ":"K","ķ":"k","ĸ":"k","Ĺ":"L","Ļ":"L","Ľ":"L","Ŀ":"L","Ł":"L","ĺ":"l","ļ":"l","ľ":"l","ŀ":"l","ł":"l","Ń":"N","Ņ":"N","Ň":"N","Ŋ":"N","ń":"n","ņ":"n","ň":"n","ŋ":"n","Ō":"O","Ŏ":"O","Ő":"O","ō":"o","ŏ":"o","ő":"o","Ŕ":"R","Ŗ":"R","Ř":"R","ŕ":"r","ŗ":"r","ř":"r","Ś":"S","Ŝ":"S","Ş":"S","Š":"S","ś":"s","ŝ":"s","ş":"s","š":"s","Ţ":"T","Ť":"T","Ŧ":"T","ţ":"t","ť":"t","ŧ":"t","Ũ":"U","Ū":"U","Ŭ":"U","Ů":"U","Ű":"U","Ų":"U","ũ":"u","ū":"u","ŭ":"u","ů":"u","ű":"u","ų":"u","Ŵ":"W","ŵ":"w","Ŷ":"Y","ŷ":"y","Ÿ":"Y","Ź":"Z","Ż":"Z","Ž":"Z","ź":"z","ż":"z","ž":"z","Ĳ":"IJ","ĳ":"ij","Œ":"Oe","œ":"oe","ŉ":"'n","ſ":"ss"},function(e){return null==U?void 0:U[e]});var k,B=Object.prototype.toString,G=R.Symbol,D=G?G.prototype:void 0,M=D?D.toString:void 0;function V(e){if("string"==typeof e)return e;if(function(e){return"symbol"==typeof e||function(e){return!!e&&"object"==typeof e}(e)&&B.call(e)==i}(e))return M?M.call(e):"";var t=e+"";return"0"==t&&1/e==-Infinity?"-0":t}function W(e){return null==e?"":V(e)}var Y=(k=function(e,t,n){return e+(n?"-":"")+t.toLowerCase()},function(e){return function(e,t,n,o){var r=-1,i=e?e.length:0;for(o&&i&&(n=e[++r]);++r<i;)n=t(n,e[r],r,e);return n}(function(e,t,n){return e=W(e),void 0===(t=n?void 0:t)?function(e){return P.test(e)}(e)?function(e){return e.match(T)||[]}(e):function(e){return e.match(f)||[]}(e):e.match(t)||[]}(function(e){return(e=W(e))&&e.replace(u,Z).replace(I,"")}(e).replace(L,"")),k,"")});const H=["area","base","basefont","bgsound","br","col","command","embed","frame","hr","image","img","input","isindex","keygen","link","menuitem","meta","nextid","param","source","track","wbr"],J={xlink:"http://www.w3.org/1999/xlink",xml:"http://www.w3.org/XML/1998/namespace"};function q(e,t,n){"function"==typeof n?o.default((()=>q(e,t,n()))):!1===n||null==n?e.removeAttribute(t):e.setAttribute(t,n)}function F(e,t,n,r){"function"==typeof r?o.default((()=>F(e,t,n,r()))):!1===r||null==r?e.removeAttributeNS(t,n):e.setAttributeNS(t,n,r)}function K(e,t,n){"function"==typeof n?o.default((()=>e[t]=n())):e[t]=n}function X(e,t){"function"==typeof t?o.default((()=>X(e,t()))):Array.isArray(t)?e.className=t.flat(1/0).filter((e=>"string"==typeof e)).join(" "):e.className=t}function Q(e,t,n){"function"==typeof n?o.default((()=>{Q(e,t,n())})):"-"===t[0]&&"-"===t[1]?n?e.style.setProperty(t,n):e.style.removeProperty(t):e.style[t]=n||""}function ee(e,t){for(const n in t){const r=t[n];if(!["tagName"].includes(n))if("children"===n)oe(e,r,e.childNodes);else if("style"===n)if("object"==typeof r)for(let t in r)Q(e,t,r[t]);else q(e,n,r);else if("classList"===n)X(e,r);else if("ref"===n)r(e);else if("assignedElements"===n&&n in e){const t=()=>r(e.assignedElements());e.addEventListener("slotchange",t),o.default.cleanup((()=>{e.removeEventListener("slotchange",t)})),t()}else if(n.startsWith("on")){const t=n.slice(2).toLowerCase();e.addEventListener(t,r),o.default.cleanup((()=>{e.removeEventListener(t,r)}))}else if(n.includes(":")){const t=J[n.split(":")[0]];t?F(e,t,n,r):q(e,n,r)}else e instanceof SVGElement||!(n in e)?q(e,n,r):K(e,n,r)}return e}function te(e,t,n){t.length<=0&&(t=[document.createComment("[]")]);for(let i=n.length;i>t.length;i--){const t=n[i-1];e.removeChild(t)}let o=n[0],r=[];for(let i=0;i<t.length;i++)o=i<n.length?oe(e,t[i],n[i]):ne(e,t[i],o),r.push(o);return r}function ne(e,t,n){const o=document.createComment("");return n instanceof Node&&!n.isSameNode(e.lastChild)?e.insertBefore(o,n.nextSibling):e.appendChild(o),oe(e,t,o)}function oe(e,t,n){for(;"function"==typeof n;)n=n();if(n||(n=e.childNodes),n instanceof NodeList&&(n=Array.from(n)),t===n)return n;const r=typeof t;if("string"===r||"number"===r)return t=t.toString(),n instanceof Text?(n.nodeValue=t,n):oe(e,document.createTextNode(t),n);if(null==t||"boolean"===r)return n instanceof Comment?(n.nodeValue=t,n):oe(e,document.createComment(t),n);if("function"===r)return o.default((n=>oe(e,t(),n)),n);if(Array.isArray(t)){const o=t.flat(1/0);if(Array.isArray(n))return te(e,o,n);if(n instanceof Node)return te(e,o,[n]);throw new Error("Not possible")}if(t instanceof Node){if(Array.isArray(n))te(e,[t],n);else{if(!(n instanceof Node))throw new Error("Not possible");e.replaceChild(t,n)}return t}if("object"===r){const o=t,{tagName:r="div"}=o,i=__objRest(o,["tagName"]);if(n instanceof Element&&r.toLowerCase()===n.tagName.toLowerCase())return ee(n,i),n;{const t=document.createElement(r),o=oe(e,t,n);return ee(t,i),o}}return n}e.assign=ee,e.insertAfter=ne,e.insertBefore=function(e,t,n){const o=document.createComment("");return n instanceof Node?e.insertBefore(o,n):e.insertBefore(o,e.firstChild),oe(e,t,o)},e.patch=oe,e.reconcile=te,e.serialize=function e(t){if("string"==typeof t)return t;if("function"==typeof t)return e(t());if(Array.isArray(t))return t.map(e).join("");if("object"==typeof t){const n=t,{tagName:o="div",children:r}=n,i=__objRest(n,["tagName","children"]),f=[o,...Object.entries(i).filter((([,e])=>"function"!=typeof e)).map((([e,t])=>("style"===e?t=Object.entries(t).filter((([,e])=>"function"!=typeof e)).map((([e,t])=>`${e.startsWith("--")?"--":""}${Y(e)}: ${t.toString()};`)).join(" "):"classList"===e&&(e="class",Array.isArray(t)&&(t=t.flat(1/0).filter((e=>"string"==typeof e)).join(" "))),`${Y(e)}="${t}"`)))].join(" ");return H.includes(o)?`<${f}/>`:`<${f}>${e(r)}</${o}>`}return null==t?"":t.toString()},e.setAttribute=q,e.setAttributeNS=F,e.setClassList=X,e.setProperty=K,e.setStyle=Q,Object.defineProperty(e,"__esModule",{value:!0}),e[Symbol.toStringTag]="Module"}));