export type ConvenioCategory='Salud y bienestar'|'Funerarios'|'Turismo'|'Servicios vehiculares'
export type Convenio={id:number;name:string;category:ConvenioCategory;description:string;website?:string;logo:string}
export const convenios: Convenio[] = [
 {id:10,name:'Caribbean Sol y Mar',category:'Turismo',description:'Tiquetes, hoteles, tours y asesoría personalizada para viajes nacionales e internacionales.',logo:'/images/convenios/caribbean-sol-mar-logo.jpg'},
 {id:11,name:'Luz Marina Vargas',category:'Turismo',description:'Agencia de viajes con atención personalizada para asociados FONASIN.',logo:'/images/convenios/luz-marina-vargas-logo.jpg'},
 {id:1,name:'EMI',category:'Salud y bienestar',description:'Atención médica 24/7 en casa con tarifa especial para asociados FONASIN.',logo:'/images/convenios/emi.png'},
 {id:9,name:'Sanitas',category:'Salud y bienestar',description:'Plan Premium de salud con beneficios exclusivos para asociados FONASIN.',logo:'/images/convenios/sanitas.png'},

 {id:2,name:'Emermédica',category:'Salud y bienestar',description:'Convenio de salud y bienestar. Información detallada por confirmar.',logo:'/images/convenios/emermedica.png'},
 {id:3,name:'UMA IPS',category:'Salud y bienestar',description:'Convenio de salud y bienestar. Información detallada por confirmar.',logo:'/images/convenios/uma-ips.png'},
 {id:4,name:'Gimnasios',category:'Salud y bienestar',description:'Beneficios en gimnasios. Proveedores y condiciones por confirmar.',logo:'/images/logo-placeholder.svg'},
 {id:5,name:'Coorserpark',category:'Funerarios',description:'Convenio de previsión exequial con cobertura nacional para asociados FONASIN.',logo:'/images/convenios/coorserpark.png'},
 {id:6,name:'Funeraria Los Olivos',category:'Funerarios',description:'Convenio funerario. Información detallada por confirmar.',logo:'/images/convenios/los-olivos.png'},
 {id:7,name:'Manejar',category:'Servicios vehiculares',description:'Servicio vehicular. Información detallada por confirmar.',logo:'/images/convenios/manejar.png'},
 {id:8,name:'Practicar',category:'Servicios vehiculares',description:'Servicio vehicular. Información detallada por confirmar.',logo:'/images/convenios/practicar.png'}
]
