'use client';
import { useState } from 'react';
import { uploadImage } from '@/app/admin/actions';

export function AdminImages({images,onChange,label='PRODUCT IMAGES',limit=8,onBusy}:{images:string[];onChange:(images:string[])=>void;label?:string;limit?:number;onBusy:(busy:boolean)=>void}) {
 const [busy,setBusy]=useState(false),[error,setError]=useState('');
 async function upload(files:FileList|null) {
  if(!files?.length)return;
  setBusy(true);onBusy(true);setError('');const next=images.filter(Boolean);
  try { for(const file of Array.from(files)) {
   if(next.length>=limit){setError(`Maximum ${limit} image${limit===1?'':'s'}. Remove an image before uploading another.`);break;}
   const form=new FormData();form.set('image',file);const result=await uploadImage(form);
   if(result.error){setError(result.error);break;}if(result.url)next.push(result.url);
  } onChange(next); } catch {setError('Upload failed. Please try again.');}
  finally {setBusy(false);onBusy(false);}
 }
 function move(index:number,to:number){const next=[...images];[next[index],next[to]]=[next[to],next[index]];onChange(next);}
 return <div className="form-field full admin-images"><span>{label}</span>
  <div className="admin-image-list">{images.map((src,i)=><div key={`${src}-${i}`}>{src&&<img src={src} alt={`${label} ${i+1}`} />}<span>{i===0?'Cover':`Image ${i+1}`}</span><div>
   <button type="button" disabled={busy||i===0} onClick={()=>move(i,i-1)} aria-label={`Move image ${i+1} earlier`}>←</button>
   <button type="button" disabled={busy||i===images.length-1} onClick={()=>move(i,i+1)} aria-label={`Move image ${i+1} later`}>→</button>
   <button type="button" disabled={busy} onClick={()=>onChange(images.filter((_,n)=>n!==i))} aria-label={`Remove image ${i+1}`}>Remove</button>
  </div></div>)}</div>
  <label>IMAGE URLS (one per line)<textarea disabled={busy} value={images.join('\n')} onChange={e=>onChange(e.target.value.split('\n').map(s=>s.trim()))} /></label>
  <label>UPLOAD IMAGES<input type="file" accept="image/jpeg,image/png,image/webp" multiple={limit>1} disabled={busy} onChange={e=>{void upload(e.target.files);e.target.value='';}} /></label>
  <small>JPEG, PNG or WebP, up to 3 MB each. Existing store paths or HTTPS URLs. First image is the cover; arrows reorder the gallery.</small>
  {busy&&<p role="status">Uploading…</p>}{error&&<p role="alert">{error}</p>}
 </div>;
}
