import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Heart, Stethoscope, Search, Microscope, Eye, Pill, 
  Scan, ArrowLeft, CheckCircle2, ShieldCheck, MapPin, 
  Phone, Mail, Globe, Sparkles, Building2, HeartPulse, UserCheck, DollarSign
} from 'lucide-react';

export default function ConvenioUmaIps() {
  const [busqueda, setBusqueda] = useState('');

  // 22 Especialidades extraídas del afiche oficial
  const especialidades = [
    { id: 1, nombre: 'Dermatología', precio: '$96.000', descuento: '26%' },
    { id: 2, nombre: 'Neurología', precio: '$162.000', descuento: '19%' },
    { id: 3, nombre: 'Gastroenterología', precio: '$141.200', descuento: '44%' },
    { id: 4, nombre: 'Ginecología', precio: '$98.000', descuento: '27%' },
    { id: 5, nombre: 'Ortopedia', precio: '$180.000', descuento: '25%' },
    { id: 6, nombre: 'Internista', precio: '$152.000', descuento: '24%' },
    { id: 7, nombre: 'Fisiatría', precio: '$190.000', descuento: '46%' },
    { id: 8, nombre: 'Oftalmología', precio: '$80.000', descuento: '38%' },
    { id: 9, nombre: 'Psicología', precio: '$100.000', descuento: '20%' },
    { id: 10, nombre: 'Urología', precio: '$159.000', descuento: '16%' },
    { id: 11, nombre: 'Cardiología', precio: '$166.000', descuento: '34%' },
    { id: 12, nombre: 'Psiquiatría', precio: '$160.000', descuento: '16%' },
    { id: 13, nombre: 'Endocrinología Pediátrica', precio: '$162.000', descuento: '19%' },
    { id: 14, nombre: 'Endocrinología', precio: '$162.000', descuento: '19%' },
    { id: 15, nombre: 'Hepatología', precio: '$162.000', descuento: '26%' },
    { id: 16, nombre: 'Genética', precio: '$162.000', descuento: '46%' },
    { id: 17, nombre: 'Nefrología Pediátrica', precio: '$162.000', descuento: '35%' },
    { id: 18, nombre: 'Medicina del Estilo de Vida', precio: '$80.000', descuento: '20%' },
    { id: 19, nombre: 'Medicina del Dolor', precio: '$50.000', descuento: '50%' },
    { id: 20, nombre: 'Cirugía Vascular Periférica', precio: '$96.000', descuento: '47%' },
    { id: 21, nombre: 'Ortodoncia', precio: '$150.000', descuento: '36%' },
    { id: 22, nombre: 'Optometría', precio: '$25.000', descuento: '50%' }
  ];

  // Beneficios complementarios
  const complementarios = [
    { title: 'Laboratorio Clínico', desc: 'Exámenes de rutina y especializados.', icon: Microscope },
    { title: 'Odontología General', desc: 'Cuidado integral de la salud oral.', icon: HeartPulse },
    { title: 'Farmacia', desc: 'Suministro de medicamentos con tarifas especiales.', icon: Pill },
    { title: 'Óptica', desc: 'Salud visual y soluciones ópticas.', icon: Eye },
    { title: 'Imágenes Diagnósticas', desc: 'Apoyo tecnológico para diagnósticos precisos.', icon: Scan }
  ];

  const especialidadesFiltradas = especialidades.filter(esp =>
    esp.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#06110d] text-slate-100 font-sans pb-20 relative selection:bg-emerald-400 selection:text-slate-950 overflow-x-hidden">

      {/* Aura ambiental esmeralda/verde de UMA IPS */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[900px] h-[450px] bg-gradient-to-b from-emerald-600/20 via-teal-600/10 to-transparent blur-[140px] pointer-events-none z-0" />

      {/* HEADER FLOTANTE HIGH-TECH */}
      <header className="sticky top-4 z-50 max-w-5xl mx-auto px-4">
        <div className="bg-slate-900/80 backdrop-blur-2xl border border-slate-800/80 rounded-full px-4 sm:px-6 py-3 flex justify-between items-center shadow-[0_10px_35px_rgba(0,0,0,0.6)]">
          
          {/* BOTÓN DE REGRESAR PREMIUM (CON GLOW Y SHINE EFFECT) */}
          <Link
            to="/convenios"
            className="relative group overflow-hidden inline-flex items-center space-x-2.5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-slate-200 hover:text-white px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-wider transition-all duration-300 border border-slate-700/80 hover:border-emerald-400 shadow-[0_0_15px_rgba(0,0,0,0.5)] hover:shadow-[0_0_25px_rgba(16,185,129,0.35)] active:scale-95"
          >
            <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-emerald-400/25 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none" />
            <ArrowLeft className="w-4 h-4 text-emerald-400 group-hover:-translate-x-1.5 transition-transform duration-300" />
            <span className="relative z-10 font-bold">Volver a Convenios</span>
          </Link>

          {/* BADGE INSTITUCIONAL CON PULSO */}
          <div className="hidden sm:flex items-center space-x-2 bg-slate-950/90 border border-emerald-500/30 text-emerald-400 px-4 py-2 rounded-full text-xs font-extrabold shadow-[0_0_15px_rgba(16,185,129,0.15)]">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span>FONASIN + UMA IPS</span>
          </div>

        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 space-y-12 relative z-10">

        {/* HERO BANNER - BENTO GRID */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* Main Hero Card */}
          <div className="lg:col-span-7 bg-gradient-to-br from-slate-900/95 via-slate-900/80 to-emerald-950/40 border border-slate-800/80 rounded-3xl p-8 shadow-2xl flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-emerald-500/20 transition-all duration-700" />
            
            <div className="space-y-6">
              <span className="inline-flex items-center space-x-2 text-xs font-bold text-emerald-300 bg-emerald-950/80 border border-emerald-500/30 px-3.5 py-1.5 rounded-xl backdrop-blur-md shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                <Heart className="w-4 h-4 text-emerald-400" />
                <span>Programa de Atención Prioritaria en Salud</span>
              </span>

              <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
                Medicina Integral <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-300">
                  Para Todos.
                </span>
              </h1>

              <p className="text-slate-400 text-sm leading-relaxed max-w-xl font-medium">
                Atención integral, humana y oportuna para colaboradores de FONASIN y sus familias con acceso preferencial a especialistas y consultas sin límite.
              </p>
            </div>

            {/* Pilares del programa principal */}
            <div className="space-y-3 pt-6 border-t border-slate-800/80 mt-6">
              <div className="flex items-start space-x-3 text-xs text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong className="text-white">Consultas de Medicina General e Integrativa:</strong> agendamiento ágil, sin costo adicional y sin límite de consultas para el afiliado.</span>
              </div>
              <div className="flex items-start space-x-3 text-xs text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong className="text-white">Atención especializada:</strong> acceso preferencial a la red de especialistas con descuentos exclusivos en el valor de la consulta.</span>
              </div>
            </div>
          </div>

          {/* CARD PRECIO E INVERSIÓN (BENTO DERECHO) */}
          <div className="lg:col-span-5 bg-gradient-to-b from-emerald-950/40 via-slate-900 to-slate-950 border border-emerald-500/30 rounded-3xl p-6 sm:p-7 shadow-[0_0_40px_rgba(16,185,129,0.12)] flex flex-col justify-between space-y-6">
            
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
                  <UserCheck className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-black uppercase tracking-wider text-white">Programa Principal</h3>
              </div>
              <span className="text-[10px] bg-emerald-950/80 text-emerald-300 font-extrabold px-3 py-1 rounded-full border border-emerald-500/30">
                Activo 2026
              </span>
            </div>

            {/* Inversión Mensual Highlight */}
            <div className="bg-slate-950/90 p-5 rounded-2xl border border-slate-800/90 space-y-2 text-center relative overflow-hidden">
              <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-400">
                Inversión Mensual
              </span>
              <div className="text-4xl sm:text-5xl font-black text-emerald-400 tracking-tight">
                $7.000 <span className="text-sm text-slate-400 font-normal">COP</span>
              </div>
              <p className="text-[11px] text-slate-400 pt-1">
                Por afiliado / mes para acceso a todos los beneficios prioritarios.
              </p>
            </div>

            {/* Frase institucional */}
            <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 text-center space-y-1">
              <p className="text-xs font-bold text-white">Cuidamos lo más importante:</p>
              <p className="text-xs font-extrabold text-emerald-400">tu salud y la de tu familia.</p>
            </div>

          </div>

        </section>

        {/* BENEFICIOS COMPLEMENTARIOS */}
        <section className="space-y-4">
          <div className="flex items-center space-x-2 pb-1 border-b border-slate-800">
            <Sparkles className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-black tracking-tight text-white uppercase">Beneficios Complementarios</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
            {complementarios.map((item, idx) => {
              const IconComp = item.icon;
              return (
                <div key={idx} className="bg-slate-900/70 border border-slate-800/80 p-4 rounded-2xl flex flex-col justify-between space-y-3 hover:border-emerald-500/40 hover:bg-slate-900 transition-all duration-300 group hover:-translate-y-1 shadow-md">
                  <div className="p-2.5 bg-slate-950 text-emerald-400 rounded-xl border border-slate-800 w-max group-hover:scale-110 group-hover:border-emerald-500/30 transition-transform">
                    <IconComp className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-extrabold text-white group-hover:text-emerald-300 transition-colors">{item.title}</h3>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* TABLA INTERACTIVA DE ESPECIALIDADES */}
        <section className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
            <div className="flex items-center space-x-2.5">
              <Stethoscope className="w-5 h-5 text-emerald-400" />
              <h2 className="text-base font-black tracking-tight text-white uppercase">Especialidades con Tarifa Preferencial</h2>
            </div>

            {/* Buscador de especialidades */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar especialidad..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-all"
              />
            </div>
          </div>

          {/* Grid interactivo de especialidades */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {especialidadesFiltradas.length > 0 ? (
              especialidadesFiltradas.map((esp) => (
                <div 
                  key={esp.id} 
                  className="bg-slate-900/80 border border-slate-800/80 hover:border-emerald-500/40 p-4 rounded-2xl flex items-center justify-between transition-all group"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-[10px] font-bold text-slate-500 w-5">
                      #{esp.id}
                    </span>
                    <h3 className="text-xs font-bold text-slate-200 group-hover:text-white transition-colors">
                      {esp.nombre}
                    </h3>
                  </div>

                  <div className="text-right space-y-0.5">
                    <span className="text-xs font-black text-emerald-400 block">
                      {esp.precio}
                    </span>
                    <span className="inline-block text-[9px] font-extrabold uppercase bg-emerald-950 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-md">
                      {esp.descuento} OFF
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-8 text-slate-500 text-xs">
                No se encontraron especialidades con el término "{busqueda}"
              </div>
            )}
          </div>
        </section>

        {/* FOOTER INFORMACIÓN DE CONTACTO / INSTITUCIONAL */}
        <footer className="bg-gradient-to-r from-slate-900 via-emerald-950/20 to-slate-900 border border-slate-800/90 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-xs text-slate-300">
            
            {/* Nombre e Identificación */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-white font-bold">
                <Building2 className="w-4 h-4 text-emerald-400" />
                <span>Fundación Unidad Médica Adventista</span>
              </div>
              <p className="text-slate-400 text-[11px]">NIT: 901.112.544 - 4</p>
              <div className="flex items-center space-x-2 text-slate-400 text-[11px] pt-1">
                <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Calle 55 No. 20-85 Piso 3, Bucaramanga - Colombia</span>
              </div>
            </div>

            {/* Teléfonos y Canales Directos */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-white font-bold">
                <Phone className="w-4 h-4 text-emerald-400" />
                <span>Líneas de Atención</span>
              </div>
              <p className="text-slate-300 text-[11px]">PBX: 607 700 83 70</p>
              <p className="text-slate-300 text-[11px]">Celular: 315 662 78 29</p>
              <p className="text-slate-300 text-[11px]">Contacto: 304 204 2889</p>
            </div>

            {/* Correo y Web */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-white font-bold">
                <Globe className="w-4 h-4 text-emerald-400" />
                <span>Canales Digitales</span>
              </div>
              <div className="flex items-center space-x-2 text-slate-300 text-[11px]">
                <Mail className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <a href="mailto:fonasin.bucaramanga@fonasin.com" className="hover:text-emerald-400 transition-colors truncate">
                  fonasin.bucaramanga@fonasin.com
                </a>
              </div>
              <p className="text-emerald-400 font-semibold text-[11px]">www.umaips.com</p>
            </div>

          </div>

          {/* Slogan UMA IPS */}
          <div className="pt-4 border-t border-slate-800/80 text-center text-xs font-semibold text-emerald-400 flex items-center justify-center space-x-2">
            <Heart className="w-3.5 h-3.5 fill-emerald-400 text-emerald-400" />
            <span>UMA IPS, medicina para todos, todos los días.</span>
            <Heart className="w-3.5 h-3.5 fill-emerald-400 text-emerald-400" />
          </div>

        </footer>

      </main>
    </div>
  );
}