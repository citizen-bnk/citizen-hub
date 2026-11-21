export async function POST(){
 return Response.json({code:'SHARED_ROLE_MANAGEMENT_REQUIRED',error:'Manage shared Citizen roles on the website.',next:'https://citizenbank.co.ls/admin-users-advanced'},{status:409});
}
