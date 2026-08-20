import React, { useState, useEffect } from 'react';
import { 
  Calculator, 
  Calendar, 
  DollarSign, 
  Percent, 
  Clock, 
  Plus, 
  Trash2, 
  AlertTriangle, 
  FileText, 
  CheckCircle,
  TrendingUp,
  ShieldCheck,
  Building2,
  Award
} from 'lucide-react';

// === MATRIZ DE LÍNEAS DE CRÉDITO DE FONASIN ===
const LINEAS_FONASIN = {
  FONALIBRE: {
    nombre: 'FONALIBRE (Libre Inversión)',
    montoMaximoSMMLV: 10,
    montoMaximoPesos: null, // Depende de SMMLV
    plazoMaximoStandard: 48,
    plazoMaximoExcepcional: 60, // Para 10 SMMLV
    obtenerTasa: (plazo) => {
      if (plazo <= 18) return { eA: 18.16, nA: 16.80, mE: 1.4 };
      if (plazo <= 24) return { eA: 19.56, nA: 18.00, mE: 1.5 };
      if (plazo <= 36) return { eA: 20.98, nA: 19.20, mE: 1.6 };
      if (plazo <= 48) return { eA: 22.42, nA: 20.40, mE: 1.7 };
      return { eA: 23.87, nA: 21.60, mE: 1.8 }; // 49-60
    },
    tipoAmortizacion: 'FRANCESA'
  },
  FONAROTATIVO: {
    nombre: 'FONAROTATIVO (Cupo Rotativo Corto Plazo)',
    montoMaximoPesos: 1500000,
    plazoMaximoStandard: 12,
    obtenerTasa: () => ({ eA: 19.56, nA: 18.00, mE: 1.5 }),
    tipoAmortizacion: 'FRANCESA'
  },
  FONAPRIMA: {
    nombre: 'FONAPRIMA (Anticipo de Prima)',
    plazoMaximoStandard: 12,
    obtenerTasa: (plazo) => {
      if (plazo <= 6) return { eA: 18.16, nA: 16.80, mE: 1.4 };
      return { eA: 19.56, nA: 18.00, mE: 1.5 }; // 7-12
    },
    tipoAmortizacion: 'PAGO_UNICO_CAPITAL' // Pago mensual de intereses y capital al vencimiento
  },
  FONAPEN: {
    nombre: 'FONAPEN (Pensionados)',
    montoMaximoSMMLV: 10,
    plazoMaximoStandard: 48,
    plazoMaximoExcepcional: 60,
    obtenerTasa: (plazo) => {
      if (plazo <= 18) return { eA: 18.16, nA: 16.80, mE: 1.4 };
      if (plazo <= 24) return { eA: 19.56, nA: 18.00, mE: 1.5 };
      if (plazo <= 36) return { eA: 20.98, nA: 19.20, mE: 1.6 };
      if (plazo <= 48) return { eA: 22.42, nA: 20.40, mE: 1.7 };
      return { eA: 23.87, nA: 21.60, mE: 1.8 };
    },
    tipoAmortizacion: 'FRANCESA'
  },
  FONAPORTES: {
    nombre: 'FONAPORTES (Respaldo en Aportes y Ahorros)',
    plazoMaximoStandard: 60,
    obtenerTasa: (plazo) => {
      if (plazo <= 18) return { eA: 15.39, nA: 14.40, mE: 1.2 };
      if (plazo <= 24) return { eA: 16.77, nA: 15.60, mE: 1.3 };
      if (plazo <= 36) return { eA: 18.16, nA: 16.80, mE: 1.4 };
      if (plazo <= 48) return { eA: 19.56, nA: 18.00, mE: 1.5 };
      return { eA: 20.98, nA: 19.20, mE: 1.6 };
    },
    tipoAmortizacion: 'FRANCESA'
  }
};

