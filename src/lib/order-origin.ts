/** Trust deployment configuration, never request Host / forwarded headers. */
export function validOrderOrigin(origin:string|null,siteUrl:string|undefined,mode:string|undefined):boolean {
 if(!origin || origin==='null')return false;
 let incoming:URL;
 try {incoming=new URL(origin);}catch{return false;}
 if(!['http:','https:'].includes(incoming.protocol) || incoming.origin!==origin)return false;
 if(mode==='development' && origin==='http://localhost:3000')return true;
 if(!siteUrl)return false;
 try {
  const configured=new URL(siteUrl);
  return ['http:','https:'].includes(configured.protocol) && !configured.username && !configured.password && origin===configured.origin;
 }catch{return false;}
}
