const storageKey='celestials-checkout-attempt-v1';
type AttemptStorage=Pick<Storage,'getItem'|'setItem'|'removeItem'>;
/** Persist only a random key and item selection; never customer/address data. */
export function checkoutAttempt(storage:AttemptStorage|null,items:unknown):string {
 const signature=JSON.stringify(items);
 try {
  const saved=JSON.parse(storage?.getItem(storageKey)||'null');
  if(saved?.signature===signature && typeof saved.key==='string' && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(saved.key))return saved.key;
 }catch{/* Storage unavailable or invalid. */}
 const key=crypto.randomUUID();
 try{storage?.setItem(storageKey,JSON.stringify({key,signature}));}catch{/* In-memory retry still works. */}
 return key;
}
export function clearCheckoutAttempt(storage:AttemptStorage|null){try{storage?.removeItem(storageKey);}catch{/* Storage may be disabled. */}}
