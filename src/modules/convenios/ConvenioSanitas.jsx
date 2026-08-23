import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Phone, 
  MessageCircle, 
  CheckCircle2, 
  Heart, 
  ArrowLeft,
  Stethoscope,
  CalendarDays,
  Home,
  Hospital,
  Sparkles,
  Zap,
  Award,
  Clock,
  ShieldCheck
} from 'lucide-react';

export default function ConvenioSanitas() {

  const CONTACTO_ASESOR = {
    nombre: 'Edwar Vera Rueda',
    telefono: '3213265758',
    telefonoFormato: '321 326 5758'
  };

  const beneficios = [
    {
      icon: Stethoscope,
      title: "12 ESPECIALIDADES DIRECTAS",
      description: "Accede sin remisión médica previa a 12 especialidades clave para una atención oportuna y sin trámites innecesarios.",
      badge: "Acceso Directo"
    },
    {
      icon: CalendarDays,
      title: "CITAS EN MÁXIMO 5 DÍAS",
      description: "Garantía de asignación ágil de citas para atender tus requerimientos de salud cuando realmente los necesitas.",
      badge: "Atención Rápida"
    },
    {
      icon: Home,
      title: "MÉDICO AL HOGAR",
      description: "Atención médica domiciliaria prioritaria para cuidar de ti y tu grupo familiar sin tener que salir de casa.",
      badge: "Atención VIP"
    },
    {
      icon: Hospital,
      title: "HABITACIÓN INDIVIDUAL",
      description: "Hospitalización en habitación privada e individual a partir del primer (1°) día del séptimo (7°) mes de afiliación.",
      badge: "Máximo Confort"
    }
  ];

  return (
    <div className="min-h-screen bg-[#121e36] text-slate-100 relative overflow-hidden font-sans pb-20 selection:bg-sky-500 selection:text-white">

      {/* Luces de Fondo Dinámicas */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-gradient-to-tr from-sky-600/20 via-blue-500/10 to-transparent blur-[120px] pointer-events-none rounded-full animate-pulse" style={{ animationDuration: '6s' }} />
      <div className="absolute top-1/3 -right-20 w-[600px] h-[600px] bg-sky-400/10 blur-[150px] pointer-events-none rounded-full" />

      {/* Header Limpio con Botón de Regreso */}
      <header className="sticky top-0 z-50 bg-[#172542]/80 backdrop-blur-md border-b border-[#24375a]/80 shadow-2xl py-4 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <Link
            to="/convenios"
            className="group relative inline-flex items-center space-x-3 bg-[#1e3052] hover:bg-sky-500 text-white px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300 ease-out shadow-lg hover:shadow-sky-500/30 border border-[#324d7d] hover:border-sky-300 active:scale-95 overflow-hidden"
          >
            <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out pointer-events-none" />
            <ArrowLeft className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform duration-300 ease-out text-sky-400 group-hover:text-white" />
            <span className="tracking-wide">Volver a Convenios</span>
          </Link>
        </div>
      </header>

      {/* Cuerpo Principal */}
      <main className="max-w-6xl mx-auto px-6 pt-10 relative z-10 space-y-12">

        {/* HERO BANNER */}
        <section className="relative rounded-3xl bg-gradient-to-br from-[#172542] via-[#1a2948] to-[#121e36] p-6 sm:p-8 md:p-12 shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-[#263b63] overflow-hidden group">
          
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-sky-500/20 transition-all duration-700" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center relative z-10">
            
            {/* Mensaje Principal */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              
              <div className="space-y-3">
                <div className="inline-flex items-center space-x-2 bg-[#1e3052] border border-[#324d7d] rounded-full px-4 py-2 text-xs font-black text-sky-300 shadow-lg">
                  <Sparkles className="w-4 h-4 text-sky-400 animate-spin" style={{ animationDuration: '8s' }} />
                  <span className="tracking-widest uppercase">Alianza Médica Exclusiva</span>
                </div>

                <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight text-white">
                  ¡Bienvenidos <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-blue-300 to-sky-200 animate-pulse">Sanitas</span> Plan Premium y FONASIN!
                </h1>
              </div>

              <p className="text-slate-300 text-base md:text-lg font-normal leading-relaxed max-w-2xl">
                Unimos esfuerzos para brindarte cobertura integral en salud con facilidades únicas, atención médica preferencial y trámites ágiles para ti y tu familia.
              </p>

              {/* Pills de Beneficios */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="bg-[#1e3052]/70 hover:bg-[#21355c] border border-[#2e4775] hover:border-sky-400/50 rounded-2xl p-4 flex items-center space-x-3.5 shadow-md transition-all duration-300 transform hover:-translate-y-1">
                  <div className="bg-sky-500/20 p-2.5 rounded-xl text-sky-400 flex-shrink-0 border border-sky-500/30">
                    <Heart className="w-5 h-5 animate-pulse" style={{ animationDuration: '2s' }} />
                  </div>
                  <span className="text-slate-200 text-sm font-semibold leading-snug">Atención Integral Premium</span>
                </div>

                <div className="bg-[#1e3052]/70 hover:bg-[#21355c] border border-[#2e4775] hover:border-sky-400/50 rounded-2xl p-4 flex items-center space-x-3.5 shadow-md transition-all duration-300 transform hover:-translate-y-1">
                  <div className="bg-sky-500/20 p-2.5 rounded-xl text-sky-400 flex-shrink-0 border border-sky-500/30">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <span className="text-slate-200 text-sm font-semibold leading-snug">Respuesta Rápida y Segura</span>
                </div>
              </div>
            </div>

            {/* TARJETA DESTACADA REESTRUCTURADA (CORREGIDOS DESBORDAMIENTOS Y SOLAPAMIENTOS) */}
            <div className="lg:col-span-5 flex justify-center w-full">
              <div className="w-full max-w-sm bg-[#1a2948] rounded-3xl p-6 sm:p-7 border-2 border-sky-500/40 hover:border-sky-400 text-center shadow-2xl hover:shadow-[0_0_35px_rgba(56,189,248,0.25)] relative flex flex-col items-center justify-between gap-5 transition-all duration-500 transform hover:-translate-y-1 group/card box-border overflow-hidden">
                
                {/* Badge Superior Centrado */}
                <div className="w-full flex justify-center">
                  <span className="bg-gradient-to-r from-sky-500 to-blue-600 text-white border border-sky-300/30 text-[11px] font-black uppercase px-4 py-1.5 rounded-full tracking-wider shadow-lg shadow-sky-500/20 inline-block">
                    ★ Beneficio Destacado
                  </span>
                </div>

                {/* Ícono + Encabezados con Spacing Limpio */}
                <div className="w-full flex flex-col items-center space-y-2">
                  <Hospital className="w-14 h-14 text-sky-400 my-1 drop-shadow-[0_0_12px_rgba(56,189,248,0.5)] transform group-hover/card:scale-105 transition-transform duration-300 flex-shrink-0" />
                  <p className="text-xs font-black uppercase text-sky-300 tracking-widest">
                    HOSPITALIZACIÓN EN
                  </p>
                  <h3 className="text-2xl sm:text-3xl font-black text-white leading-tight tracking-tight">
                    HABITACIÓN INDIVIDUAL
                  </h3>
                </div>

                {/* Bloque Informativo con Flex Normalizado para Evitar Solapamientos */}
                <div className="w-full border border-[#3a5a96] bg-gradient-to-br from-[#142038] via-[#172542] to-[#0d1627] p-4 rounded-2xl shadow-inner box-border">
                  <div className="flex items-start gap-3">
                    <div className="bg-sky-500/20 p-2 rounded-xl text-sky-400 border border-sky-400/40 flex-shrink-0 mt-0.5 shadow-md">
                      <Clock className="w-4 h-4" />
                    </div>

                    <p className="text-xs font-medium text-slate-200 leading-relaxed text-left">
                      A partir del{' '}
                      <span className="font-black text-sky-300 bg-sky-950/90 px-2 py-0.5 rounded border border-sky-400/40 inline-whitespace-nowrap">
                        1° día
                      </span>{' '}
                      del{' '}
                      <span className="font-black text-sky-300 bg-sky-950/90 px-2 py-0.5 rounded border border-sky-400/40 inline-whitespace-nowrap">
                        7° mes
                      </span>{' '}
                      de tu afiliación.
                    </p>
                  </div>
                </div>

                {/* Pie Inferior Centrado */}
                <div className="flex items-center justify-center space-x-2 text-sky-400 font-bold text-xs tracking-wide pt-1">
                  <ShieldCheck className="w-4 h-4 text-sky-400 flex-shrink-0" />
                  <span>Confort total garantizado</span>
                </div>

              </div>
            </div>

          </div>
        </section>

        {/* CONTENEDOR BLANCO TIPO CARTA */}
        <section className="bg-white text-slate-800 rounded-3xl p-8 md:p-12 shadow-2xl space-y-8 relative overflow-hidden">
          
          <div className="border-b border-slate-200 pb-5 flex items-center justify-between">
            <div>
              <span className="text-xs font-black text-sky-600 uppercase tracking-widest block mb-1">¿POR QUÉ ELEGIR SANITAS?</span>
              <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Privilegios del Plan Premium</h2>
            </div>
            <Zap className="w-8 h-8 text-sky-500 hidden sm:block animate-pulse" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {beneficios.map((beneficio, index) => (
              <div 
                key={index} 
                className="group relative bg-slate-50 border border-slate-200/80 hover:border-sky-500/80 p-6 rounded-2xl shadow-sm hover:shadow-xl hover:shadow-sky-500/10 transition-all duration-300 flex flex-col justify-between space-y-4 transform hover:-translate-y-2 overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-sky-400 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="bg-sky-100 group-hover:bg-sky-500 group-hover:text-white p-3 rounded-xl text-sky-700 transition-colors duration-300 shadow-sm">
                      <beneficio.icon className="w-6 h-6 transform group-hover:scale-110 transition-transform duration-300" />
                    </div>
                    <span className="text-[10px] font-bold bg-slate-200 text-slate-700 px-2.5 py-1 rounded-full group-hover:bg-sky-100 group-hover:text-sky-800 transition-colors">
                      {beneficio.badge}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-base font-black text-slate-900 group-hover:text-sky-600 transition-colors leading-snug">
                      {beneficio.title}
                    </h3>
                    
                    <p className="text-xs text-slate-600 leading-relaxed font-normal">
                      {beneficio.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </section>

        {/* CALL TO ACTION - ASESOR */}
        <section className="bg-gradient-to-r from-[#172542] via-[#1a2948] to-[#172542] rounded-3xl p-8 md:p-10 text-white shadow-2xl border border-[#263b63] relative overflow-hidden group">
          
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8 relative z-10">
            
            <div className="flex items-center space-x-5 text-center lg:text-left">
              <div className="bg-sky-500/20 p-4 rounded-2xl text-sky-400 flex-shrink-0 border border-sky-500/30 hidden sm:block shadow-lg transform group-hover:scale-105 transition-transform">
                <Award className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <span className="bg-[#21355c] text-sky-300 text-xs font-black px-3.5 py-1 rounded-full uppercase tracking-wider inline-block mb-2 border border-[#3b5b99]">
                  Asesor Especializado Sanitas
                </span>
                <h3 className="text-2xl md:text-3xl font-black text-white tracking-tight">{CONTACTO_ASESOR.nombre}</h3>
                <p className="text-sm text-slate-300">Te orienta paso a paso en tu vinculación al convenio.</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
              <a
                href={`https://wa.me/57${CONTACTO_ASESOR.telefono}?text=Hola%20Edwar,%20soy%20asociado%20a%20FONASIN%20y%20quiero%20afiliarme%20a%20Sanitas`}
                target="_blank"
                rel="noreferrer"
                className="relative group/btn bg-emerald-600 hover:bg-emerald-500 text-white font-black px-7 py-4 rounded-2xl flex items-center justify-center space-x-2.5 transition-all duration-300 shadow-lg hover:shadow-emerald-500/30 text-sm active:scale-95 overflow-hidden"
              >
                <span className="absolute inset-0 w-full h-full bg-white/20 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700 ease-in-out pointer-events-none" />
                <MessageCircle className="w-5 h-5 fill-white" />
                <span>Escribir al WhatsApp</span>
              </a>

              <a
                href={`tel:${CONTACTO_ASESOR.telefono}`}
                className="bg-[#21355c] hover:bg-sky-600 text-white font-bold px-6 py-4 rounded-2xl flex items-center justify-center space-x-2.5 transition-all duration-300 text-sm border border-[#3b5b99] hover:border-sky-400 shadow-md active:scale-95"
              >
                <Phone className="w-4 h-4 text-sky-400 group-hover:text-white" />
                <span>{CONTACTO_ASESOR.telefonoFormato}</span>
              </a>
            </div>

          </div>
        </section>

        {/* Pie de Página */}
        <footer className="text-center text-xs text-slate-400 space-y-2 pt-4">
          <p className="font-semibold text-slate-300">FONASIN - Fondo de Empleados del Sector Mineroenergético</p>
          <p>Alianza exclusiva con Sanitas Plan Premium. Todos los derechos reservados.</p>
        </footer>

      </main>
    </div>
  );
}