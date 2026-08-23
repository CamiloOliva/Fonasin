import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Building2, 
  ShieldCheck, 
  Phone, 
  MessageCircle, 
  CheckCircle2, 
  Gift, 
  UserCheck, 
  Ambulance, 
  Stethoscope, 
  Sparkles,
  Zap,
  Users,
  Home,
  TrendingUp,
  ArrowLeft,
  Calculator
} from 'lucide-react';

export default function ConvenioEmi() {
  const [numAfiliados, setNumAfiliados] = useState(1);

  const TARIFA_REGULAR = 65000;
  const TARIFA_FONASIN = 28900;
  const CONTACTO_ASESORA = {
    nombre: 'María Ángela Castillo',
    telefono: '3165143196',
    telefonoFormato: '316 514 3196'
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0
    }).format(val);
  };

  // CÁLCULOS DINÁMICOS
  const costoMensualTotal = TARIFA_FONASIN * numAfiliados;
  const ahorroMensual = (TARIFA_REGULAR - TARIFA_FONASIN) * numAfiliados;
  const ahorroAnual = (ahorroMensual * 12) + costoMensualTotal;

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-white via-25% to-red-600 text-slate-800 font-sans pb-24 relative selection:bg-red-600 selection:text-white">

      {/* Header Dinámico - Solo Botón Rediseñado */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/80 shadow-sm transition-all duration-300">
        <div className="max-w-5xl mx-auto px-4 py-3.5 flex justify-between items-center">
          
          <Link
            to="/convenios"
            className="group relative inline-flex items-center space-x-2.5 bg-slate-900 hover:bg-red-600 text-white px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-300 ease-out shadow-md hover:shadow-lg hover:shadow-red-600/30 active:scale-95 border border-slate-800 hover:border-red-500 overflow-hidden"
          >
            {/* Efecto Glow de Fondo */}
            <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none" />

            {/* Ícono con Animación de Flecha */}
            <ArrowLeft className="w-4 h-4 transform group-hover:-translate-x-1.5 transition-transform duration-300 ease-out text-amber-400 group-hover:text-white" />
            
            <span className="tracking-wide">Volver a Convenios</span>
          </Link>

        </div>
      </header>

      {/* Cuerpo Principal */}
      <main className="max-w-5xl mx-auto px-4 pt-8 relative z-10">

        {/* HERO FLYER PRINCIPAL */}
        <section className="relative rounded-3xl bg-gradient-to-br from-red-600 via-red-700 to-red-900 p-6 md:p-12 shadow-2xl shadow-red-950/20 overflow-hidden border border-red-500/30 mb-8">
          
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Mensaje Promocional */}
            <div className="lg:col-span-7 space-y-5 text-center lg:text-left">
              <div className="inline-flex items-center space-x-2 bg-slate-950/60 backdrop-blur-md border border-white/20 rounded-full px-4 py-1.5 text-xs font-black text-amber-300 shadow-sm">
                <Sparkles className="w-4 h-4 text-amber-300 animate-spin" style={{ animationDuration: '6s' }} />
                <span>Convenio Preferencial de Salud</span>
              </div>

              <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight text-white drop-shadow-sm">
                La tranquilidad de tu familia <span className="text-amber-300">comienza en casa.</span>
              </h1>

              <p className="text-red-100 text-sm md:text-base font-medium max-w-xl leading-relaxed">
                Atención médica domiciliaria 24/7 con cobertura integral. Cuidamos a quienes más amas sin filas, sin copagos y de manera prioritaria.
              </p>

              {/* Badges de Beneficios */}
              <div className="grid grid-cols-2 gap-3 pt-2 text-xs font-bold text-slate-900">
                <div className="bg-white/95 backdrop-blur-md rounded-2xl p-3 flex items-center space-x-2.5 shadow-md border border-white/80 transform hover:-translate-y-0.5 transition-transform">
                  <Home className="w-4 h-4 text-red-600 flex-shrink-0" />
                  <span>Médico a domicilio 24/7</span>
                </div>
                <div className="bg-white/95 backdrop-blur-md rounded-2xl p-3 flex items-center space-x-2.5 shadow-md border border-white/80 transform hover:-translate-y-0.5 transition-transform">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Sin cobro de copagos</span>
                </div>
                <div className="bg-white/95 backdrop-blur-md rounded-2xl p-3 flex items-center space-x-2.5 shadow-md border border-white/80 transform hover:-translate-y-0.5 transition-transform">
                  <Zap className="w-4 h-4 text-amber-500 flex-shrink-0" />
                  <span>Cero salas de espera</span>
                </div>
                <div className="bg-white/95 backdrop-blur-md rounded-2xl p-3 flex items-center space-x-2.5 shadow-md border border-white/80 transform hover:-translate-y-0.5 transition-transform">
                  <Ambulance className="w-4 h-4 text-red-600 flex-shrink-0" />
                  <span>Atención de Urgencias</span>
                </div>
              </div>
            </div>

            {/* Badge Interactivo de Precio */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="w-full max-w-xs bg-slate-950 text-white rounded-3xl p-6 border-2 border-amber-400 text-center shadow-2xl relative transform hover:scale-105 transition-all duration-300">
                
                <span className="bg-amber-400 text-slate-950 text-[10px] font-black uppercase px-3.5 py-1 rounded-full tracking-wider inline-block mb-3 shadow-md animate-pulse">
                  Tarifa Especial Asociado
                </span>

                <p className="text-xs font-bold uppercase text-slate-400 tracking-wider">Plan Exclusivo EMI</p>
                
                <div className="text-5xl font-black text-white my-2 tracking-tight">
                  $28.900
                </div>

                <p className="text-xs font-extrabold text-red-400 uppercase tracking-wide">Mensuales por persona</p>

                <div className="mt-5 pt-4 border-t border-slate-800 text-[11px] text-slate-300 font-medium flex items-center justify-center space-x-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Descuento directo por FONASIN</span>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* PROMO MES GRATIS */}
        <section className="bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 rounded-3xl p-6 text-slate-950 shadow-xl mb-8 border border-amber-200 relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 relative z-10">
            <div className="flex items-center space-x-4">
              
              <div className="bg-slate-950 p-4 rounded-2xl text-amber-300 flex-shrink-0 shadow-lg animate-pulse">
                <Gift className="w-9 h-9 transform hover:rotate-12 transition-transform" />
              </div>

              <div>
                <span className="bg-slate-950 text-amber-300 text-[10px] font-black px-2.5 py-0.5 rounded-md uppercase tracking-wider inline-block mb-1 shadow-sm">
                  ¡Beneficio Exclusivo de Bienvenida!
                </span>
                <h3 className="text-xl font-black tracking-tight uppercase leading-tight text-slate-950">
                  Primer mes completamente <span className="underline decoration-slate-950 underline-offset-2">GRATIS</span>
                </h3>
                <p className="text-xs font-bold text-slate-800 mt-0.5">
                  Afíliate este mes, disfruta de los servicios de inmediato y comienza a pagar a partir del siguiente mes.
                </p>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-md border border-slate-900/10 px-5 py-2.5 rounded-2xl text-center flex-shrink-0 shadow-sm">
              <span className="text-[10px] font-black uppercase text-slate-800 block">Cobertura</span>
              <span className="text-base font-black text-slate-950 tracking-wider">INMEDIATA</span>
            </div>
          </div>
        </section>

        {/* BENEFICIOS DESTACADOS DEL SERVICIO */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl p-6 hover:border-red-500 hover:shadow-xl transition-all group">
            <div className="bg-red-50 p-3 rounded-xl w-max text-red-600 mb-3 group-hover:scale-110 transition-transform">
              <Stethoscope className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-slate-900 text-base mb-1">Atención Médica 24/7</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Médicos capacitados para atender emergencias y consultas en la tranquilidad de tu hogar a cualquier hora.
            </p>
          </div>

          <div className="bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl p-6 hover:border-red-500 hover:shadow-xl transition-all group">
            <div className="bg-red-50 p-3 rounded-xl w-max text-red-600 mb-3 group-hover:scale-110 transition-transform">
              <Sparkles className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-slate-900 text-base mb-1">Sin Copagos ni Filas</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Cero cobros extra al momento de la consulta y sin exponerte a largos periodos de espera en centros de salud.
            </p>
          </div>

          <div className="bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl p-6 hover:border-red-500 hover:shadow-xl transition-all group">
            <div className="bg-red-50 p-3 rounded-xl w-max text-red-600 mb-3 group-hover:scale-110 transition-transform">
              <Users className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-slate-900 text-base mb-1">Grupo Familiar Protegido</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Extiende tu tarifa con descuento a tus familiares para que todos disfruten de la protección de Grupo EMI.
            </p>
          </div>
        </section>

        {/* SIMULADOR DE AFILIACIÓN Y AHORRO CON ALINEACIÓN PERFECTA */}
        <section className="bg-white/95 border border-slate-200 rounded-3xl p-6 md:p-8 mb-8 backdrop-blur-md shadow-xl shadow-slate-900/10 relative overflow-hidden">
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pb-4 border-b border-slate-100">
            <div>
              <span className="text-xs font-black text-red-600 uppercase tracking-widest flex items-center gap-1.5 mb-1">
                <Calculator className="w-4 h-4" />
                Simulador Interactivo de Cuota y Beneficio
              </span>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">Calcula el valor de tu protección</h3>
            </div>
            <div className="bg-slate-100 px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-600 font-medium">
              Valor regular por persona: <span className="line-through text-slate-400 font-bold">{formatCurrency(TARIFA_REGULAR)}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
            
            {/* Control Cantidad de Afiliados - Centrado Verticalmente */}
            <div className="lg:col-span-4 bg-slate-50 p-5 rounded-2xl border border-slate-200 flex flex-col justify-center space-y-3">
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-0.5">
                  Número de Afiliados
                </label>
                <p className="text-[11px] text-slate-500 font-medium leading-tight">
                  Titular + grupo familiar directo.
                </p>
              </div>

              <div className="flex items-center space-x-3 pt-1">
                <div className="relative flex-1">
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={numAfiliados}
                    onChange={(e) => setNumAfiliados(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full bg-white border-2 border-slate-300 rounded-2xl px-3 py-2.5 text-2xl font-black text-center text-slate-900 focus:outline-none focus:border-red-600 transition-colors shadow-inner"
                  />
                </div>
                <span className="text-xs font-black text-slate-500 uppercase tracking-wider min-w-[70px]">
                  {numAfiliados === 1 ? 'Persona' : 'Personas'}
                </span>
              </div>
            </div>

            {/* Resultados de la Simulación */}
            <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-3">
              
              {/* Tarifa Total a Pagar */}
              <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 text-center flex flex-col justify-center transform hover:scale-[1.02] transition-transform">
                <span className="text-[10px] font-black text-amber-400 uppercase tracking-wider block mb-1">
                  Tu Valor Mensual
                </span>
                <span className="text-2xl font-black text-white tracking-tight">
                  {formatCurrency(costoMensualTotal)}
                </span>
                <span className="text-[10px] font-medium text-slate-400 mt-1">
                  Cobro por nómina FONASIN
                </span>
              </div>

              {/* Ahorro Mensual */}
              <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-2xl text-center flex flex-col justify-center transform hover:scale-[1.02] transition-transform">
                <span className="text-[10px] font-black text-emerald-800 uppercase tracking-wider block mb-1">
                  Ahorras Cada Mes
                </span>
                <span className="text-2xl font-black text-emerald-600 tracking-tight">
                  {formatCurrency(ahorroMensual)}
                </span>
                <span className="text-[10px] font-semibold text-emerald-700 mt-1">
                  Vs. Precio Público
                </span>
              </div>

              {/* Ahorro Anual (+ Mes Gratis) */}
              <div className="bg-gradient-to-br from-red-600 via-red-700 to-red-900 text-white p-5 rounded-2xl text-center flex flex-col justify-center shadow-lg shadow-red-950/20 transform hover:scale-[1.02] transition-transform border border-red-500/50">
                <span className="text-[10px] font-black text-amber-300 uppercase tracking-wider block mb-1">
                  Ahorro Anual Total
                </span>
                <span className="text-2xl font-black text-amber-300 drop-shadow-sm tracking-tight">
                  {formatCurrency(ahorroAnual)}
                </span>
                <span className="text-[10px] font-extrabold text-red-100 mt-1">
                  ¡Incluye Mes Gratis!
                </span>
              </div>

            </div>
          </div>
        </section>

        {/* CALL TO ACTION CON ASESORA */}
        <section className="bg-slate-950 rounded-3xl p-6 md:p-8 text-white shadow-2xl border border-red-500/30 relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
            
            <div className="flex items-center space-x-4">
              <div className="bg-white p-4 rounded-2xl text-red-600 flex-shrink-0 shadow-lg">
                <UserCheck className="w-8 h-8" />
              </div>
              <div>
                <span className="bg-white/10 text-amber-300 text-[10px] font-black px-2.5 py-0.5 rounded-md uppercase tracking-wider inline-block mb-1 shadow-sm border border-white/10">
                  Atención Directa e Inmediata
                </span>
                <h4 className="text-2xl font-black tracking-tight">{CONTACTO_ASESORA.nombre}</h4>
                <p className="text-xs text-red-100 mt-0.5">Asesora asignada para la vinculación del convenio FONASIN - EMI.</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <a
                href={`https://wa.me/57${CONTACTO_ASESORA.telefono}?text=Hola%20Maria%20Angela,%20soy%20asociado%20a%20FONASIN%20y%20quiero%20afiliarme%20a%20EMI`}
                target="_blank"
                rel="noreferrer"
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-6 py-3.5 rounded-2xl flex items-center justify-center space-x-2 transition-all shadow-xl text-sm transform hover:-translate-y-0.5"
              >
                <MessageCircle className="w-5 h-5 fill-slate-950" />
                <span>Hablar por WhatsApp</span>
              </a>

              <a
                href={`tel:${CONTACTO_ASESORA.telefono}`}
                className="bg-white hover:bg-slate-100 text-slate-950 font-bold px-5 py-3.5 rounded-2xl flex items-center justify-center space-x-2 transition-all text-sm shadow-md"
              >
                <Phone className="w-4 h-4 text-red-600" />
                <span>{CONTACTO_ASESORA.telefonoFormato}</span>
              </a>
            </div>

          </div>
        </section>

        {/* Footer Comercial */}
        <footer className="mt-12 text-center text-[11px] text-white font-bold space-y-1">
          <p>FONASIN - Fondo de Empleados del Sector Mineroenergético</p>
          <p className="text-red-100">Alianza exclusiva con Grupo EMI / Falck Colombia. Todos los derechos reservados.</p>
        </footer>

      </main>
    </div>
  );
}