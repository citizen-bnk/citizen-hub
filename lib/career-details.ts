import sourceDetails from './career-source-details.json';
import type {Vacancy} from './recruitment';
export function careerDetails(v:Vacancy){
 const id=v.source_link.match(/\/file\/d\/([\w-]+)/)?.[1];
 const source=id?sourceDetails[id as keyof typeof sourceDetails]:undefined;
 // Source excerpts enrich the original imported adverts. Admin edits remain authoritative.
 const imported=v.requirements.startsWith('Review the source advertisement for responsibilities and qualifications.')&&/^(Succession and replacement recruitment|Leadership and governance recruitment)/.test(v.summary);
 return source&&imported?source:{responsibilities:[v.summary],qualifications:v.requirements.split('\n').map(s=>s.trim()).filter(Boolean)};
}
