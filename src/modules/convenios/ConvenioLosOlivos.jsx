import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Building2, 
  ShieldCheck, 
  Phone, 
  MessageCircle, 
  CheckCircle2, 
  UserCheck, 
  Sparkles,
  Users,
  ArrowLeft,
  Calculator,
  HeartHandshake,
  Plane,
  Heart,
  Mail
} from 'lucide-react';

export default function ConvenioLosOlivos() {
  const [numAfiliados, setNumAfiliados] = useState(1);

  // DATOS EXTRAÍDOS DEL FLYER
  const TARIFA_PLAN = 24000;
  const CONTACTO_ASESORA = {
    nombre: 'Sandra Milena González Gómez',
    telefono: '3155041251',
    telefonoFormato: '315 504 1251',
    email: 'sgonzalezbucaramanga@losolivos.co'
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0
    }).format(val);
  };

  // CÁLCULOS DINÁMICOS
  const costoMensualTotal = TARIFA_PLAN * numAfiliados;
  const beneficiariosProtegidos = numAfiliados * 8; // Titular + 7 Beneficiarios
  const costoAnualTotal = costoMensualTotal * 12;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#fefce8] via-[#f7f8f0] to-[#556b2f] text-slate-800 font-sans pb-24 relative selection:bg-[#556b2f] selection:text-white">

      {/* Header Dinámico */}
      <header className="sticky top-0 z-50 bg-[#fefce8]/90 backdrop-blur-md border-b border-[#d4dbbe] shadow-sm transition-all duration-300">
        <div className="max-w-5xl mx-auto px-4 py-3.5 flex justify-between items-center">
          
          <Link
            to="/convenios"
            className="group relative inline-flex items-center space-x-2.5 bg-[#2d381c] hover:bg-[#556b2f] text-white px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-300 ease-out shadow-md hover:shadow-lg hover:shadow-[#556b2f]/30 active:scale-95 border border-[#1e2613] hover:border-[#859f48] overflow-hidden"
          >
            <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none" />

            <ArrowLeft className="w-4 h-4 transform group-hover:-translate-x-1.5 transition-transform duration-300 ease-out text-[#eab308] group-hover:text-white" />
            
            <span className="tracking-wide">Volver a Convenios</span>
          </Link>

        </div>
      </header>

      {/* Cuerpo Principal */}
      <main className="max-w-5xl mx-auto px-4 pt-8 relative z-10">

        {/* HERO FLYER PRINCIPAL - PALETA LOS OLIVOS */}
        <section className="relative rounded-3xl bg-gradient-to-br from-[#556b2f] via-[#3d4d22] to-[#242e14] p-6 md:p-12 shadow-2xl shadow-[#19200e]/30 overflow-hidden border border-[#859f48]/40 mb-8">
          
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 bg-[#fefce8]/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Mensaje Promocional */}
            <div className="lg:col-span-7 space-y-5 text-center lg:text-left">
              <div className="inline-flex items-center space-x-2 bg-[#19200e]/70 backdrop-blur-md border border-[#fefce8]/20 rounded-full px-4 py-1.5 text-xs font-black text-[#facc15] shadow-sm">
                <Sparkles className="w-4 h-4 text-[#facc15] animate-spin" style={{ animationDuration: '6s' }} />
                <span>Convenio de Previsión Exequial</span>
              </div>

              <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight text-white drop-shadow-sm">
                Más beneficios, <span className="text-[#facc15]">más protección.</span>
              </h1>

              <p className="text-[#fefce8]/90 text-sm md:text-base font-medium max-w-xl leading-relaxed">
                Por ser parte de FONASIN, accede al Plan de Previsión Integral de Los Olivos para respaldar a quienes más quieres con tranquilidad y dignidad.
              </p>

              {/* Badges de Beneficios */}
              <div className="grid grid-cols-2 gap-3 pt-2 text-xs font-bold text-[#19200e]">
                <div className="bg-[#fefce8]/95 backdrop-blur-md rounded-2xl p-3 flex items-center space-x-2.5 shadow-md border border-[#fefce8] transform hover:-translate-y-0.5 transition-transform">
                  <Users className="w-4 h-4 text-[#556b2f] flex-shrink-0" />
                  <span>Ti + 7 Beneficiarios</span>
                </div>
                <div className="bg-[#fefce8]/95 backdrop-blur-md rounded-2xl p-3 flex items-center space-x-2.5 shadow-md border border-[#fefce8] transform hover:-translate-y-0.5 transition-transform">
                  <Plane className="w-4 h-4 text-[#556b2f] flex-shrink-0" />
                  <span>Asistencia Repatriación</span>
                </div>
                <div className="bg-[#fefce8]/95 backdrop-blur-md rounded-2xl p-3 flex items-center space-x-2.5 shadow-md border border-[#fefce8] transform hover:-translate-y-0.5 transition-transform">
                  <Heart className="w-4 h-4 text-[#556b2f] flex-shrink-0" />
                  <span>Seguro Soliaccidentes</span>
                </div>
                <div className="bg-[#fefce8]/95 backdrop-blur-md rounded-2xl p-3 flex items-center space-x-2.5 shadow-md border border-[#fefce8] transform hover:-translate-y-0.5 transition-transform">
                  <ShieldCheck className="w-4 h-4 text-[#556b2f] flex-shrink-0" />
                  <span>Plan Milenium Integral</span>
                </div>
              </div>
            </div>

            {/* Badge Interactivo de Precio */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="w-full max-w-xs bg-[#19200e] text-white rounded-3xl p-6 border-2 border-[#facc15] text-center shadow-2xl relative transform hover:scale-105 transition-all duration-300">
                
                <span className="bg-[#facc15] text-[#19200e] text-[10px] font-black uppercase px-3.5 py-1 rounded-full tracking-wider inline-block mb-3 shadow-md animate-pulse">
                  Tarifa Especial Asociado
                </span>

                <p className="text-xs font-bold uppercase text-[#d4dbbe] tracking-wider">Plan Integral Milenium</p>
                
                <div className="text-5xl font-black text-white my-2 tracking-tight">
                  $24.000
                </div>

                <p className="text-xs font-extrabold text-[#facc15] uppercase tracking-wide">Mensuales por grupo familiar</p>

                <div className="mt-5 pt-4 border-t border-[#3d4d22] text-[11px] text-[#fefce8]/80 font-medium flex items-center justify-center space-x-1.5">
                  <Building2 className="w-4 h-4 text-[#859f48]" />
                  <span>Descuento directo por FONASIN</span>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* BENEFICIOS DESTACADOS DEL SERVICE */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-[#fefce8]/90 backdrop-blur-md border border-[#d4dbbe] rounded-2xl p-6 hover:border-[#556b2f] hover:shadow-xl transition-all group">
            <div className="bg-[#f7f8f0] p-3 rounded-xl w-max text-[#556b2f] mb-3 group-hover:scale-110 transition-transform border border-[#d4dbbe]/50">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-slate-900 text-base mb-1">Protección Exequial</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Protege a los que más quieres con un Plan Integral Milenium configurado para ti y hasta 7 beneficiarios de tu familia.
            </p>
          </div>

          <div className="bg-[#fefce8]/90 backdrop-blur-md border border-[#d4dbbe] rounded-2xl p-6 hover:border-[#556b2f] hover:shadow-xl transition-all group">
            <div className="bg-[#f7f8f0] p-3 rounded-xl w-max text-[#556b2f] mb-3 group-hover:scale-110 transition-transform border border-[#d4dbbe]/50">
              <Plane className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-slate-900 text-base mb-1">Asistencia de Repatriación</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Si un ser querido fallece en el exterior, cuentas con respaldo para su traslado y acompañamiento en ese momento.
            </p>
          </div>

          <div className="bg-[#fefce8]/90 backdrop-blur-md border border-[#d4dbbe] rounded-2xl p-6 hover:border-[#556b2f] hover:shadow-xl transition-all group">
            <div className="bg-[#f7f8f0] p-3 rounded-xl w-max text-[#556b2f] mb-3 group-hover:scale-110 transition-transform border border-[#d4dbbe]/50">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-slate-900 text-base mb-1">Seguro de Vida</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Además de la protección exequial, cuentas con un seguro de vida Soliaccidentes para respaldar cualquier eventualidad.
            </p>
          </div>
        </section>

        {/* SIMULADOR DE AFILIACIÓN CON ALINEACIÓN PERFECTA Y VERDE OLIVO */}
        <section className="bg-[#fefce8]/95 border border-[#d4dbbe] rounded-3xl p-6 md:p-8 mb-8 backdrop-blur-md shadow-xl shadow-[#19200e]/10 relative overflow-hidden">
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pb-4 border-b border-[#d4dbbe]">
            <div>
              <span className="text-xs font-black text-[#556b2f] uppercase tracking-widest flex items-center gap-1.5 mb-1">
                <Calculator className="w-4 h-4" />
                Simulador Interactivo de Cobertura
              </span>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">Calcula el alcance de tu protección</h3>
            </div>
            <div className="bg-[#f7f8f0] px-3.5 py-1.5 rounded-xl border border-[#d4dbbe] text-xs text-slate-600 font-medium">
              Valor por plan: <span className="text-[#556b2f] font-bold">{formatCurrency(TARIFA_PLAN)} / mes</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
            
            {/* Control Cantidad de Planes */}
            <div className="lg:col-span-4 bg-[#f7f8f0] p-5 rounded-2xl border border-[#d4dbbe] flex flex-col justify-center space-y-3">
              <div>
                <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-0.5">
                  Número de Planes (Titulares)
                </label>
                <p className="text-[11px] text-slate-600 font-medium leading-tight">
                  Cada plan cubre al titular + 7 beneficiarios.
                </p>
              </div>

              <div className="flex items-center space-x-3 pt-1">
                <div className="relative flex-1">
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={numAfiliados}
                    onChange={(e) => setNumAfiliados(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full bg-white border-2 border-[#d4dbbe] rounded-2xl px-3 py-2.5 text-2xl font-black text-center text-slate-900 focus:outline-none focus:border-[#556b2f] transition-colors shadow-inner"
                  />
                </div>
                <span className="text-xs font-black text-[#556b2f] uppercase tracking-wider min-w-[70px]">
                  {numAfiliados === 1 ? 'Plan' : 'Planes'}
                </span>
              </div>
            </div>

            {/* Resultados de la Simulación */}
            <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-3">
              
              {/* Total Personas Protegidas */}
              <div className="bg-[#f7f8f0] border border-[#d4dbbe] p-5 rounded-2xl text-center flex flex-col justify-center transform hover:scale-[1.02] transition-transform">
                <span className="text-[10px] font-black text-[#556b2f] uppercase tracking-wider block mb-1">
                  Personas Protegidas
                </span>
                <span className="text-3xl font-black text-[#3d4d22] tracking-tight">
                  {beneficiariosProtegidos}
                </span>
                <span className="text-[10px] font-semibold text-slate-500 mt-1">
                  Titular + Beneficiarios
                </span>
              </div>

              {/* Tarifa Total a Pagar Mensual */}
              <div className="bg-[#19200e] text-white p-5 rounded-2xl border border-[#242e14] text-center flex flex-col justify-center transform hover:scale-[1.02] transition-transform">
                <span className="text-[10px] font-black text-[#facc15] uppercase tracking-wider block mb-1">
                  Aporte Mensual Total
                </span>
                <span className="text-2xl font-black text-white tracking-tight">
                  {formatCurrency(costoMensualTotal)}
                </span>
                <span className="text-[10px] font-medium text-[#d4dbbe] mt-1">
                  Descuento nómina FONASIN
                </span>
              </div>

              {/* Inversión Anual Total */}
              <div className="bg-gradient-to-br from-[#556b2f] via-[#3d4d22] to-[#19200e] text-white p-5 rounded-2xl text-center flex flex-col justify-center shadow-lg shadow-[#19200e]/20 transform hover:scale-[1.02] transition-transform border border-[#859f48]/50">
                <span className="text-[10px] font-black text-[#facc15] uppercase tracking-wider block mb-1">
                  Inversión Anual Total
                </span>
                <span className="text-2xl font-black text-[#facc15] drop-shadow-sm tracking-tight">
                  {formatCurrency(costoAnualTotal)}
                </span>
                <span className="text-[10px] font-extrabold text-[#fefce8] mt-1">
                  Tranquilidad todo el año
                </span>
              </div>

            </div>
          </div>
        </section>

        {/* CALL TO ACTION CON ASESORA */}
        <section className="bg-[#19200e] rounded-3xl p-6 md:p-8 text-white shadow-2xl border border-[#859f48]/40 relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
            
            <div className="flex items-center space-x-4">
              <div className="bg-[#fefce8] p-4 rounded-2xl text-[#556b2f] flex-shrink-0 shadow-lg">
                <UserCheck className="w-8 h-8" />
              </div>
              <div>
                <span className="bg-[#fefce8]/10 text-[#facc15] text-[10px] font-black px-2.5 py-0.5 rounded-md uppercase tracking-wider inline-block mb-1 shadow-sm border border-[#fefce8]/10">
                  Atención Directa e Inmediata
                </span>
                <h4 className="text-xl md:text-2xl font-black tracking-tight">{CONTACTO_ASESORA.nombre}</h4>
                <p className="text-xs text-[#d4dbbe] mt-0.5 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-[#facc15]" />
                  {CONTACTO_ASESORA.email}
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <a
                href={`https://wa.me/57${CONTACTO_ASESORA.telefono}?text=Hola%20Sandra,%20soy%20asociado%20a%20FONASIN%20y%20quiero%20afiliarme%20al%20Plan%20de%20Los%20Olivos`}
                target="_blank"
                rel="noreferrer"
                className="bg-[#25d366] hover:bg-[#1ebd59] text-slate-950 font-black px-6 py-3.5 rounded-2xl flex items-center justify-center space-x-2 transition-all shadow-xl text-sm transform hover:-translate-y-0.5"
              >
                <MessageCircle className="w-5 h-5 fill-slate-950" />
                <span>Hablar por WhatsApp</span>
              </a>

              <a
                href={`tel:${CONTACTO_ASESORA.telefono}`}
                className="bg-[#fefce8] hover:bg-white text-[#19200e] font-bold px-5 py-3.5 rounded-2xl flex items-center justify-center space-x-2 transition-all text-sm shadow-md"
              >
                <Phone className="w-4 h-4 text-[#556b2f]" />
                <span>{CONTACTO_ASESORA.telefonoFormato}</span>
              </a>
            </div>

          </div>
        </section>

        {/* Footer Comercial */}
        <footer className="mt-12 text-center text-[11px] text-white font-bold space-y-1">
          <p>FONASIN - Fondo de Empleados del Sector Mineroenergético</p>
          <p className="text-[#fefce8]/80">Alianza exclusiva con Los Olivos - Un homenaje al amor. Todos los derechos reservados.</p>
        </footer>

      </main>
    </div>
  );
}