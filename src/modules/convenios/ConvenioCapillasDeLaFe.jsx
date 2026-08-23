import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Phone, 
  MessageCircle, 
  CheckCircle2, 
  ArrowLeft,
  ShieldCheck,
  Users,
  Dog,
  MapPin,
  Sparkles,
  Clock,
  Globe
} from 'lucide-react';

export default function ConvenioCapillasDeLaFe() {

  const CONTACTO_ASESOR = {
    nombre: 'Gerson Jerez',
    telefono: '3156629603',
    telefonoFormato: '315 662 9603'
  };

  const coberturasClave = [
    {
      icon: ShieldCheck,
      title: "Sin límite de edad",
      description: "Titular, cónyuge, padres y suegros."
    },
    {
      icon: Users,
      title: "Hasta 11 beneficiarios",
      description: "Familiares hasta 3er grado de consanguinidad."
    },
    {
      icon: Dog,
      title: "Incluye 1 mascota",
      description: "Cobertura especial para tu compañero fiel."
    },
    {
      icon: MapPin,
      title: "Cobertura nacional",
      description: "Protección en todo el territorio colombiano."
    }
  ];

  const serviciosPrincipales = [
    {
      title: "FUNERARIOS",
      description: "Servicio completo, traslados, trámites, ceremonia religiosa y cafetería.",
      badge: "Completo",
      badgeColor: "bg-emerald-100/80 text-emerald-900 border-emerald-300"
    },
    {
      title: "CEMENTERIO",
      description: "Lote o bóveda por 4 años, exhumación y osario incluidos.",
      badge: "Inclusivo",
      badgeColor: "bg-emerald-100/80 text-emerald-900 border-emerald-300"
    },
    {
      title: "CREMACIÓN",
      description: "Servicio de cremación y urna con cenizario.",
      badge: "Integral",
      badgeColor: "bg-amber-100/80 text-amber-900 border-amber-300"
    },
    {
      title: "PLAN PRESIDENCIAL",
      description: "Cofre especial, sala de velación de lujo 24 horas y asesoría personalizada.",
      badge: "Exclusivo VIP",
      badgeColor: "bg-indigo-100/80 text-indigo-900 border-indigo-300"
    }
  ];

  const planesAdicionales = [
    {
      title: "PLAN ABUELOS",
      color: "from-purple-100/80 via-purple-50/90 to-emerald-50/40",
      borderColor: "border-purple-300 hover:border-purple-500",
      textColor: "text-purple-950",
      iconColor: "text-purple-700",
      badgeBg: "bg-purple-200/80 text-purple-950 border-purple-400",
      icon: Users,
      items: [
        "Cobertura nacional",
        "Sin límite de edad",
        "Sin restricciones de salud"
      ]
    },
    {
      title: "PLAN MASCOTAS",
      color: "from-amber-100/80 via-amber-50/90 to-emerald-50/40",
      borderColor: "border-amber-300 hover:border-amber-500",
      textColor: "text-amber-950",
      iconColor: "text-amber-700",
      badgeBg: "bg-amber-200/80 text-amber-950 border-amber-400",
      icon: Dog,
      items: [
        "Retiro y servicio funerario",
        "Sala de duelo (3 horas)",
        "Cobertura en principales ciudades"
      ]
    }
  ];

  return (
    /* Fondo con Gradiente Dinámico en Tonos Menta, Marfil y Esmeralda */
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50/50 to-slate-100 text-slate-800 relative overflow-hidden font-sans pb-20 selection:bg-emerald-500 selection:text-white">

      {/* Luces de Fondo Esmeralda y Menta */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-gradient-to-tr from-emerald-300/30 via-teal-200/20 to-transparent blur-[120px] pointer-events-none rounded-full animate-pulse" style={{ animationDuration: '7s' }} />
      <div className="absolute top-1/3 -right-20 w-[600px] h-[600px] bg-emerald-200/30 blur-[150px] pointer-events-none rounded-full" />

      {/* Header Limpio */}
      <header className="sticky top-0 z-50 bg-emerald-950/90 backdrop-blur-md border-b border-emerald-800 shadow-md py-4 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <Link
            to="/convenios"
            className="group relative inline-flex items-center space-x-3 bg-emerald-800 hover:bg-emerald-600 text-white px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300 ease-out shadow-md hover:shadow-emerald-500/20 border border-emerald-600 hover:border-emerald-400 active:scale-95 overflow-hidden"
          >
            <ArrowLeft className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform duration-300 ease-out text-emerald-300 group-hover:text-white" />
            <span className="tracking-wide">Volver a Convenios</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 pt-10 relative z-10 space-y-10">

        {/* HERO BANNER - Esmeralda Rico */}
        <section className="relative rounded-3xl bg-gradient-to-br from-emerald-900 via-teal-900 to-emerald-950 p-6 sm:p-8 md:p-12 shadow-2xl border border-emerald-700/60 overflow-hidden text-white group">
          
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-emerald-400/20 rounded-full blur-3xl pointer-events-none group-hover:bg-emerald-400/30 transition-all duration-700" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center relative z-10">
            
            {/* Titular & Convenio Info */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              
              <div className="space-y-3">
                <div className="inline-flex items-center space-x-2 bg-emerald-950/80 border border-emerald-400/40 backdrop-blur-md rounded-full px-4 py-2 text-xs font-black text-emerald-200 shadow-md">
                  <Sparkles className="w-4 h-4 text-emerald-300 animate-spin" style={{ animationDuration: '8s' }} />
                  <span className="tracking-widest uppercase">Previsión Exequial FONASIN</span>
                </div>

                <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight">
                  La tranquilidad de <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-200 via-teal-100 to-white animate-pulse">proteger</span> a quienes amas
                </h1>

                <p className="text-emerald-100/90 text-sm font-bold tracking-wide uppercase">
                  En convenio con Coorserpark
                </p>

                {/* VALOR MENSUAL DESTACADO */}
                <div className="inline-flex items-center space-x-3 bg-emerald-500/20 border border-emerald-400/50 backdrop-blur-md px-5 py-2.5 rounded-2xl shadow-inner mt-2">
                  <span className="text-xs font-extrabold uppercase text-emerald-300 tracking-wider">Aporte Mensual:</span>
                  <span className="text-xl sm:text-2xl font-black text-white">$12.700 <span className="text-xs font-bold text-emerald-200">COP</span></span>
                </div>
              </div>

              {/* Coberturas Rápidas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                {coberturasClave.map((cob, idx) => (
                  <div key={idx} className="bg-emerald-950/50 hover:bg-emerald-950/80 border border-emerald-500/30 hover:border-emerald-400/60 backdrop-blur-md rounded-2xl p-3.5 flex items-start space-x-3 transition-all duration-300 transform hover:-translate-y-0.5">
                    <div className="bg-emerald-500/20 p-2 rounded-xl text-emerald-300 flex-shrink-0 border border-emerald-400/30 mt-0.5">
                      <cob.icon className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <h4 className="text-white text-xs font-bold leading-tight">{cob.title}</h4>
                      <p className="text-emerald-100/80 text-[11px] leading-snug mt-0.5">{cob.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* CÍRCULO DESTACADO */}
            <div className="lg:col-span-5 flex justify-center w-full">
              <div className="w-full max-w-xs aspect-square rounded-full bg-gradient-to-br from-emerald-100 via-teal-50 to-emerald-200 border-4 border-emerald-300 shadow-[0_15px_35px_rgba(0,0,0,0.2)] hover:shadow-[0_20px_45px_rgba(16,185,129,0.3)] flex flex-col items-center justify-center p-6 text-center space-y-2 transition-all duration-500 transform hover:scale-105 group/circle text-slate-900">
                
                <div className="bg-emerald-800 p-3 rounded-full text-white shadow-md group-hover/circle:rotate-12 transition-transform">
                  <Users className="w-9 h-9" />
                </div>

                <div className="space-y-0.5">
                  <span className="text-xs font-black uppercase tracking-widest text-emerald-800">
                    PROTECCIÓN TOTAL
                  </span>
                  <div className="text-2xl sm:text-3xl font-black text-emerald-950 tracking-tight leading-none">
                    TITULAR
                  </div>
                  <div className="text-lg sm:text-xl font-extrabold text-emerald-800 leading-none">
                    MÁS 11 BENEFICIARIOS
                  </div>
                </div>

                <div className="pt-2">
                  <span className="bg-emerald-800 text-white font-black text-[10px] uppercase px-3 py-1 rounded-full shadow-sm tracking-wider">
                    Incluye 1 Mascota
                  </span>
                </div>

              </div>
            </div>

          </div>
        </section>

        {/* SERVICIOS PRINCIPALES - Tarjetas con Fondo Menta/Verde Mármol Suave */}
        <section className="bg-gradient-to-br from-emerald-100/80 via-teal-50/90 to-emerald-100/60 rounded-3xl p-8 md:p-12 shadow-lg border border-emerald-200/80 space-y-8 relative overflow-hidden backdrop-blur-sm">
          
          <div className="border-b border-emerald-200 pb-4 text-center sm:text-left">
            <span className="text-xs font-black text-emerald-800 uppercase tracking-widest block mb-1">COBERTURA INTEGRAL</span>
            <h2 className="text-2xl md:text-3xl font-black text-emerald-950 tracking-tight">Servicios Principales</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {serviciosPrincipales.map((servicio, index) => (
              <div 
                key={index}
                className="group relative bg-white/90 border border-emerald-200/80 hover:border-emerald-500 p-6 rounded-2xl shadow-sm hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-300 flex flex-col justify-between space-y-4 transform hover:-translate-y-1 overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full border ${servicio.badgeColor}`}>
                      {servicio.badge}
                    </span>
                  </div>

                  <h3 className="text-base font-black text-emerald-950 group-hover:text-emerald-700 transition-colors">
                    {servicio.title}
                  </h3>

                  <p className="text-xs text-slate-700 leading-relaxed font-normal">
                    {servicio.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

        </section>

        {/* PLANES ADICIONALES (Abuelos y Mascotas) - Tonos Pastel Cálidos */}
        <section className="space-y-6">
          <div className="text-center sm:text-left">
            <span className="text-xs font-black text-emerald-800 uppercase tracking-widest block mb-1">COBERTURAS ESPECIALES</span>
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Planes Adicionales</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {planesAdicionales.map((plan, index) => (
              <div
                key={index}
                className={`bg-gradient-to-br ${plan.color} border ${plan.borderColor} p-6 sm:p-8 rounded-3xl shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between space-y-5 transform hover:-translate-y-1`}
              >
                <div className="flex items-center justify-between border-b border-slate-300/60 pb-4">
                  <div className="flex items-center space-x-3">
                    <div className="bg-white p-2.5 rounded-xl shadow-sm border border-slate-200">
                      <plan.icon className={`w-6 h-6 ${plan.iconColor}`} />
                    </div>
                    <h3 className={`text-xl font-black ${plan.textColor} tracking-tight`}>{plan.title}</h3>
                  </div>
                  <span className={`text-[10px] font-bold uppercase px-3 py-1 rounded-full border ${plan.badgeBg}`}>
                    Opcional
                  </span>
                </div>

                <ul className="space-y-2.5">
                  {plan.items.map((item, idx) => (
                    <li key={idx} className="flex items-center space-x-2.5 text-xs font-semibold text-slate-800">
                      <CheckCircle2 className={`w-4 h-4 ${plan.iconColor} flex-shrink-0`} />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* CONTACTO & ATENCIÓN 24/7 - Tarjeta Esmeralda Profundo */}
        <section className="bg-gradient-to-r from-emerald-950 via-teal-900 to-emerald-950 rounded-3xl p-8 md:p-10 text-white shadow-xl border border-emerald-700/50 relative overflow-hidden group">
          
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8 relative z-10">
            
            <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6 text-center sm:text-left">
              
              <div className="bg-emerald-500/20 p-4 rounded-2xl text-emerald-300 border border-emerald-400/30 shadow-lg flex-shrink-0 flex items-center justify-center">
                <Clock className="w-8 h-8 animate-pulse" style={{ animationDuration: '3s' }} />
              </div>

              <div className="space-y-1">
                <div className="inline-flex items-center space-x-2 bg-emerald-900/90 text-emerald-200 text-[11px] font-black px-3.5 py-1 rounded-full uppercase tracking-wider border border-emerald-500/30 mb-1">
                  <span>Atención Exequial 24/7</span>
                </div>
                <h3 className="text-2xl md:text-3xl font-black text-white tracking-tight">{CONTACTO_ASESOR.nombre}</h3>
                <p className="text-xs text-emerald-100/90 max-w-md">
                  Servicio inmediato tras certificado de defunción. Con usted en los momentos difíciles.
                </p>
              </div>

            </div>

            {/* Botones de Acción */}
            <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
              <a
                href={`https://wa.me/57${CONTACTO_ASESOR.telefono}?text=Hola%20Gerson,%20soy%20asociado%20a%20FONASIN%20y%20requiero%20información%20sobre%20el%20convenio%20exequial`}
                target="_blank"
                rel="noreferrer"
                className="relative group/btn bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-black px-7 py-4 rounded-2xl flex items-center justify-center space-x-2.5 transition-all duration-300 shadow-lg hover:shadow-emerald-500/30 text-sm active:scale-95 overflow-hidden"
              >
                <span className="absolute inset-0 w-full h-full bg-white/30 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700 ease-in-out pointer-events-none" />
                <MessageCircle className="w-5 h-5 fill-emerald-950" />
                <span>Escribir al WhatsApp</span>
              </a>

              <a
                href={`tel:${CONTACTO_ASESOR.telefono}`}
                className="bg-emerald-900/90 hover:bg-emerald-800 text-white font-bold px-6 py-4 rounded-2xl flex items-center justify-center space-x-2.5 transition-all duration-300 text-sm border border-emerald-500/40 hover:border-emerald-300 shadow-md active:scale-95"
              >
                <Phone className="w-4 h-4 text-emerald-300" />
                <span>{CONTACTO_ASESOR.telefonoFormato}</span>
              </a>
            </div>

          </div>
        </section>

        {/* Footer */}
        <footer className="text-center text-xs text-slate-600 space-y-3 pt-4 border-t border-emerald-200/80">
          <div className="flex flex-wrap items-center justify-center gap-6 text-slate-700 font-semibold"><span className="flex items-center space-x-1.5">
              <Globe className="w-3.5 h-3.5 text-emerald-700" />
              <span>www.coorserpark.com</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-700" />
              <span>Bogotá - Cobertura Nacional</span>
            </span>
          </div>

          <p className="text-slate-500 text-[11px]">
            FONASIN - Fondo de Empleados del Sector Mineroenergético. Convenio Previsión Exequial.
          </p>
        </footer>

      </main>
    </div>
  );
}