/** New frame/context binding. The signed server subject channel remains required. */
(() => {
  'use strict';
  const hex=v=>typeof v==='string'&&/^[a-f0-9]{64}$/.test(v);
  const random=win=>Array.from(win.crypto.getRandomValues(new Uint8Array(32)),v=>v.toString(16).padStart(2,'0')).join('');
  const shape=(v,keys)=>v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).sort().join(',')===keys.sort().join(',');
  function config(win,own,peer,context){
    for(const origin of [own,peer]){const u=new URL(origin);if(u.protocol!=='https:'||u.origin!==origin)throw Error('M24_KINDE_ORIGIN');}
    if(own===peer||win.location.origin!==own||!win.isSecureContext||!hex(context))throw Error('M24_KINDE_ORIGIN');
  }
  function within(source,frame){
    try{for(let n=0;source&&n<6;n++){if(source===frame)return true;const parent=source.parent;if(parent===source)return false;source=parent;}}catch{}
    return false;
  }
  function portClient(win,port,context,nonce,methods,handle,onClose=()=>{}){
    let seq=0,closed=false,lastSeq=0,busy=false;const pending=new Map(),queue=[];
    async function drain(){
      if(busy||closed)return;busy=true;
      while(queue.length&&!closed){const d=queue.shift();let ok=true,value;
        try{value=await handle(d.method,d.payload);}catch{ok=false;value=null;}
        if(!closed)port.postMessage({context,nonce,seq:d.seq,ok,value});
      }
      busy=false;
    }
    function close(){if(closed)return;closed=true;port.close();for(const p of pending.values()){win.clearTimeout(p.timer);p.reject(Error('M24_KINDE_CHANNEL'));}pending.clear();onClose();}
    port.onmessage=async event=>{
      const d=event.data;
      if(shape(d,['context','nonce','seq','method','payload'])){
        if(closed||queue.length>=4||d.context!==context||d.nonce!==nonce||!Number.isSafeInteger(d.seq)||
          d.seq<=lastSeq||d.seq>1000000||!methods.includes(d.method)||typeof handle!=='function')return;
        lastSeq=d.seq;queue.push(d);drain();return;
      }
      if(!shape(d,['context','nonce','seq','ok','value'])||d.context!==context||d.nonce!==nonce||typeof d.ok!=='boolean')return;
      const p=pending.get(d.seq);if(!p)return;pending.delete(d.seq);win.clearTimeout(p.timer);
      d.ok?p.resolve(d.value):p.reject(Error('M24_KINDE_REMOTE'));
    };
    port.onmessageerror=close;port.start();
    return Object.freeze({close,call(method,payload,timeoutMs=30000){
      if(closed||!methods.includes(method)||pending.size>=4||seq>=1000000||
        ![30000,45000].includes(timeoutMs))return Promise.reject(Error('M24_KINDE_CHANNEL'));
      const id=++seq;
      return new Promise((resolve,reject)=>{
        const timer=win.setTimeout(()=>{pending.delete(id);reject(Error('M24_KINDE_TIMEOUT'));},timeoutMs);
        pending.set(id,{resolve,reject,timer});port.postMessage({context,nonce,seq:id,method,payload});
      });
    }});
  }
  function accept({win=window,frame,ownOrigin,peerOrigin,context,methods,handle,onReady=()=>{},readyTimeoutMs=30000}){
    config(win,ownOrigin,peerOrigin,context);
    if(frame?.ownerDocument!==win.document||!frame.contentWindow)throw Error('M24_KINDE_FRAME');
    if(![30000,90000].includes(readyTimeoutMs))throw Error('M24_KINDE_HANDSHAKE_WINDOW');
    const container=frame.contentWindow;let port=null,client=null,closed=false,resolveReady,rejectReady;
    const ready=new Promise((resolve,reject)=>{resolveReady=resolve;rejectReady=reject;});
    const timer=win.setTimeout(close,readyTimeoutMs);
    function close(){if(closed)return;closed=true;win.clearTimeout(timer);win.removeEventListener('message',message);client?.close();port?.close();rejectReady(Error('M24_KINDE_HANDSHAKE'));}
    function message(event){
      const d=event.data;
      if(closed||port||event.origin!==peerOrigin||!within(event.source,container)||
        !shape(d,['type','context','nonce'])||d.type!=='m24.kinde.hello.v1'||d.context!==context||!hex(d.nonce))return;
      const source=event.source,nonce=d.nonce,pair=new win.MessageChannel();port=pair.port1;
      win.clearTimeout(timer);win.removeEventListener('message',message);
      client=portClient(win,port,context,nonce,methods,handle);
      source.postMessage({type:'m24.kinde.ack.v1',context,nonce},peerOrigin,[pair.port2]);resolveReady(client);onReady(client);
    }
    win.addEventListener('message',message);return Object.freeze({close,ready});
  }
  function connect({win=window,parentWindow,ownOrigin,peerOrigin,context,methods,handle,onClose}){
    config(win,ownOrigin,peerOrigin,context);
    if(!parentWindow||parentWindow===win||!within(win,parentWindow))throw Error('M24_KINDE_PARENT');
    return new Promise((resolve,reject)=>{
      const nonce=random(win);let finished=false;
      function dispose(){win.clearInterval(interval);win.clearTimeout(timer);win.removeEventListener('message',message);}
      function message(event){const d=event.data;
        if(finished||event.source!==parentWindow||event.origin!==peerOrigin||!shape(d,['type','context','nonce'])||
          d.type!=='m24.kinde.ack.v1'||d.context!==context||d.nonce!==nonce||event.ports.length!==1)return;
        finished=true;dispose();resolve(portClient(win,event.ports[0],context,nonce,methods,handle,onClose));
      }
      const hello=()=>parentWindow.postMessage({type:'m24.kinde.hello.v1',context,nonce},peerOrigin);
      win.addEventListener('message',message);const interval=win.setInterval(hello,250);
      const timer=win.setTimeout(()=>{if(!finished){finished=true;dispose();reject(Error('M24_KINDE_HANDSHAKE'));}},30000);hello();
    });
  }
  globalThis.Modul24KindeFrames=Object.freeze({accept,connect,within});
})();
