import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Clock, ShieldCheck, HeartPulse, Users, Home, AlertCircle, 
  Ambulance, Stethoscope, PhoneCall, Activity, MapPin, 
  CreditCard, Globe, Laptop, Heart, Utensils, Award, ArrowLeft,
  Sparkles, CheckCircle, ShieldAlert, HeartHandshake, Phone, Info
} from 'lucide-react';

export default function ConvenioEmermedica() {
  const [rangoSeleccionado, setRangoSeleccionado] = useState('rango1'); // 'rango1' (15-49) u 'rango2' (50+)

  const serviciosCriticos = [
    {
      icon: AlertCircle,
      tag: 'Triage I & II',
      badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
      title: 'Emergencias Médicas',
      desc: 'Riesgo vital inminente. Despliegue de Unidad de Cuidado Intensivo móvil con equipo médico a bordo.'
    },
    {
      icon: Activity,
      tag: 'Triage III',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      title: 'Urgencias Médicas',
      desc: 'Síntomas agudos que requieren pronta intervención médica para estabilizar y evitar complicaciones.'
    },
    {
      icon: Stethoscope,
      tag: 'Atención Directa',
      badgeColor: 'bg-teal-500/20 text-teal-300 border-teal-500/40',
      title: 'Consulta Domiciliaria',
      desc: 'Atención personalizada en la comodidad de tu hogar para diagnósticos y tratamientos iniciales.'
    },
    {
      icon: PhoneCall,
      tag: 'Triage IV & V',
      badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
      title: 'Telemedicina Inmediata',
      desc: 'Orientación virtual o telefónica con médicos generales en menos de 5 minutos.'
    }
  ];

  const pillsBeneficios = [
    { text: 'Sin restricción de uso', icon: ShieldCheck },
    { text: 'Sin exámenes de ingreso', icon: HeartPulse },
    { text: 'Sin preexistencias', icon: CheckCircle },
    { text: 'Sin copagos adicionales', icon: CreditCard },
    { text: 'Medicamentos incluidos en atención', icon: Sparkles },
    { text: 'Para todo tu grupo familiar', icon: Users }
  ];

  const serviciosAdicionalesGrid = [
    { title: 'Red de Especialistas', desc: '+600 médicos en alianza comercial con tarifas reducidas.', icon: Users },
    { title: 'Club de Descuentos', desc: 'Tarifas especiales en +230 establecimientos aliados.', icon: CreditCard },
    { title: 'Asistencia en Viajes', desc: 'Cobertura nacional e internacional por reciprocidad sin costo.', icon: Globe },
    { title: 'Portal Tu Emermédica', desc: 'Plataforma digital 24/7 para trámites y consultas.', icon: Laptop },
    { title: 'Orientación Emocional', desc: 'Soporte psicológico y telefónico profesional continuo.', icon: PhoneCall },
    { title: 'Salud Nutricional', desc: 'Asesoría experta telefónica en nutrición y bienestar.', icon: Utensils }
  ];

  const ciudades = ['Bogotá', 'Soacha', 'Chía', 'Cali', 'Neiva', 'Villavicencio', 'Bucaramanga', 'Medellín', 'Barranquilla', 'Cartagena'];

  return (
    <div className="min-h-screen bg-[#060b14] text-slate-100 font-sans pb-20 relative selection:bg-cyan-400 selection:text-slate-950 overflow-x-hidden">

      {/* Aura ambiental de fondo */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[900px] h-[450px] bg-gradient-to-b from-cyan-600/20 via-blue-600/10 to-transparent blur-[140px] pointer-events-none z-0" />

      {/* HEADER FLOTANTE HIGH-TECH */}
      <header className="sticky top-4 z-50 max-w-5xl mx-auto px-4">
        <div className="bg-slate-900/80 backdrop-blur-2xl border border-slate-800/80 rounded-full px-4 sm:px-6 py-3 flex justify-between items-center shadow-[0_10px_35px_rgba(0,0,0,0.6)]">
          
          {/* BOTÓN DE REGRESAR CON EFECTO NEÓN & SHINE */}
          <Link
            to="/convenios"
            className="relative group overflow-hidden inline-flex items-center space-x-2.5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-slate-200 hover:text-white px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-wider transition-all duration-300 border border-slate-700/80 hover:border-cyan-400 shadow-[0_0_15px_rgba(0,0,0,0.5)] hover:shadow-[0_0_25px_rgba(6,182,212,0.4)] active:scale-95"
          >
            {/* Destello de luz desvaneciente (Shine effect) */}
            <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-cyan-400/25 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none" />
            
            <ArrowLeft className="w-4 h-4 text-cyan-400 group-hover:-translate-x-1.5 transition-transform duration-300" />
            <span className="relative z-10 font-bold">Volver a Convenios</span>
          </Link>

          {/* BADGE INSTITUCIONAL CON PULSO */}
          <div className="hidden sm:flex items-center space-x-2 bg-slate-950/90 border border-cyan-500/30 text-cyan-400 px-4 py-2 rounded-full text-xs font-extrabold shadow-[0_0_15px_rgba(6,182,212,0.15)]">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
            </span>
            <span>Convenio FONASIN 2026</span>
          </div>

        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 space-y-12 relative z-10">

        {/* HERO - Layout Asimétrico con Bento Box Integrado */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* Main Hero Card */}
          <div className="lg:col-span-7 bg-gradient-to-br from-slate-900/95 via-slate-900/80 to-blue-950/50 border border-slate-800/80 rounded-3xl p-8 shadow-2xl flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-72 h-72 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none group-hover:bg-cyan-500/25 transition-all duration-700" />
            
            <div className="space-y-6">
              <span className="inline-flex items-center space-x-2 text-xs font-bold text-cyan-300 bg-cyan-950/80 border border-cyan-500/30 px-3.5 py-1.5 rounded-xl backdrop-blur-md shadow-[0_0_10px_rgba(6,182,212,0.1)]">
                <ShieldAlert className="w-4 h-4 text-cyan-400" />
                <span>Protección Médica 24/7/365</span>
              </span>

              <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
                Respuesta Médica <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-emerald-300">
                  Sin Fronteras.
                </span>
              </h1>

              <p className="text-slate-400 text-sm leading-relaxed max-w-lg font-medium">
                Atención médica prehospitalaria, unidades móviles medicalizadas y telemedicina sin copagos ni restricciones para afiliados a FONASIN.
              </p>
            </div>

            {/* Pills de Beneficios Clave */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-8">
              {pillsBeneficios.map((pill, idx) => (
                <div key={idx} className="flex items-center space-x-2 bg-slate-950/70 border border-slate-800/80 px-3 py-2.5 rounded-xl text-[11px] font-semibold text-slate-300 hover:border-cyan-500/40 hover:text-white transition-all cursor-default shadow-sm">
                  <pill.icon className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span className="truncate">{pill.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* PANEL INFORMATIVO DE TARIFAS (SIN BOTÓN DE AFILIACIÓN) */}
          <div className="lg:col-span-5 bg-slate-900/90 border border-cyan-500/30 rounded-3xl p-6 sm:p-7 shadow-[0_0_40px_rgba(6,182,212,0.12)] flex flex-col justify-between space-y-6 relative overflow-hidden">
            
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-cyan-500/10 text-cyan-400 rounded-xl border border-cyan-500/20">
                  <Info className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-black uppercase tracking-wider text-white">Tarifas del Convenio</h3>
              </div>
              <span className="text-[10px] bg-emerald-950/80 text-emerald-300 font-extrabold px-3 py-1 rounded-full border border-emerald-500/30">
                Tarifas Colectivas
              </span>
            </div>

            {/* Selector de Rango de Afiliados */}
            <div className="space-y-3">
              <p className="text-xs font-semibold text-slate-400">Selecciona el rango de grupo:</p>
              
              <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setRangoSeleccionado('rango1')}
                  className={`py-2 px-3 rounded-xl text-xs font-extrabold transition-all duration-300 ${
                    rangoSeleccionado === 'rango1'
                      ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  15 a 49 Afiliados
                </button>
                <button
                  type="button"
                  onClick={() => setRangoSeleccionado('rango2')}
                  className={`py-2 px-3 rounded-xl text-xs font-extrabold transition-all duration-300 ${
                    rangoSeleccionado === 'rango2'
                      ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  50+ Afiliados
                </button>
              </div>
            </div>

            {/* Display de Valor Informativo */}
            <div className="bg-slate-950/90 p-5 rounded-2xl border border-slate-800/90 space-y-2 text-center relative overflow-hidden">
              <span className="text-[10px] uppercase font-bold tracking-widest text-cyan-400">
                Costo Mensual por Beneficiario
              </span>
              <div className="text-4xl font-black text-emerald-400 tracking-tight">
                {rangoSeleccionado === 'rango1' ? '$35.900' : '$31.500'}
                <span className="text-xs text-slate-400 font-normal ml-1">/ mes</span>
              </div>
              <p className="text-[11px] text-slate-400 pt-1">
                Incluye IVA y aplicación de medicamentos durante la atención médica sin costo adicional.
              </p>
            </div>

            {/* Nota aclaratoria del convenio */}
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-[10px] text-slate-400 leading-relaxed text-center">
              💡 <span className="text-slate-300 font-semibold">Información del convenio:</span> Consulta con el Fondo de Empleados FONASIN para conocer los detalles del descuento por nómina.
            </div>

          </div>

        </section>

        {/* NIVELES DE ATENCIÓN (Triage/Severidad) */}
        <section className="space-y-4">
          <div className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-black tracking-tight text-white uppercase">Esquema Operativo de Atención</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {serviciosCriticos.map((srv, idx) => {
              const IconComponent = srv.icon;
              return (
                <div key={idx} className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 hover:border-cyan-500/40 hover:bg-slate-900/90 transition-all duration-300 flex flex-col justify-between space-y-4 group hover:-translate-y-1 shadow-md">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 group-hover:scale-110 transition-transform">
                        <IconComponent className="w-5 h-5 text-cyan-400" />
                      </div>
                      <span className={`text-[9px] font-black uppercase px-2.5 py-0.5 rounded-md border ${srv.badgeColor}`}>
                        {srv.tag}
                      </span>
                    </div>
                    <h3 className="text-xs font-extrabold text-white group-hover:text-cyan-300 transition-colors">{srv.title}</h3>
                    <p className="text-[11px] text-slate-400 leading-relaxed">{srv.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* SERVICIOS ADICIONALES Y COBERTURA */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Ecosistema de Beneficios */}
          <section className="lg:col-span-8 bg-slate-900/70 border border-slate-800 rounded-3xl p-6 space-y-4 backdrop-blur-md">
            <h2 className="text-xs font-black text-white uppercase tracking-wider flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>Ecosistema de Beneficios Integrados</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {serviciosAdicionalesGrid.map((item, idx) => {
                const IconComponent = item.icon;
                return (
                  <div key={idx} className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800/80 hover:border-cyan-500/30 transition-all">
                    <IconComponent className="w-4 h-4 text-cyan-400 mb-2" />
                    <h3 className="text-xs font-bold text-white">{item.title}</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">{item.desc}</p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Mapa de Cobertura Geográfica */}
          <section className="lg:col-span-4 bg-slate-900/70 border border-slate-800 rounded-3xl p-6 space-y-4 flex flex-col justify-between backdrop-blur-md">
            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-cyan-400">
                <MapPin className="w-4 h-4" />
                <h2 className="text-xs font-black uppercase tracking-wider text-white">Cobertura Principal</h2>
              </div>
              <p className="text-xs text-slate-400">
                Móviles equipadas con tecnología GPS para asistencia inmediata en:
              </p>
              
              <div className="flex flex-wrap gap-1.5 pt-1">
                {ciudades.map((ciudad, idx) => (
                  <span key={idx} className="bg-slate-950 text-slate-300 text-[10px] font-semibold px-2.5 py-1 rounded-lg border border-slate-800">
                    {ciudad}
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-slate-950/90 p-3.5 rounded-2xl border border-slate-800/80 text-[10px] text-slate-400 italic">
              *Para ciudades fuera de esta lista se activa la red de reciprocidad internacional.
            </div>
          </section>

        </div>

        {/* FOOTER CON BOTONES DE CONTACTO AVANZADOS */}
        <footer className="bg-gradient-to-r from-slate-900 via-blue-950/40 to-slate-900 border border-slate-800/90 rounded-3xl p-6 flex flex-col sm:flex-row justify-between items-center gap-5 shadow-xl">
          <div className="flex items-center space-x-3.5">
            <div className="p-3 bg-cyan-500/10 rounded-2xl border border-cyan-500/20 text-cyan-400">
              <Ambulance className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <p className="text-xs font-black text-white">Líneas Directas de Atención 24/7</p>
              <p className="text-[11px] text-slate-400">Urgencias, Emergencias y Telemedicina</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 w-full sm:w-auto">
            {/* BOTONES DE LLAMADA CON EFECTO HOVER NEÓN */}
            <a 
              href="tel:6076913000" 
              className="flex-1 sm:flex-initial inline-flex items-center justify-center space-x-2 bg-slate-950 hover:bg-cyan-500/10 text-cyan-300 hover:text-cyan-200 border border-cyan-500/30 hover:border-cyan-400 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all duration-300 shadow-md hover:shadow-[0_0_20px_rgba(6,182,212,0.25)] active:scale-95"
            >
              <Phone className="w-3.5 h-3.5 text-cyan-400" />
              <span>607 691 3000</span>
            </a>

            <a 
              href="tel:018000518777" 
              className="flex-1 sm:flex-initial inline-flex items-center justify-center space-x-2 bg-slate-950 hover:bg-emerald-500/10 text-emerald-300 hover:text-emerald-200 border border-emerald-500/30 hover:border-emerald-400 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all duration-300 shadow-md hover:shadow-[0_0_20px_rgba(16,185,129,0.25)] active:scale-95"
            >
              <Phone className="w-3.5 h-3.5 text-emerald-400" />
              <span>01 8000 518 777</span>
            </a>
          </div>
        </footer>

      </main>
    </div>
  );
}