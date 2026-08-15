export type FPQRSForm={fullName:string;email:string;type:string;message:string;file?:File|null}
export async function submitFPQRS(_data:FPQRSForm){
 // TODO: conectar posteriormente con POST /api/fpqrs mediante Laravel.
 return {ok:true,mode:'mock'} as const
}
