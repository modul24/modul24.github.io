/* UI location only. Never carries identity, capabilities, answers or URLs. */
(function(root){
  const id=value=>typeof value==='string'&&/^[A-Za-z0-9_-]{1,128}$/.test(value);
  const group=value=>typeof value==='string'&&value.length<=80&&!/[@\x00-\x1f<>]/.test(value);
  function clean(value){
    if(value==='notebook')return {v:2,area:'cvrstoca',page:'notebook'};
    if(!value||value.v!==2||typeof value!=='object'||Array.isArray(value))return null;
    const out={v:2,area:value.area,page:value.page};let allowed=['v','area','page'];
    if(value.area==='portal'){
      if(!['home','subjects','users'].includes(value.page))return null;
      if(value.page==='users')for(const key of ['personId','classLabel','groupLabel']){
        allowed.push(key);if(value[key]!==undefined){if(!(key==='personId'?id(value[key]):group(value[key])))return null;out[key]=value[key];}
      }
    }else if(value.area==='cvrstoca'){
      if(!['home','notebook','lessons','exams','results'].includes(value.page))return null;
      if(value.page==='exams'){allowed.push('recordId');if(value.recordId!==undefined){if(!id(value.recordId))return null;out.recordId=value.recordId;}}
    }else if(['cad','strength','mechanics'].includes(value.area)){
      if(!['home','interactive','exams'].includes(value.page))return null;
      if(value.page==='exams'){
        allowed.push('view','recordId','module','step');
        if(value.step!==undefined){if(value.view!=='edit'||!Number.isInteger(value.step)||value.step<0||value.step>2)return null;out.step=value.step;}
        if(!['list','edit','results','monitor','review','attempt'].includes(value.view))return null;out.view=value.view;
        if(value.recordId!==undefined){if(!id(value.recordId))return null;out.recordId=value.recordId;}
        if(['review','attempt'].includes(value.view)&&!out.recordId)return null;
        if(value.module!==undefined){if(value.view!=='edit'||!['theory','prepared-theory'].includes(value.module))return null;out.module=value.module;}
      }
    }else return null;
    if(Object.keys(value).some(key=>!allowed.includes(key)))return null;
    return out;
  }
  root.Modul24Location=Object.freeze({clean});
})(globalThis);
