/** Opaque Modul24 capability only. Every restore still requires an R server read. */
const key='modul24.kinde.confirmed-session.v1';
export function createConfirmedSessionStorage(storage,now=Date.now){
  function valid(v){return v&&Object.keys(v).sort().join(',')==='expiresAt,id,v,verifier'&&v.v===1&&
    /^[A-Za-z0-9_-]{43}$/.test(v.id)&&/^[a-f0-9]{64}$/.test(v.verifier)&&Number.isSafeInteger(v.expiresAt)&&
    v.expiresAt>now()&&v.expiresAt<=now()+28800000+60000;}
  function read(){try{const raw=storage.getItem(key);if(!raw)return null;if(raw.length>512)throw Error('FORMAT');const v=JSON.parse(raw);if(!valid(v))throw Error('FORMAT');return v;}
    catch{try{storage.removeItem(key);}catch{}return null;}}
  return Object.freeze({key,read,
    save(v){if(!valid(v))return {ok:false};try{const raw=JSON.stringify(v);storage.setItem(key,raw);return {ok:storage.getItem(key)===raw};}catch{return {ok:false};}},
    clear(id=null){const v=read();if(id&&v&&v.id!==id)return {ok:true};try{storage.removeItem(key);return {ok:true};}catch{return {ok:false};}}
  });
}
