import {useEffect} from 'react'
export function useAutoPlay(active:boolean,callback:()=>void,delay=5500){useEffect(()=>{if(!active)return;const id=window.setInterval(callback,delay);return()=>window.clearInterval(id)},[active,callback,delay])}
