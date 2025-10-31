'use strict';
(function(){ if(typeof window==='undefined'||typeof React==='undefined'){window.LazyImage=window.LazyImage||{};return;} const {useState,useEffect,useRef}=React;
 function BaseLazyImage({src,alt,className='',onClick,onError,priority='normal',fallback='../card/no-image.png',preloadPriority}){
  const [currentSrc,setCurrentSrc]=useState(''); const [isLoaded,setIsLoaded]=useState(false); const imgRef=useRef(null);
  const fallbackCandidates=[fallback,'card/no-image.png','./card/no-image.png','../card/no-image.png','no-image.png'].filter((v,i,a)=>typeof v==='string'&&v&&a.indexOf(v)===i);
  const eff=preloadPriority||priority||'normal';
  useEffect(()=>{ if(!src||!window.imageLoader){ setCurrentSrc(src||fallbackCandidates[0]); setIsLoaded(true); return; }
    if(window.imageLoader.loaded&&window.imageLoader.loaded.has(src)){ setCurrentSrc(src); setIsLoaded(true); return; }
    const onLoad=(u)=>{ if(u===src){ setCurrentSrc(src); setIsLoaded(true);} };
    window.imageLoader.addImages([src],eff,onLoad);
  },[src,eff]);
  const handleError=(e)=>{ const t=e.target; if(t.src.includes('no-image')) return; t.src=fallbackCandidates[0]; t.onerror=null; if(onError) onError(e); };
  return React.createElement('img',{ref:imgRef,src:currentSrc||fallbackCandidates[0],alt,className:`${className} ${isLoaded?'loaded':'loading'}`,onClick,onError:handleError,style:{opacity:isLoaded?1:0.7,transition:'opacity 0.3s ease-in-out'}});
 }
 function withImagePreload(C){ return function P(props){ return React.createElement(C,{...props,preloadPriority:props.preloadPriority||'high'});} }
 function Provider({children}){ return children||null; }
 window.LazyImage={ LazyImage: BaseLazyImage, withImagePreload, LazyImageProvider: Provider };
})();