export default function SimuladorFonasin() {
  const [currentDateTime, setCurrentDateTime] = useState('');
  const [lineaSeleccionada, setLineaSeleccionada] = useState('FONALIBRE');
  const [monto, setMonto] = useState('5000000');
  const [frecuencia, setFrecuencia] = useState('monthly');
  const [plazo, setPlazo] = useState(24);
  const [tasas, setTasas] = useState({ eA: 0, nA: 0, mE: 0 });
  const [abonosExtras, setAbonosExtras] = useState([]);
  const [resultado, setResultado] = useState(null);
  const [alerta, setAlerta] = useState(null);

  // Fecha y hora en tiempo real
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentDateTime(
        now.toLocaleDateString('es-CO', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          timeZone: 'America/Bogota'
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Actualizar tasas automáticamente cuando cambia la línea o el plazo
  useEffect(() => {
    const configLinea = LINEAS_FONASIN[lineaSeleccionada];
    if (configLinea) {
      const p = parseInt(plazo) || 1;
      const t = configLinea.obtenerTasa(p);
      setTasas(t);
    }
  }, [lineaSeleccionada, plazo]);

  // Formateador de moneda
  const formatCurrency = (val) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  // Manejador de input numérico para monto
  const handleMontoChange = (e) => {
    const rawVal = e.target.value.replace(/\D/g, '');
    setMonto(rawVal);
  };

  // Agregar/Eliminar Abonos Extras
  const addAbonoExtra = () => {
    setAbonosExtras([...abonosExtras, { periodo: 1, monto: '' }]);
  };

  const removeAbonoExtra = (index) => {
    setAbonosExtras(abonosExtras.filter((_, i) => i !== index));
  };

  const updateAbonoExtra = (index, field, value) => {
    const newAbonos = [...abonosExtras];
    newAbonos[index][field] = value;
    setAbonosExtras(newAbonos);
  };

  // Lógica de cálculo
  const calcularSimulacion = () => {
    setAlerta(null);
    const montoNum = parseFloat(monto) || 0;
    const plazoNum = parseInt(plazo) || 0;
    const configLinea = LINEAS_FONASIN[lineaSeleccionada];

    // Validaciones de negocio FONASIN
    if (montoNum <= 0) {
      setAlerta('Ingresa un monto válido para la simulación.');
      return;
    }
    if (plazoNum <= 0) {
      setAlerta('Ingresa un plazo válido.');
      return;
    }

    if (configLinea.montoMaximoPesos && montoNum > configLinea.montoMaximoPesos) {
      setAlerta(`Para la línea ${configLinea.nombre}, el monto máximo es ${formatCurrency(configLinea.montoMaximoPesos)}.`);
      return;
    }

    if (plazoNum > (configLinea.plazoMaximoExcepcional || configLinea.plazoMaximoStandard)) {
      setAlerta(`El plazo máximo permitido para esta línea es de ${configLinea.plazoMaximoExcepcional || configLinea.plazoMaximoStandard} meses.`);
      return;
    }

    const periodosAnuales = frecuencia === 'monthly' ? 12 : 24;
    // Tasa por período
    const tasaPeriodo = (tasas.nA / 100) / periodosAnuales;

    // Procesar abonos extras
    const dictAbonos = {};
    abonosExtras.forEach(item => {
      const p = parseInt(item.periodo);
      const m = parseFloat(item.monto.toString().replace(/\D/g, '')) || 0;
      if (p > 0 && m > 0) dictAbonos[p] = (dictAbonos[p] || 0) + m;
    });

    // Amortización según el tipo
    let saldo = montoNum;
    let cuotaRegular = 0;
    const amortizacion = [];
    let totalInteres = 0;
    let totalCapital = 0;
    let totalAbonosExtra = 0;

    if (configLinea.tipoAmortizacion === 'PAGO_UNICO_CAPITAL') {
      // Caso FONAPRIMA: Interés mensual, capital total al final
      for (let p = 1; p <= plazoNum; p++) {
        const interes = saldo * tasaPeriodo;
        let capital = p === plazoNum ? saldo : 0;
        let abonoExtra = dictAbonos[p] || 0;

        saldo -= (capital + abonoExtra);
        if (saldo < 0) saldo = 0;

        const cuotaTotal = interes + capital;
        totalInteres += interes;
        totalCapital += capital;
        totalAbonosExtra += abonoExtra;

        amortizacion.push({
          periodo: p,
          saldoAnterior: saldo + capital + abonoExtra,
          capital,
          interes,
          cuota: cuotaTotal,
          abonoExtra,
          saldoNuevo: saldo
        });
      }
      cuotaRegular = montoNum * tasaPeriodo; // Interés mensual aproximado
    } else {
      // Método Francés Estándar
      let vP = 0;
      Object.keys(dictAbonos).forEach(pKey => {
        const pInt = parseInt(pKey);
        vP += dictAbonos[pInt] / Math.pow(1 + tasaPeriodo, pInt);
      });

      const montoAjustado = montoNum - vP;
      const factor = Math.pow(1 + tasaPeriodo, plazoNum);
      cuotaRegular = (montoAjustado * (tasaPeriodo * factor)) / (factor - 1);

      for (let p = 1; p <= plazoNum; p++) {
        const interes = saldo * tasaPeriodo;
        let capital = cuotaRegular - interes;
        let abonoExtra = dictAbonos[p] || 0;

        capital += abonoExtra;
        const saldoAnt = saldo;
        saldo -= capital;
        if (saldo < 0) saldo = 0;

        totalInteres += interes;
        totalCapital += (capital - abonoExtra);
        totalAbonosExtra += abonoExtra;

        amortizacion.push({
          periodo: p,
          saldoAnterior: saldoAnt,
          capital: capital - abonoExtra,
          interes,
          cuota: cuotaRegular,
          abonoExtra,
          saldoNuevo: saldo
        });

        if (saldo <= 0) break;
      }
    }

    setResultado({
      montoNum,
      cuotaRegular,
      totalInteres,
      totalCapital: montoNum,
      totalAbonosExtra,
      totalPagado: totalInteres + montoNum,
      amortizacion
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-12">
      <main className="max-w-6xl mx-auto px-4 mt-6">
        {/* Fecha y Hora del Sistema */}
        <div className="bg-white/80 backdrop-blur-md border border-emerald-100 rounded-2xl p-4 shadow-sm mb-6 text-center">
          <div className="flex items-center justify-center text-xs font-bold text-emerald-700 uppercase tracking-wider mb-1">
            <Clock className="w-4 h-4 mr-2" />
            Fecha y Hora de la Simulación
          </div>
          <div className="text-base font-semibold text-slate-700 capitalize">{currentDateTime}</div>
        </div>

        {/* Hero Title */}
        <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-700 rounded-3xl p-8 text-white shadow-xl mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 transform translate-x-8 -translate-y-8 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="relative z-10 text-center md:text-left flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-900/50 text-emerald-200 border border-emerald-500/30 mb-3">
                <Award className="w-3.5 h-3.5 mr-1" /> Tarifas Vigentes 2026
              </span>
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">Simulador Oficial de Créditos</h2>
              <p className="text-emerald-100/90 mt-2 text-sm md:text-base max-w-xl">
                Proyecta tu crédito con las líneas institucionales de FONASIN. Diseñado para ofrecerte transparencia y control total de tus cuotas.
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 text-center min-w-[200px]">
              <span className="text-xs text-emerald-200 uppercase font-medium block">Tasa Mensual Desde</span>
              <span className="text-3xl font-extrabold text-white">1.2% <span className="text-xs font-normal">M.E.</span></span>
            </div>
          </div>
        </div>

        {/* Disclaimer Nota Importante */}
        <div className="bg-amber-50/80 border-l-4 border-amber-500 p-4 rounded-xl mb-8 shadow-sm">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-amber-900">Nota Importante FONASIN</h4>
              <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                Este cálculo es aproximado e informativo. El otorgamiento está sujeto a capacidad de pago, estudio crediticio, disponibilidad de recursos y la presentación del pagaré y póliza de asegurabilidad. Las tasas corresponden a la resolución vigente aprobada por la Junta Directiva.
              </p>
            </div>
          </div>
        </div>

        {/* Mensaje de Alerta si aplica */}
        {alerta && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-2xl mb-6 flex items-center justify-between shadow-sm">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
              <span className="text-sm font-medium">{alerta}</span>
            </div>
            <button onClick={() => setAlerta(null)} className="text-xs font-bold text-rose-600 hover:underline">
              Cerrar
            </button>
          </div>
        )}

        {/* Formulario Principal */}
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-xl border border-slate-100 mb-8">
          <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-slate-100">
            <div className="bg-emerald-100 p-2.5 rounded-xl text-emerald-700">
              <Calculator className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-bold text-slate-800">Parámetros del Préstamo</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Línea de Crédito */}
            <div className="lg:col-span-1">
              <label className="block text-xs font-bold text-slate-600 uppercase mb-2 flex items-center">
                <FileText className="w-4 h-4 mr-1 text-emerald-600" /> Línea de Crédito
              </label>
              <select
                value={lineaSeleccionada}
                onChange={(e) => setLineaSeleccionada(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
              >
                {Object.keys(LINEAS_FONASIN).map((key) => (
                  <option key={key} value={key}>
                    {LINEAS_FONASIN[key].nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* Monto */}
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-2 flex items-center">
                <DollarSign className="w-4 h-4 mr-1 text-emerald-600" /> Monto Solicitado
              </label>
              <input
                type="text"
                value={monto ? parseInt(monto).toLocaleString('es-CO') : ''}
                onChange={handleMontoChange}
                placeholder="Ej: 5.000.000"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
              />
            </div>

            {/* Frecuencia de Pago */}
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-2 flex items-center">
                <Calendar className="w-4 h-4 mr-1 text-emerald-600" /> Frecuencia de Pago
              </label>
              <select
                value={frecuencia}
                onChange={(e) => setFrecuencia(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
              >
                <option value="monthly">Mensual</option>
                <option value="biweekly">Quincenal</option>
              </select>
            </div>

            {/* Plazo */}
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-2 flex items-center">
                <Clock className="w-4 h-4 mr-1 text-emerald-600" /> Plazo ({frecuencia === 'monthly' ? 'Meses' : 'Quincenas'})
              </label>
              <input
                type="number"
                value={plazo}
                onChange={(e) => setPlazo(e.target.value)}
                min="1"
                max={LINEAS_FONASIN[lineaSeleccionada].plazoMaximoExcepcional || LINEAS_FONASIN[lineaSeleccionada].plazoMaximoStandard}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
              />
            </div>

            {/* Tasa Nominal Anual (Auto-calculada) */}
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-2 flex items-center">
                <Percent className="w-4 h-4 mr-1 text-emerald-600" /> Tasa Nominal Anual (N.A.)
              </label>
              <input
                type="text"
                value={`${tasas.nA}%`}
                disabled
                className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-600 cursor-not-allowed"
              />
            </div>

            {/* Tasa Mensual Efectiva (Auto-calculada) */}
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-2 flex items-center">
                <TrendingUp className="w-4 h-4 mr-1 text-emerald-600" /> Tasa Mensual Efectiva (M.E.)
              </label>
              <input
                type="text"
                value={`${tasas.mE}%`}
                disabled
                className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-emerald-700 cursor-not-allowed"
              />
            </div>
          </div>

          {/* Sección Abonos Extraordinarios */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <div className="flex items-center mb-4">
              <h4 className="text-sm font-bold text-slate-700 flex items-center">
                <Plus className="w-4 h-4 mr-1 text-emerald-600" /> Abonos Extraordinarios Programados
              </h4>
              <button
                type="button"
                onClick={addAbonoExtra}
                className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center transition-all"
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Agregar Abono
              </button>
            </div>

            {abonosExtras.length > 0 && (
              <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                {abonosExtras.map((item, idx) => (
                  <div key={idx} className="flex flex-col sm:flex-row items-center gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                    <div className="w-full sm:w-1/3">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Período / Cuota No.</label>
                      <input
                        type="number"
                        min="1"
                        max={plazo}
                        value={item.periodo}
                        onChange={(e) => updateAbonoExtra(idx, 'periodo', e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold"
                      />
                    </div>
                    <div className="w-full sm:w-2/3">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Monto del Abono Extra</label>
                      <input
                        type="text"
                        placeholder="Ej: 500.000"
                        value={item.monto ? parseInt(item.monto.toString().replace(/\D/g, '')).toLocaleString('es-CO') : ''}
                        onChange={(e) => updateAbonoExtra(idx, 'monto', e.target.value.replace(/\D/g, ''))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAbonoExtra(idx)}
                      className="text-rose-500 hover:text-rose-700 p-2 mt-4 sm:mt-0 rounded-lg hover:bg-rose-50 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Botón de Acción Calcular */}
          <div className="mt-8">
            <button
              onClick={calcularSimulacion}
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-emerald-600/20 hover:shadow-emerald-600/30 transition-all duration-200 flex items-center justify-center space-x-2 text-base"
            >
              <Calculator className="w-5 h-5" />
              <span>Calcular Simulación FONASIN</span>
            </button>
          </div>
        </div>

        {/* Resultados */}
        {resultado && (
          <div className="space-y-8 animate-fadeIn">
            {/* Card Resumen KPI */}
            <div className="bg-gradient-to-br from-slate-900 to-emerald-950 text-white rounded-3xl p-6 md:p-8 shadow-2xl border border-emerald-800">
              <h3 className="text-xl font-bold mb-6 flex items-center text-emerald-300">
                <CheckCircle className="w-5 h-5 mr-2" /> Resumen General del Crédito
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10">
                  <span className="text-xs text-emerald-300 uppercase font-bold block mb-1">Monto Solicitado</span>
                  <span className="text-lg md:text-xl font-extrabold">{formatCurrency(resultado.montoNum)}</span>
                </div>
                <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10">
                  <span className="text-xs text-emerald-300 uppercase font-bold block mb-1">Cuota Estimada</span>
                  <span className="text-lg md:text-xl font-extrabold text-emerald-200">{formatCurrency(resultado.cuotaRegular)}</span>
                </div>
                <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10">
                  <span className="text-xs text-emerald-300 uppercase font-bold block mb-1">Total Intereses</span>
                  <span className="text-lg md:text-xl font-extrabold text-amber-300">{formatCurrency(resultado.totalInteres)}</span>
                </div>
                <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10">
                  <span className="text-xs text-emerald-300 uppercase font-bold block mb-1">Total a Pagar</span>
                  <span className="text-lg md:text-xl font-extrabold">{formatCurrency(resultado.totalPagado)}</span>
                </div>
              </div>
            </div>

            {/* Tabla de Amortización */}
            <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-100 overflow-hidden">
              <h4 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-emerald-600" /> Plan de Pagos Detallado
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      <th className="p-3 text-center">No.</th>
                      <th className="p-3 text-right">Saldo Inicial</th>
                      <th className="p-3 text-right">Capital</th>
                      <th className="p-3 text-right">Interés</th>
                      <th className="p-3 text-right">Cuota Base</th>
                      <th className="p-3 text-right">Abono Extra</th>
                      <th className="p-3 text-right">Saldo Final</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                    {resultado.amortizacion.map((row) => (
                      <tr key={row.periodo} className={`hover:bg-slate-50/80 transition-colors ${row.abonoExtra > 0 ? 'bg-emerald-50/50' : ''}`}>
                        <td className="p-3 text-center font-bold text-slate-900">{row.periodo}</td>
                        <td className="p-3 text-right">{formatCurrency(row.saldoAnterior)}</td>
                        <td className="p-3 text-right text-emerald-700">{formatCurrency(row.capital)}</td>
                        <td className="p-3 text-right text-amber-700">{formatCurrency(row.interes)}</td>
                        <td className="p-3 text-right font-bold">{formatCurrency(row.cuota)}</td>
                        <td className="p-3 text-right text-emerald-600 font-bold">
                          {row.abonoExtra > 0 ? formatCurrency(row.abonoExtra) : '-'}
                        </td>
                        <td className="p-3 text-right font-bold text-slate-900">{formatCurrency(row.saldoNuevo)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Banner Call to Action */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-3xl p-8 text-center text-white shadow-xl">
              <ShieldCheck className="w-12 h-12 mx-auto mb-3 text-emerald-200" />
              <h3 className="text-2xl font-extrabold mb-2">¿Te satisface esta simulación?</h3>
              <p className="text-emerald-100 text-sm max-w-lg mx-auto mb-6">
                Radica tu solicitud formal de crédito en la plataforma de FONASIN en pocos minutos.
              </p>
              <button className="bg-white text-emerald-900 font-extrabold px-8 py-3.5 rounded-2xl shadow-lg hover:bg-emerald-50 transition-all duration-200">
                Iniciar Solicitud de Crédito
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
