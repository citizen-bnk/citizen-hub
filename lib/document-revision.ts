export function draftRevisionAllowed(row:{signed_link:string|null;state:string;category:string},kind:string){return !row.signed_link&&row.category===kind&&row.state.startsWith('draft:');}
