import type {Vacancy} from '@/lib/recruitment';
import {careerDetails} from '@/lib/career-details';
import {Panel} from './BoardView';
import {CareerIllustration} from './CareerIllustration';
export function PositionContext({vacancy}:{vacancy:Vacancy}){
 const details=careerDetails(vacancy);
 return <><Panel title="The role" className="position-context"><CareerIllustration kind={vacancy.kind==='board'?'team':'work'}/><h3>{vacancy.title}</h3><dl className="position-facts"><div><dt>Location</dt><dd>{vacancy.location}</dd></div><div><dt>Closing date</dt><dd>{new Date(vacancy.closes_at).toLocaleDateString('en-ZA',{day:'numeric',month:'short',year:'numeric',timeZone:'Africa/Johannesburg'})}</dd></div></dl><ul>{details.responsibilities.slice(0,3).map(item=><li key={item}>{item}</li>)}</ul>{details.responsibilities.length>3&&<details><summary>More responsibilities</summary><ul>{details.responsibilities.slice(3).map(item=><li key={item}>{item}</li>)}</ul></details>}</Panel><Panel title="Qualifications & experience" className="position-context"><ul>{details.qualifications.slice(0,3).map(item=><li key={item}>{item}</li>)}</ul>{details.qualifications.length>3&&<details><summary>All requirements</summary><ul>{details.qualifications.slice(3).map(item=><li key={item}>{item}</li>)}</ul></details>}<div className="actions"><a className="button" href={vacancy.source_link} target="_blank" rel="noopener noreferrer">Full job description ↗</a></div></Panel></>;
}
