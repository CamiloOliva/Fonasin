import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Car, Bike, Truck, Award, CheckCircle2, MapPin, 
  Phone, Mail, Globe, ShieldCheck, GraduationCap, FileCheck, ArrowLeft, Sparkles,
  Zap, ShieldAlert, ArrowUpRight
} from 'lucide-react';

export default function ConvenioPractiCar() {
  const serviciosEmpresariales = [
    'Carreras técnicas',
    'Pruebas teórico-prácticas - Idoneidad',
    'Exámenes médicos - psicosensométricos',
    'Cursos de conducción A1, A2, B1, B2, B3, C1, C2, C3',
    'Formación de instructores en todas las categorías'
  ];

  const capacitacionesServicios = [
    'Seguridad vial',
    'Atención a víctimas en accidentes de tránsito',
    'Accidentología vial',
    'Distractores en la conducción',
    'Señalización en tránsito',
    'Transporte de mercancías peligrosas',
    'Servicio al cliente para conductores',
    'Red y sistema vial',
    'Ética, valores y conciencia vial',
    'Inspección pre operacional del vehículo',
    'Control de fuego en accidentes de tránsito',
    'Ecoconducción',
    'Plan estratégico de seguridad vial',
    'Seguridad y salud en el trabajo',
    'Regulador vial',
    'Operación de montacargas',
    'Operación de grúa',
    'Operación de camioneta 4x4 en terreno agreste',
    'Renovación de licencia de conducción',
    'Exámenes primera vez',
    'Examen psicosensométrico',
    'Revisión técnico mecánica para moto',
    'Venta de SOAT',
    'Revisión preoperacional de moto',
    'Descuento para pago de comparendos'
  ];

  const tarifasConvenio = [
    { icon: Bike, titulo: 'Curso A2', precio: '$ 1.050.000' },
    { icon: Car, titulo: 'Curso B1', precio: '$ 1.440.000', destacado: true },
    { icon: Truck, titulo: 'Curso C1', precio: '$ 1.610.000' },
    { icon: Truck, titulo: 'Curso C2', precio: '$ 1.500.000' },
    { icon: Truck, titulo: 'Curso C3', precio: '$ 2.810.000' },
    { icon: Car, titulo: 'Recategorizar a C1', precio: '$ 1.100.000' },
    { icon: Car, titulo: 'Curso A2 + B1', precio: '$ 2.490.000', destacado: true },
    { icon: Car, titulo: 'Curso A2 + C1', precio: '$ 2.660.000' }
  ];

  const otrosServiciosTarifas = [
    { titulo: 'Renovación sencilla', precio: '$ 330.000' },
    { titulo: 'Renovación carro + moto', precio: '$ 450.000' },
    { titulo: 'Tecnicomecánica moto', precio: '$ 227.500' }
  ];

  const sedes = [
    {
      nombre: 'Sede PRACTICAR CABECERA',
      direccion: 'Carrera 36 No. 42 – 07',
      ciudad: 'Bucaramanga'
    },
    {
      nombre: 'Sede PRACTICAR CENTRO',
      direccion: 'Carrera 10 No. 41 – 70',
      ciudad: 'Bucaramanga'
    },
    {
      nombre: 'Sede PRACTICAR DE LA CUESTA',
      direccion: 'Calle 7 AN No. 15 – 26',
      ciudad: 'Quinta Granada – Piedecuesta'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-20 relative selection:bg-red-500 selection:text-white overflow-x-hidden">

      {/* Header Flotante Futurista */}
      <header className="sticky top-0 z-50 bg-slate-950/70 backdrop-blur-2xl border-b border-slate-800/80 shadow-[0_4px_30px_rgba(0,0,0,0.5)] transition-all">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex justify-between items-center">
          
          <Link
            to="/convenios"
            className="relative group overflow-hidden inline-flex items-center space-x-2.5 bg-slate-900 hover:bg-red-600 text-slate-200 hover:text-white px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all duration-500 border border-slate-800 hover:border-red-500 shadow-md hover:shadow-red-600/30 active:scale-95"
          >
            {/* Effect Glow hover */}
            <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none" />
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1.5 transition-transform duration-300" />
            <span>Volver a Convenios</span>
          </Link>

          <div className="flex items-center space-x-2.5 bg-slate-900/90 border border-red-500/30 text-red-400 px-4 py-1.5 rounded-xl text-xs font-bold shadow-[0_0_15px_rgba(239,68,68,0.15)]">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
            </span>
            <span>Convenio FONASIN 2026</span>
          </div>

        </div>
      </header>

      {/* Cuerpos de la Vista */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 space-y-8 relative z-10">

        {/* HERO BANNER - Cyberpunk/Sleek Theme */}
        <section className="relative rounded-3xl bg-slate-900 border border-slate-800/80 p-6 sm:p-10 shadow-2xl overflow-hidden group">
          
          {/* Fondo Mesh/Glow dinámico */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/20 rounded-full blur-[100px] pointer-events-none group-hover:bg-red-600/30 transition-all duration-700 -mr-20 -mt-20"></div>
          <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-amber-500/10 rounded-full blur-[90px] pointer-events-none"></div>

          {/* Patrón sutil de puntos/grid de fondo */}
          <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px] opacity-20 pointer-events-none"></div>

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            <div className="lg:col-span-8 space-y-5">
              <div className="inline-flex items-center space-x-2 bg-slate-950/80 border border-slate-800 text-slate-300 px-4 py-1.5 rounded-full text-xs font-bold backdrop-blur-md">
                <Sparkles className="w-4 h-4 text-amber-400 animate-spin" style={{ animationDuration: '8s' }} />
                <span className="tracking-wide">Instituto Practi-Car | Grupo Empresarial Practicar</span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight text-white">
                APRENDE Y RENUEVA CON <br className="hidden sm:inline" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-rose-400 to-amber-300 animate-gradient">
                  DESCUENTO EXCLUSIVO
                </span>
              </h1>

              <p className="text-slate-400 text-sm md:text-base font-medium max-w-xl leading-relaxed">
                Capacitación vial profesional, licencias de conducción y certificaciones con tarifas preferenciales para afiliados a FONASIN.
              </p>

              {/* Badges Flotantes de Beneficios */}
              <div className="flex flex-wrap gap-2.5 pt-1">
                {[
                  { icon: GraduationCap, text: 'Todas las Categorías', color: 'text-red-500' },
                  { icon: Zap, text: 'Trámites Ágiles', color: 'text-amber-400' },
                  { icon: ShieldCheck, text: 'Certificado ISO', color: 'text-emerald-400' }
                ].map((badge, idx) => (
                  <div key={idx} className="bg-slate-950/90 border border-slate-800/80 text-slate-300 text-xs font-semibold px-3.5 py-2 rounded-xl flex items-center space-x-2 shadow-md hover:border-red-500/40 hover:scale-105 transition-all duration-300 cursor-default">
                    <badge.icon className={`w-4 h-4 ${badge.color}`} />
                    <span>{badge.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Tarjeta de Destacado con Efecto Glow Resplandeciente */}
            <div className="lg:col-span-4">
              <div className="relative group/card">
                <div className="absolute -inset-1 bg-gradient-to-r from-red-600 to-amber-500 rounded-3xl blur opacity-30 group-hover/card:opacity-75 transition duration-500"></div>
                <div className="relative bg-gradient-to-b from-slate-900 via-red-950/80 to-slate-950 text-white rounded-3xl p-6 border border-red-500/40 text-center shadow-2xl overflow-hidden">
                  
                  {/* Luz Deslizante */}
                  <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/card:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none" />

                  <span className="bg-red-600/30 text-red-300 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-red-500/40 inline-block mb-3">
                    🔥 Recomendado
                  </span>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Curso B1 (Carro)</p>
                  <div className="text-4xl font-black my-2 tracking-tight text-white drop-shadow-md">$ 1.440.000</div>
                  <p className="text-xs font-semibold text-red-300">Tarifa especial con descuento de nómina</p>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* CERTIFICACIONES DE CALIDAD EN TARGETAS INTERACTIVAS */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: ShieldAlert, title: 'Licencia SST 25497', sub: 'Vigencia Oficial 2025', color: 'text-red-500', bg: 'hover:border-red-500/50' },
            { icon: Award, title: 'Certificación ISO 9001', sub: 'Gestión de Calidad', color: 'text-amber-400', bg: 'hover:border-amber-500/50' },
            { icon: Award, title: 'Certificación ISO 39001', sub: 'Seguridad Vial Internacional', color: 'text-amber-400', bg: 'hover:border-amber-500/50' }
          ].map((cert, idx) => (
            <div key={idx} className={`bg-slate-900/60 border border-slate-800/80 p-4 rounded-2xl flex items-center space-x-3.5 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 ${cert.bg} hover:shadow-lg`}>
              <div className={`bg-slate-950 p-2.5 rounded-xl border border-slate-800 ${cert.color}`}>
                <cert.icon className="w-5 h-5" />
              </div>
              <div className="text-xs">
                <p className="font-extrabold text-white">{cert.title}</p>
                <p className="text-slate-400">{cert.sub}</p>
              </div>
            </div>
          ))}
        </section>

        {/* SECCIÓN DOBLE: SERVICIOS Y CAPACITACIONES */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Servicios Empresariales */}
          <section className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4 backdrop-blur-md">
            <div className="flex items-center space-x-3 pb-3 border-b border-slate-800">
              <div className="p-2 bg-red-600/10 text-red-500 rounded-xl border border-red-500/20">
                <GraduationCap className="w-5 h-5" />
              </div>
              <h2 className="text-xs font-black text-white uppercase tracking-wider">Servicios Empresariales</h2>
            </div>
            <ul className="space-y-2">
              {serviciosEmpresariales.map((item, idx) => (
                <li key={idx} className="flex items-start space-x-3 text-xs text-slate-300 p-3 bg-slate-950/60 rounded-xl border border-slate-800/60 hover:border-slate-700 hover:text-white transition-all duration-200">
                  <CheckCircle2 className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <span className="font-semibold">{item}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Capacitaciones Especializadas */}
          <section className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4 backdrop-blur-md">
            <div className="flex items-center space-x-3 pb-3 border-b border-slate-800">
              <div className="p-2 bg-red-600/10 text-red-500 rounded-xl border border-red-500/20">
                <FileCheck className="w-5 h-5" />
              </div>
              <h2 className="text-xs font-black text-white uppercase tracking-wider">Capacitaciones y Cursos Cortos</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {capacitacionesServicios.map((item, idx) => (
                <div key={idx} className="flex items-center space-x-2.5 text-[11px] text-slate-300 p-2.5 bg-slate-950/40 rounded-xl border border-slate-800/50 hover:border-red-500/40 hover:bg-slate-950 hover:text-white transition-all duration-200 group">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0 group-hover:scale-150 transition-transform"></span>
                  <span className="font-medium truncate">{item}</span>
                </div>
              ))}
            </div>
          </section>

        </div>

        {/* TARIFAS DE CONVENIO CON HOVER GLOW & INTERACCIÓN */}
        <section className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6 backdrop-blur-md">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-xl font-black text-white tracking-tight flex items-center space-x-2">
                <span>Tarifas del Convenio 2026</span>
              </h2>
              <p className="text-xs text-slate-400">Precios especiales vigentes para el grupo familiar</p>
            </div>
            <span className="text-xs font-bold text-red-400 bg-red-950/60 border border-red-800/40 px-3.5 py-1.5 rounded-xl w-max shadow-sm">
              Descuentos Aplicados
            </span>
          </div>

          {/* Cursos Principales Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {tarifasConvenio.map((item, idx) => {
              const IconComp = item.icon;
              return (
                <div 
                  key={idx} 
                  className={`relative p-5 rounded-2xl border transition-all duration-300 flex flex-col justify-between space-y-4 group hover:-translate-y-1.5 ${
                    item.destacado 
                      ? 'bg-slate-950/90 border-red-500/80 hover:shadow-[0_0_25px_rgba(239,68,68,0.25)]' 
                      : 'bg-slate-950/50 border-slate-800/80 hover:border-slate-700 hover:shadow-lg'
                  }`}
                >
                  {item.destacado && (
                    <span className="absolute -top-2.5 right-4 bg-gradient-to-r from-red-600 to-rose-600 text-white text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-md">
                      Popular
                    </span>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="p-2.5 bg-slate-900 text-red-500 rounded-xl border border-slate-800 group-hover:scale-110 group-hover:border-red-500/30 transition-all duration-300">
                      <IconComp className="w-5 h-5" />
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{item.titulo}</p>
                    <p className="text-xl font-black text-white mt-0.5 tracking-tight group-hover:text-amber-300 transition-colors">{item.precio}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Otros Servicios */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
            {otrosServiciosTarifas.map((item, idx) => (
              <div key={idx} className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 flex items-center justify-between hover:border-slate-700 transition-all">
                <span className="text-xs font-bold text-slate-300">{item.titulo}</span>
                <span className="text-xs font-black text-emerald-400 bg-emerald-950/80 border border-emerald-800/50 px-3 py-1 rounded-xl shadow-inner">{item.precio}</span>
              </div>
            ))}
          </div>
        </section>

        {/* UBICACIONES Y CONTACTO CON TARJETAS GLOW */}
        <section className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6 backdrop-blur-md">
          <div className="flex items-center space-x-2">
            <MapPin className="w-5 h-5 text-red-500" />
            <h2 className="text-base font-black text-white uppercase tracking-wider">Sedes Principales</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {sedes.map((sede, idx) => (
              <div key={idx} className="p-4 bg-slate-950 rounded-2xl border border-slate-800/80 space-y-1 hover:border-red-500/40 hover:bg-slate-950/80 transition-all duration-300">
                <p className="text-xs font-extrabold text-red-400 uppercase tracking-wider">{sede.nombre}</p>
                <p className="text-xs text-slate-200 font-medium">{sede.direccion}</p>
                <p className="text-[11px] text-slate-500 font-semibold">{sede.ciudad}</p>
              </div>
            ))}
          </div>

          {/* Barra de Contacto Interactiva */}
          <div className="pt-4 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-semibold">
            <a href="tel:6076916141" className="flex items-center space-x-2.5 text-slate-300 p-3.5 bg-slate-950 hover:bg-slate-800 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all duration-300 hover:scale-[1.02]">
              <Phone className="w-4 h-4 text-red-500 shrink-0" />
              <span>607 6916141</span>
            </a>
            <a href="https://wa.me/573012478048" target="_blank" rel="noreferrer" className="flex items-center space-x-2.5 text-slate-300 p-3.5 bg-slate-950 hover:bg-slate-800 rounded-2xl border border-slate-800 hover:border-emerald-500/40 transition-all duration-300 hover:scale-[1.02]">
              <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>301 2478048</span>
            </a>
            <a href="mailto:academico@ceapracticar.com" className="flex items-center space-x-2.5 text-slate-300 p-3.5 bg-slate-950 hover:bg-slate-800 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all duration-300 truncate hover:scale-[1.02]">
              <Mail className="w-4 h-4 text-red-500 shrink-0" />
              <span className="truncate">academico@ceapracticar.com</span>
            </a>
            <a href="https://www.ceapracticar.com" target="_blank" rel="noreferrer" className="flex items-center justify-between text-slate-300 p-3.5 bg-slate-950 hover:bg-slate-800 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all duration-300 hover:scale-[1.02]">
              <span className="truncate">www.ceapracticar.com</span>
              <ArrowUpRight className="w-4 h-4 text-slate-500 shrink-0" />
            </a>
          </div>
        </section>

        {/* Footer Comercial */}
        <footer className="mt-8 text-center text-xs text-slate-500 font-medium space-y-1">
          <p>FONASIN - Fondo de Empleados del Sector Mineroenergético</p>
          <p className="text-slate-600">Alianza con Instituto Practi-Car / Grupo Empresarial Practicar.</p>
        </footer>

      </main>
    </div>
  );
}