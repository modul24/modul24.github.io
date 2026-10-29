import './FrameChannel.js?v=20261029-2';
import './Location.js?v=20261029-1';
import {createSameTabLogin} from './BrowserAuth.mjs?v=20261026-2';
import {createConfirmedSessionStorage} from './ConfirmedSession.mjs';
const status=document.getElementById('status');
let phase='configuration',bootHint=null,observeFrame=null,channel=null;
const frameEvidence={loaded:false,hello:false,originMatched:null,failure:null,line:0};
try{
  if(window.top!==window||location.origin!=='https://modul24.github.io'||!window.isSecureContext)throw Error('M24_KINDE_TOP');
  const {config}=await import('./config.local.mjs');
  const receiverUrl=new URL(config.receiverUrl);
  if(receiverUrl.origin!=='https://script.google.com'||!/^\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(receiverUrl.pathname)||
    new URL(config.receiverOrigin).origin!==config.receiverOrigin||!config.receiverOrigin.endsWith('.googleusercontent.com'))throw Error('M24_KINDE_CONFIG');
  const frame=document.createElement('iframe');frame.title='Modul24';
  frame.allow='fullscreen *';frame.allowFullscreen=true;
  const context=Array.from(crypto.getRandomValues(new Uint8Array(32)),v=>v.toString(16).padStart(2,'0')).join('');
  receiverUrl.searchParams.set('kindePreview','1');receiverUrl.searchParams.set('context',context);frame.src=receiverUrl.href;
  if(window.__m24KindeCallback){receiverUrl.searchParams.set('authReturn','1');frame.src=receiverUrl.href;}
  frame.addEventListener('load',()=>{frameEvidence.loaded=true;});
  document.body.append(frame);
  observeFrame=event=>{
    const d=event.data;if(!d||d.context!==context||!Modul24KindeFrames.within(event.source,frame.contentWindow))return;
    if(d.type==='m24.kinde.hello.v1'&&/^[a-f0-9]{64}$/.test(d.nonce)){
      frameEvidence.hello=true;frameEvidence.originMatched=event.origin===config.receiverOrigin;return;
    }
    // A diagnostic can only stop startup; it can never authenticate a frame.
    if(d.type!=='m24.kinde.boot.v1'||Object.keys(d).sort().join(',')!=='context,line,stage,type'||
      !['origin-pin-mismatch','client-syntax','client-reference','client-type','client-error','client-rejection','handshake-failed'].includes(d.stage)||
      !Number.isSafeInteger(d.line)||d.line<0||d.line>50000)return;
    frameEvidence.failure=event.origin===config.receiverOrigin?d.stage:'origin-pin-mismatch';
    frameEvidence.line=event.origin===config.receiverOrigin?d.line:0;channel?.close();
  };
  window.addEventListener('message',observeFrame);
  let login;
  const remembered=createConfirmedSessionStorage({getItem:key=>localStorage.getItem(key),
    setItem:(key,value)=>localStorage.setItem(key,value),removeItem:key=>localStorage.removeItem(key)});
  const viewKey='modul24.kinde.location.v2',oldViewKey='modul24.kinde.notebook-location.v1';
  const clearNotebookView=()=>{try{sessionStorage.removeItem(viewKey);sessionStorage.removeItem(oldViewKey);}catch{}};
  channel=Modul24KindeFrames.accept({frame,readyTimeoutMs:90000,ownOrigin:location.origin,peerOrigin:config.receiverOrigin,context,
    methods:['login','logout','begin','complete','remember','restore','forget','storageChanged','viewRead','viewWrite'],handle:async(method,payload)=>{
      if(method==='login'){await login.begin();return {ok:true};}
      if(method==='logout'){clearNotebookView();login.logout();return {ok:true};}
      if(method==='remember')return remembered.save(payload);
      if(method==='restore')return remembered.read();
      if(method==='forget'){clearNotebookView();return remembered.clear(payload?.id||null);}
      if(method==='viewRead'){
        if(payload!==null)throw Error('M24_KINDE_VIEW');
        try{return Modul24Location.clean(JSON.parse(sessionStorage.getItem(viewKey)||'null'))||Modul24Location.clean(sessionStorage.getItem(oldViewKey));}catch{return null;}
      }
      if(method==='viewWrite'){
        const value=Modul24Location.clean(payload);if(payload!==null&&!value)throw Error('M24_KINDE_VIEW');
        try{clearNotebookView();if(value)sessionStorage.setItem(viewKey,JSON.stringify(value));return {ok:true};}catch{return {ok:false};}
      }
      throw Error('M24_KINDE_METHOD');
    }});
  phase='frame';
  bootHint=setTimeout(()=>{status.firstChild.textContent='Školska aplikacija još se učitava. Pričekaj trenutak…';},45000);
  const client=await channel.ready;clearTimeout(bootHint);window.removeEventListener('message',observeFrame);
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
  const reason=phase==='frame'&&error?.message==='M24_KINDE_HANDSHAKE'?(frameEvidence.failure||(frameEvidence.hello&&frameEvidence.originMatched===false?'origin-pin-mismatch':!frameEvidence.hello?'receiver-not-ready':'frame-binding')):(known[error?.message]||'unavailable');
  note.textContent='Oznaka provjere: '+phase+'/'+reason+(frameEvidence.failure&&frameEvidence.line?'/'+frameEvidence.line:'')+'.';
  status.append(note);
  const link=document.createElement('a');link.href='https://modul24.github.io/';link.textContent='Ponovno otvori Modul24';status.append(' ',link);
}

finally{clearTimeout(bootHint);if(observeFrame)window.removeEventListener('message',observeFrame);}
