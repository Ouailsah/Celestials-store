'use client';
import { useState } from 'react';
import { saveOutfit } from '@/app/admin/actions';
import type { OutfitDefinition } from '@/lib/outfits';
import type { Product } from '@/lib/types';
import { storefrontCategory } from '@/lib/categories';
import { AdminImages } from './admin-images';

export function AdminOutfitEditor({outfit,products,close,saved}:{outfit:OutfitDefinition;products:Product[];close:()=>void;saved:()=>void}) {
 const [draft,setDraft]=useState(outfit),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const images=draft.images || (draft.image?[draft.image]:[]);
 function field(key:string,value:unknown){setDraft(p=>({...p,[key]:value}));}
 function choose(category:string,id:string){
  const existing=draft.components.find(c=>storefrontCategory(products.find(p=>p.id===c.product_id)?.category||'')===category);
  // Preserve supplied thumbnail/chart overrides when the component stays unchanged.
  field('components',[...draft.components.filter(c=>c!==existing),{product_id:id}].filter(c=>c.product_id));
 }
 async function save(e:React.FormEvent){e.preventDefault();setBusy(true);setError('');try{
  const r=await saveOutfit({...draft,images:images.filter(Boolean),badge:draft.badge||null});if(r.error)setError(r.error);else saved();
 }catch{setError('Unable to save. Please try again.');}finally{setBusy(false);}}
 return <form className="product-editor" onSubmit={save}><h2>{outfit.name?'Edit outfit':'New outfit'}</h2><fieldset disabled={busy}><div className="form-grid">
  <label className="form-field">OUTFIT NAME<input required value={draft.name} onChange={e=>{field('name',e.target.value);if(!outfit.name)field('slug',e.target.value.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,''));}} /></label>
  <label className="form-field">URL SLUG<input required value={draft.slug} onChange={e=>field('slug',e.target.value)} /></label>
  {['Tops','Bottoms'].map(category=>{const component=draft.components.find(c=>storefrontCategory(products.find(p=>p.id===c.product_id)?.category||'')===category);const product=products.find(p=>p.id===component?.product_id);return <div className="form-field" key={category}><label>{category==='Tops'?'TOP PRODUCT':'BOTTOM PRODUCT'}<select required value={component?.product_id||''} onChange={e=>choose(category,e.target.value)}><option value="">Choose a product</option>{products.filter(p=>storefrontCategory(p.category)===category).map(p=><option key={p.id} value={p.id}>{p.name}{!p.active?' (unpublished)':''}</option>)}</select></label>{product&&<><img className="admin-component-preview" src={component?.thumbnail||product.images[0]} alt={product.name}/><small>Sizes: {product.product_variants.map(v=>`${v.size} (${v.stock} in stock)`).join(', ')}. Sizes and stock come from this product.</small>{component?.size_guide&&<small>This existing outfit uses a supplied chart override. It is preserved unless you select a different component.</small>}</>}</div>;})}
  <label className="form-field">NORMAL COMBINED PRICE (DZD)<input required type="number" min="1" max="1000000" value={draft.original_price} onChange={e=>{const n=Number(e.target.value);field('original_price',n);if(draft.price===draft.original_price)field('price',n);}}/><button type="button" className="text-link" onClick={()=>{const n=draft.components.reduce((sum,c)=>sum+(products.find(p=>p.id===c.product_id)?.price||0),0);field('original_price',n);field('price',n);}}>Use component price total</button></label>
  <label className="form-field">SELLING PRICE (DZD)<input required type="number" min="1" max={draft.original_price} value={draft.price} onChange={e=>field('price',Number(e.target.value))}/><small>Use the normal price for no discount, or enter a lower outfit price.</small></label>
  <label className="form-field full">DESCRIPTION<textarea required minLength={10} value={draft.description} onChange={e=>field('description',e.target.value)}/></label>
  <label className="form-field">BADGE<select value={draft.badge||''} onChange={e=>field('badge',e.target.value||null)}><option value="">None</option>{['NEW ARRIVAL','BEST SELLER','OFFER','LIMITED RUN'].map(b=><option key={b}>{b}</option>)}</select></label>
  <label className="form-field">VISIBILITY<select value={String(draft.active)} onChange={e=>field('active',e.target.value==='true')}><option value="false">Unpublished</option><option value="true">Published</option></select><small>Both component products must be published and have stock for customers to order.</small></label>
  <AdminImages images={images} onChange={v=>field('images',v)} label="OUTFIT HERO IMAGES" onBusy={setBusy}/>
 </div></fieldset>{error&&<p role="alert" className="alert error">{error}</p>}<div className="editor-actions"><button className="button button-dark" disabled={busy}>{busy?'SAVING…':'SAVE OUTFIT'}</button><button type="button" className="button button-outline" disabled={busy} onClick={close}>CANCEL</button></div></form>;
}
