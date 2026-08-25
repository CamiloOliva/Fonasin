import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Shield, Scale, Car, FileText, Compass, Award, Phone,
  ArrowLeft, Sparkles, ShieldCheck, Percent, Calendar, MapPin, 
  HeartHandshake, Building2, UserCheck, AlertTriangle, Home,
  CreditCard, Briefcase, ChevronRight, CheckCircle2
} from 'lucide-react';

export default function ConvenioGrupoManejar() {
  const [categoriaActiva, setCategoriaActiva] = useState('todos');

  // Sección 1: Servicios del convenio
  const serviciosPrincipales = [
    { title: 'Seguros Generales', desc: 'Protección integral para bienes y patrimonio.', icon: Shield },
    { title: 'Gestión de Riesgos Laborales', desc: 'Administración y consultoría para ARL.', icon: Briefcase },
    { title: 'Multitrámites & Servicios', desc: 'Gestión ágil de documentación y trámites vehiculares.', icon: FileText },
    { title: 'Escuela de Conducción', desc: 'Formación y licencias de conducción.', icon: Car },
    { title: 'Gestoría de Tránsito', desc: 'Trámites ante organismos de tránsito a nivel nacional.', icon: Compass },
    { title: 'Asesoría Integral de Seguros', desc: 'Acompañamiento experto en selección de pólizas.', icon: Award },
    { title: 'Póliza Asistencia Conductores', desc: 'Protección legal y asistencial en vía.', icon: ShieldCheck },
    { title: 'Abogados & Asesoría Jurídica', desc: 'Respaldo legal especializado en tránsito y civil.', icon: Scale }
  ];

  // Sección 2: Beneficios clave
  const beneficiosSOAT = [
    {
      title: 'Descuento SOAT 4%',
      desc: '4% de descuento sobre el valor prima a nivel nacional. Entrega digital inmediata (excepto zona costa).',
      badge: '4% OFF',
      icon: Percent
    },
    {
      title: 'Financiamiento Flexible',
      desc: 'Financiación a 6 o 12 meses. Aplica para SOAT, revisión técnico-mecánica, impuesto, comparendos y más.',
      badge: '6 o 12 Meses',
      icon: Calendar
    },
    {
      title: 'Revisiones Técnico-Mecánicas',
      desc: 'Convenios directos con diferentes CDA en Bucaramanga y su área metropolitana.',
      badge: 'Área Metropolitana',
      icon: Car
    },
    {
      title: 'Gestoría de Tránsito Preferencial',
      desc: '50% de descuento en el área metropolitana de Bucaramanga (Girón, Piedecuesta, Lebrija, Floridablanca) y 10% a nivel nacional.',
      badge: 'Hasta 50% OFF',
      icon: MapPin
    },
    {
      title: 'Pólizas de Full Amparo',
      desc: '5% de descuento sobre el valor prima para protección vehicular total.',
      badge: '5% OFF',
      icon: Shield
    }
  ];

  // Póliza ASISPOL (Asistencia integral de conductores)
  const coberturasAsispol = [
    'Asesoría jurídica integral en accidentes',
    'Asesoría jurídica en daños a vehículos',
    'Asistencia jurídica penal',
    'Casa por cárcel o arresto domiciliario',
    'Auxilio por detención (2 S.M.M.L.V.)',
    'Gestoría de tránsito preferencial',
    'Renta diaria de $40.000 por hospitalización en accidente de tránsito',
    'Monitoreo del estado de las vías',
    'Asesoría en caso de robo de vehículos',
    'Asistencia emocional telefónica 24/7'
  ];

  // Sección 3: Otras soluciones y servicios
  const otrasSoluciones = [
    { title: 'Seguros de Vida', desc: 'Individual y colectivo', icon: HeartHandshake },
    { title: 'Seguros Vehiculares', desc: 'Individual y colectivo', icon: Car },
    { title: 'Pólizas de Salud', desc: 'Cobertura médica avanzada', icon: ShieldCheck },
    { title: 'Planes Exequiales', desc: 'Protección familiar integral', icon: UserCheck },
    { title: 'Traslado de EPS', desc: 'Y colocación de planes complementarios', icon: Building2 },
    { title: 'ARL', desc: 'Riesgos laborales', icon: Briefcase },
    { title: 'Inmobiliaria', desc: 'Gestión y asesoría de finca raíz', icon: Home },
    { title: 'Responsabilidad Civil', desc: 'Extracontractual', icon: Scale },
    { title: 'Pólizas de Cumplimiento', desc: 'Garantías contractuales', icon: FileText },
    { title: 'Títulos de Capitalización', desc: 'Ahorro programado', icon: CreditCard },
    { title: 'Pólizas de Hogar', desc: 'Protección para tu vivienda', icon: Home }
  ];

  return (
    <div className="min-h-screen bg-[#070b12] text-slate-100 font-sans pb-20 relative selection:bg-amber-400 selection:text-slate-950 overflow-x-hidden">

      {/* Glow ambiental dorado/ámbar automotriz */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[900px] h-[450px] bg-gradient-to-b from-amber-600/15 via-blue-600/10 to-transparent blur-[140px] pointer-events-none z-0" />

      {/* HEADER FLOTANTE HIGH-TECH */}
      <header className="sticky top-4 z-50 max-w-5xl mx-auto px-4">
        <div className="bg-slate-900/80 backdrop-blur-2xl border border-slate-800/80 rounded-full px-4 sm:px-6 py-3 flex justify-between items-center shadow-[0_10px_35px_rgba(0,0,0,0.6)]">
          
          {/* BOTÓN DE REGRESAR PREMIUM (CON GLOW Y SHINE EFFECT) */}
          <Link
            to="/convenios"
            className="relative group overflow-hidden inline-flex items-center space-x-2.5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-slate-200 hover:text-white px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-wider transition-all duration-300 border border-slate-700/80 hover:border-amber-400 shadow-[0_0_15px_rgba(0,0,0,0.5)] hover:shadow-[0_0_25px_rgba(245,158,11,0.35)] active:scale-95"
          >
            {/* Destello de luz desvaneciente */}
            <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-amber-400/25 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none" />
            
            <ArrowLeft className="w-4 h-4 text-amber-400 group-hover:-translate-x-1.5 transition-transform duration-300" />
            <span className="relative z-10 font-bold">Volver a Convenios</span>
          </Link>

          {/* BADGE INSTITUCIONAL CON PULSO */}
          <div className="hidden sm:flex items-center space-x-2 bg-slate-950/90 border border-amber-500/30 text-amber-400 px-4 py-2 rounded-full text-xs font-extrabold shadow-[0_0_15px_rgba(245,158,11,0.15)]">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
            </span>
            <span>FONASIN + Grupo Manejar</span>
          </div>

        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 space-y-12 relative z-10">

        {/* HERO BANNER - BENTO GRID AUTOMOTRIZ & LEGAL */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          <div className="lg:col-span-8 bg-gradient-to-br from-slate-900/95 via-slate-900/80 to-slate-950 border border-slate-800/80 rounded-3xl p-8 shadow-2xl flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-amber-500/20 transition-all duration-700" />
            
            <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center space-x-2 text-xs font-bold text-amber-300 bg-amber-950/80 border border-amber-500/30 px-3.5 py-1.5 rounded-xl backdrop-blur-md shadow-[0_0_10px_rgba(245,158,11,0.1)]">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Asesores Integrales de Servicios</span>
                </span>
                <span className="text-[11px] text-slate-400 font-semibold bg-slate-950 px-3 py-1 rounded-xl border border-slate-800">
                  Área Metropolitana de Bucaramanga & Nacional
                </span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
                Protección Vial, Seguros y <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-300 to-yellow-200">
                  Soluciones Jurídicas.
                </span>
              </h1>

              <p className="text-slate-400 text-sm leading-relaxed max-w-xl font-medium">
                Descuentos exclusivos en SOAT, trámites de tránsito, revisión técnico-mecánica y asistencia legal en vía para asociados a FONASIN y sus familias.
              </p>
            </div>

            {/* Micro-pills destacadas */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-8">
              {[
                { title: 'SOAT Digital', sub: '4% Descuento' },
                { title: 'Trámites', sub: 'Hasta 50% OFF' },
                { title: 'Full Amparo', sub: '5% Descuento' },
                { title: 'Financiación', sub: '6 a 12 Meses' }
              ].map((pill, idx) => (
                <div key={idx} className="bg-slate-950/80 border border-slate-800/90 p-3 rounded-2xl text-center hover:border-amber-500/40 transition-all">
                  <p className="text-xs font-black text-amber-400">{pill.title}</p>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5">{pill.sub}</p>
                </div>
              ))}
            </div>
          </div>

          {/* CARD DE BENEFICIOS LEGALES GRATUITOS (BENTO DERECHO) */}
          <div className="lg:col-span-4 bg-gradient-to-b from-amber-950/30 via-slate-900 to-slate-950 border border-amber-500/30 rounded-3xl p-6 sm:p-7 shadow-[0_0_40px_rgba(245,158,11,0.1)] flex flex-col justify-between space-y-5">
            <div className="flex items-center space-x-2.5 pb-3 border-b border-slate-800">
              <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-2xl border border-amber-500/20">
                <Scale className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-white">Beneficios Adicionales</h3>
                <p className="text-[10px] text-amber-300 font-semibold">Incluidos en el Convenio</p>
              </div>
            </div>

            <div className="space-y-3.5">
              <div className="bg-slate-950/90 p-4 rounded-2xl border border-slate-800/90 space-y-1.5">
                <div className="flex items-center space-x-2 text-amber-400">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <p className="text-xs font-black text-white">3 Asesorías Jurídicas Gratis</p>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed pl-6">
                  Atención por parte del Departamento Jurídico sin costo para afiliados al convenio.
                </p>
              </div>

              <div className="bg-slate-950/90 p-4 rounded-2xl border border-slate-800/90 space-y-1.5">
                <div className="flex items-center space-x-2 text-amber-400">
                  <Home className="w-4 h-4 shrink-0" />
                  <p className="text-xs font-black text-white">Servicios Inmobiliarios</p>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed pl-6">
                  Gestión, venta y arrendamiento con tarifas preferenciales.
                </p>
              </div>
            </div>

            <div className="p-3 bg-amber-950/40 rounded-xl border border-amber-500/20 text-center">
              <p className="text-[10px] text-amber-200 font-bold">
                🤝 Respaldo directo de Grupo Manejar para afiliados de FONASIN.
              </p>
            </div>
          </div>

        </section>

        {/* SECCIÓN 1: SERVICIOS DEL CONVENIO GRID */}
        <section className="space-y-5">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center space-x-3">
              <div className="w-7 h-7 rounded-xl bg-amber-500 text-slate-950 font-black flex items-center justify-center text-xs">
                1
              </div>
              <h2 className="text-base font-black tracking-tight text-white uppercase">Servicios del Convenio</h2>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {serviciosPrincipales.map((srv, idx) => {
              const IconComp = srv.icon;
              return (
                <div key={idx} className="bg-slate-900/70 border border-slate-800/80 p-4 rounded-2xl flex flex-col justify-between space-y-3 hover:border-amber-500/40 hover:bg-slate-900 transition-all duration-300 group hover:-translate-y-1 shadow-md">
                  <div className="p-2.5 bg-slate-950 text-amber-400 rounded-xl border border-slate-800 w-max group-hover:scale-110 group-hover:border-amber-500/30 transition-transform">
                    <IconComp className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-extrabold text-white group-hover:text-amber-300 transition-colors">{srv.title}</h3>
                    <p className="text-[11px] text-slate-400 mt-1 leading-snug">{srv.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* SECCIÓN 2: BENEFICIOS DESTACADOS & ASISPOL */}
        <section className="space-y-5">
          <div className="flex items-center space-x-3 pb-2 border-b border-slate-800">
            <div className="w-7 h-7 rounded-xl bg-amber-500 text-slate-950 font-black flex items-center justify-center text-xs">
              2
            </div>
            <h2 className="text-base font-black tracking-tight text-white uppercase">Beneficios y Tarifas Exclusivas</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Beneficios SOAT, Trámites y Pólizas */}
            <div className="lg:col-span-7 space-y-3">
              {beneficiosSOAT.map((ben, idx) => {
                const IconComp = ben.icon;
                return (
                  <div key={idx} className="bg-slate-900/80 border border-slate-800/80 p-4 rounded-2xl flex items-start space-x-4 hover:border-amber-500/30 transition-all group">
                    <div className="p-3 bg-slate-950 text-amber-400 rounded-xl border border-slate-800 shrink-0 group-hover:scale-105 transition-transform">
                      <IconComp className="w-5 h-5" />
                    </div>
                    <div className="space-y-1 flex-1">
                      <div className="flex justify-between items-center">
                        <h3 className="text-xs font-extrabold text-white group-hover:text-amber-300 transition-colors">{ben.title}</h3>
                        <span className="text-[9px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-md">
                          {ben.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">{ben.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Cobertura Póliza ASISPOL */}
            <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between space-y-4 backdrop-blur-md">
              <div className="space-y-3">
                <div className="flex items-center space-x-2.5 pb-2 border-b border-slate-800">
                  <ShieldCheck className="w-5 h-5 text-amber-400" />
                  <h3 className="text-xs font-black uppercase text-white tracking-wider">ASISPOL — Póliza para Conductores</h3>
                </div>
                <p className="text-[11px] text-slate-400 font-medium">
                  Asistencia integral en carretera con amplio respaldo legal e indemnizatorio:
                </p>

                <div className="space-y-2 pt-1">
                  {coberturasAsispol.map((item, idx) => (
                    <div key={idx} className="flex items-start space-x-2 text-[11px] text-slate-300">
                      <ChevronRight className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 text-center">
                <p className="text-[10px] text-slate-400 italic">
                  *Aplica para conductores afiliados bajo la póliza colectiva de asistencia.
                </p>
              </div>
            </div>

          </div>
        </section>

        {/* SECCIÓN 3: OTRAS SOLUCIONES Y SERVICIOS GRID */}
        <section className="space-y-5">
          <div className="flex items-center space-x-3 pb-2 border-b border-slate-800">
            <div className="w-7 h-7 rounded-xl bg-amber-500 text-slate-950 font-black flex items-center justify-center text-xs">
              3
            </div>
            <h2 className="text-base font-black tracking-tight text-white uppercase">Otras Soluciones y Servicios</h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {otrasSoluciones.map((item, idx) => {
              const IconComp = item.icon;
              return (
                <div key={idx} className="bg-slate-950/80 border border-slate-800/80 p-3.5 rounded-2xl text-center space-y-2 hover:border-amber-500/40 transition-all group">
                  <div className="p-2 bg-slate-900 text-amber-400 rounded-xl border border-slate-800 w-max mx-auto group-hover:scale-110 transition-transform">
                    <IconComp className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-[11px] font-bold text-white leading-tight">{item.title}</h3>
                    <p className="text-[9px] text-slate-400 mt-0.5">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* FOOTER INFORMACIÓN DE CONTACTO */}
        <footer className="bg-gradient-to-r from-slate-900 via-amber-950/20 to-slate-900 border border-slate-800/90 rounded-3xl p-6 flex flex-col sm:flex-row justify-between items-center gap-5 shadow-xl">
          <div className="flex items-center space-x-3.5">
            <div className="p-3 bg-amber-500/10 rounded-2xl border border-amber-500/20 text-amber-400">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-black text-white">FONASIN + Grupo Manejar</p>
              <p className="text-[11px] text-slate-400">Asesores Integrales de Servicios a tu disposición</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 w-full sm:w-auto">
            <div className="flex-1 sm:flex-initial inline-flex items-center justify-center space-x-2 bg-slate-950 border border-amber-500/30 px-4 py-2.5 rounded-xl text-xs font-extrabold text-amber-300">
              <span>Bucaramanga & Área Metropolitana</span>
            </div>
          </div>
        </footer>

      </main>
    </div>
  );
}