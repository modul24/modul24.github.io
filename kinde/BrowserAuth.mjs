import {generateAuthUrl} from './vendor/kinde-sdk.mjs';

const pendingKey='modul24.kinde.pending.v1';
const hex=value=>typeof value==='string'&&/^[a-f0-9]{64}$/.test(value);
const label=value=>typeof value==='string'&&/^[A-Za-z0-9_-]{43}$/.test(value);
export const sha256=async value=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))),v=>v.toString(16).padStart(2,'0')).join('');
const random=()=>Array.from(crypto.getRandomValues(new Uint8Array(32)),v=>v.toString(16).padStart(2,'0')).join('');

/** No client factory, refresh tokens, token exchange or provider profile in this host. */
export function createSameTabLogin({config,storage,call,navigate,now=Date.now,sdkGenerate=generateAuthUrl}) {
  if(config.issuer!=='https://modul24.kinde.com'||config.callback!=='https://modul24.github.io/kinde/callback.html'||
    !/^[A-Za-z0-9_-]{10,128}$/.test(config.clientId))throw Error('M24_KINDE_CONFIG');
  function clear(){storage.removeItem(pendingKey);}
  function valid(p){return p&&p.v===1&&p.createdAt<=now()&&p.expiresAt===p.createdAt+300000&&p.expiresAt>now()&&
    hex(p.state)&&hex(p.nonce)&&label(p.requestId)&&typeof p.codeVerifier==='string'&&/^[A-Za-z0-9._~-]{43,128}$/.test(p.codeVerifier);}
  return Object.freeze({
    async begin(){
      clear();
      // Refuse redirect before any server write when storage is unavailable.
      storage.setItem(pendingKey,'probe');if(storage.getItem(pendingKey)!=='probe')throw Error('M24_KINDE_STORAGE');clear();
      const auth=await sdkGenerate(config.issuer,'login',{clientId:config.clientId,redirectURL:config.callback,
        scope:['openid','email','profile'],state:random(),nonce:random(),prompt:'login'});
      const url=new URL(auth.url);
      if(url.origin!==config.issuer||url.pathname!=='/oauth2/auth'||url.searchParams.get('response_type')!=='code'||
        url.searchParams.get('code_challenge_method')!=='S256'||url.searchParams.get('redirect_uri')!==config.callback||
        !hex(auth.state)||!hex(auth.nonce)||!label(auth.codeChallenge)||!/^[A-Za-z0-9._~-]{43,128}$/.test(auth.codeVerifier))throw Error('M24_KINDE_SDK');
      const result=await call('begin',{state:auth.state,nonce:auth.nonce,codeChallenge:auth.codeChallenge,
        browserChallenge:await sha256(await sha256(auth.codeVerifier))});
      const createdAt=now();
      if(result?.ok!==true||!label(result.requestId)||!Number.isSafeInteger(result.expiresAt)||
        result.expiresAt*1000<=createdAt||result.expiresAt*1000>createdAt+301000)throw Error('M24_KINDE_BEGIN');
      const p={v:1,requestId:result.requestId,state:auth.state,nonce:auth.nonce,codeVerifier:auth.codeVerifier,
        createdAt,expiresAt:createdAt+300000};
      const serialized=JSON.stringify(p);storage.setItem(pendingKey,serialized);
      if(storage.getItem(pendingKey)!==serialized){clear();throw Error('M24_KINDE_STORAGE');}
      navigate(url.href);
    },
    async callback(entries){
      let p;
      try{p=JSON.parse(storage.getItem(pendingKey));}catch{clear();throw Error('M24_KINDE_CALLBACK');}
      clear();
      const params=new URLSearchParams(entries);
      // Kinde's documented authorization-code response includes granted scope.
      // It is metadata only: identity still comes from the server exchange.
      const scopes=params.getAll('scope');
      const validScope=scopes.length===0||(scopes.length===1&&scopes[0].length<=64&&
        scopes[0].split(' ').filter(Boolean).sort().join(' ')==='email openid profile');
      if(!valid(p)||params.getAll('state').length!==1||params.getAll('code').length!==1||params.get('state')!==p.state||
        !validScope||params.getAll('iss').length>1||params.getAll('session_state').length>1||
        params.has('error')||[...params.keys()].some(k=>!['code','state','session_state','iss','scope'].includes(k))||
        (params.has('iss')&&params.get('iss')!==config.issuer)||!/^[\x21-\x7e]{1,4096}$/.test(params.get('code')||''))throw Error('M24_KINDE_CALLBACK');
      const result=await call('complete',{requestId:p.requestId,code:params.get('code'),state:p.state,codeVerifier:p.codeVerifier});
      p.codeVerifier='';
      if(result?.ok!==true)throw Error('M24_KINDE_LOGIN');
      return {ok:true};
    },
    logout(){clear();navigate(config.issuer+'/logout?'+new URLSearchParams({redirect:config.callback}));},
    clear
  });
}
