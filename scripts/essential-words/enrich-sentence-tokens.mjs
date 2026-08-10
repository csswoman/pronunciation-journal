/** Generate deterministic, auditable word metadata for every authored sentence. */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";
import { arpabetStringToIpa } from "../lib/arpabet-to-ipa.mjs";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "../..");
const out = path.join(root, "public/essential-words");
const require = createRequire(import.meta.url);
const mod = require("cmu-pronouncing-dictionary");
const dict = mod.dictionary ?? mod.default ?? mod;
const functionWords = new Set(["a","an","the","and","or","but","of","to","in","on","at","for","from","with","by","as","is","are","was","were","be","been","being","have","has","had","do","does","did","can","could","will","would","shall","should","may","might","must","i","you","he","she","it","we","they","me","him","her","us","them","my","your","his","its","our","their","this","that","these","those"]);
const contrastMap = { "iː":["ɪ","ɛ","eɪ"], "ɪ":["iː","ɛ","ə"], "æ":["ɛ","ʌ","ɑ"], "ʌ":["æ","ɑ","ə","ɜː"], "ɜː":["ʌ","ə"], "b":["v","p"], "v":["b","f"] };
const segments = ["tʃ","dʒ","eɪ","aɪ","ɔɪ","oʊ","aʊ","iː","ɜː","ɑː","uː","ɜr","ʌ","ɪ","ɛ","æ","ɑ","ɔ","ʊ","ə","b","d","f","g","h","j","k","l","m","n","ŋ","p","r","ɹ","s","ʃ","t","θ","ð","v","w","z","ʒ"].sort((a,b)=>b.length-a.length);
function ipaFor(word) { const key = word.toLowerCase().replace(/[^a-z']/g, ""); const arpa = dict[key] ?? dict[key.replace(/'/g, "")]; return arpa ? `/${arpabetStringToIpa(arpa)}/` : "/ə/"; }
function contrastIds(ipa) { const raw = ipa.slice(1, -1).replace(/[ˈˌ.]/g, ""); const result = new Set(); for(let i=0;i<raw.length;) { const part = segments.find((candidate)=>raw.startsWith(candidate,i)); if(!part) { i++; continue; } for(const other of contrastMap[part] ?? []) result.add([`/${part}/`,`/${other}/`].sort().join("|")); i += part.length; } return [...result]; }
function tokens(sentence) { const result=[]; const matcher=/[A-Za-z]+(?:'[A-Za-z]+)?/g; for(const match of sentence.matchAll(matcher)) { const text=match[0]; const normalized=text.toLowerCase(); const ipa=ipaFor(text); result.push({ start: match.index, end: match.index + text.length, text, normalized, ipa, role: functionWords.has(normalized) ? "function" : "content", contrastIds: contrastIds(ipa) }); } return result; }
const all=[];
for(let n=1;n<=28;n++){ const file=path.join(out,`words-${String(n).padStart(3,"0")}.json`); const payload=JSON.parse(fs.readFileSync(file,"utf8")); for(const entry of payload.entries){ entry.example_tokens=tokens(entry.example_sentence); for(const variant of entry.example_sentences ?? []) variant.tokens=tokens(variant.sentence); } fs.writeFileSync(file,JSON.stringify(payload,null,2)+"\n"); all.push(...payload.entries); }
fs.writeFileSync(path.join(out,"words-all.json"),JSON.stringify({version:1,entries:all},null,2)+"\n");
console.log(`Enriched ${all.length} entries.`);
