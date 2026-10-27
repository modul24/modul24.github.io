import './FrameChannel.js';
import {createSameTabLogin} from './BrowserAuth.mjs?v=20261026-2';
import {createConfirmedSessionStorage} from './ConfirmedSession.mjs';
const status=document.getElementById('status');
let phase='configuration';
try{
  if(window.top!==window||location.origin!=='https://modul24.github.io'||!window.isSecureContext)throw Error('M24_KINDE_TOP');
  const {config}=await import('./config.local.mjs');
  const receiverUrl=new URL(config.receiverUrl);
  if(receiverUrl.origin!=='https://script.google.com'||!/^\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(receiverUrl.pathname)||
    new URL(config.receiverOrigin).origin!==config.receiverOrigin||!config.receiverOrigin.endsWith('.googleusercontent.com'))throw Error('M24_KINDE_CONFIG');
  const frame=document.createElement('iframe');frame.title='Modul24';
  const context=Array.from(crypto.getRandomValues(new Uint8Array(32)),v=>v.toString(16).padStart(2,'0')).join('');
  receiverUrl.searchParams.set('kindePreview','1');receiverUrl.searchParams.set('context',context);frame.src=receiverUrl.href;
  if(window.__m24KindeCallback){receiverUrl.searchParams.set('authReturn','1');frame.src=receiverUrl.href;}
  document.body.append(frame);
  let login;
  const remembered=createConfirmedSessionStorage({getItem:key=>localStorage.getItem(key),
    setItem:(key,value)=>localStorage.setItem(key,value),removeItem:key=>localStorage.removeItem(key)});
  const channel=Modul24KindeFrames.accept({frame,ownOrigin:location.origin,peerOrigin:config.receiverOrigin,context,
    methods:['login','logout','begin','complete','remember','restore','forget','storageChanged'],handle:async(method,payload)=>{
      if(method==='login'){await login.begin();return {ok:true};}
      if(method==='logout'){login.logout();return {ok:true};}
      if(method==='remember')return remembered.save(payload);
      if(method==='restore')return remembered.read();
      if(method==='forget')return remembered.clear(payload?.id||null);
      throw Error('M24_KINDE_METHOD');
    }});
  phase='frame';
  const client=await channel.ready;
  addEventListener('storage',event=>{if(event.key===remembered.key||event.key===null)client.call('storageChanged',null).catch(()=>{});});
  login=createSameTabLogin({config,storage:sessionStorage,call:(method,payload)=>client.call(method,payload),navigate:url=>location.assign(url)});
  const callback=window.__m24KindeCallback;delete window.__m24KindeCallback;
  if(callback){phase='callback';await login.callback(callback);}
  // Keep the registered OAuth callback, then show the ordinary portal address.
  if(['/index.html','/kinde/','/kinde/index.html','/kinde/callback.html'].includes(location.pathname))history.replaceState(null,'','/');
  status.hidden=true;
}catch(error){
  status.textContent='Prijava trenutačno nije dostupna. Pokušaj ponovno.';
  const known={M24_KINDE_CALLBACK:'callback-validation',M24_KINDE_LOGIN:'server-confirmation',
    M24_KINDE_TIMEOUT:'channel-timeout',M24_KINDE_REMOTE:'receiver-rejected',M24_KINDE_HANDSHAKE:'frame-binding'};
  const note=document.createElement('p');
  note.textContent='Oznaka provjere: '+phase+'/'+(known[error?.message]||'unavailable')+'.';
  status.append(note);
  const link=document.createElement('a');link.href='https://modul24.github.io/';link.textContent='Ponovno otvori Modul24';status.append(' ',link);
}
