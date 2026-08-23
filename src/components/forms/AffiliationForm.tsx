import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Banknote,
  Briefcase,
  CheckCircle2,
  Download,
  FileText,
  HeartHandshake,
  MapPin,
  Plus,
  ShieldCheck,
  Trash2,
  Upload,
  Users,
} from 'lucide-react';
import {
  acceptAffiliationConsent,
  affiliationDownloadUrl,
  createAffiliationDraft,
  saveAffiliationSection,
  submitAffiliationApplication,
  uploadAffiliationDocument,
  type AffiliationDraft,
  type GeneratedAffiliationDocument,
  type AffiliationSectionKey,
} from '../../services/affiliationService';

type BackendMode = 'loading' | 'ready' | 'local';
type StepKey = 'personal' | 'employment' | 'financial' | 'beneficiaries' | 'sarlaft' | 'final';

type PersonalData = {
  documentType: string;
  documentNumber: string;
  issueDate: string;
  issuePlace: string;
  firstName: string;
  middleName: string;
  lastName: string;
  secondLastName: string;
  birthDate: string;
  nationality: string;
  residenceCountry: string;
  maritalStatus: string;
  residenceAddress: string;
  city: string;
  department: string;
  neighborhood: string;
  mobile: string;
  email: string;
  educationLevel: string;
  profession: string;
  hasDependents: string;
  dependentsCount: string;
};

type EmploymentData = {
  employer: string;
  position: string;
  departmentArea: string;
  contractType: string;
  hireDate: string;
  workCity: string;
  monthlySalary: string;
};

type FinancialData = {
  principalIncome: string;
  otherIncome: string;
  totalIncome: string;
  monthlyExpenses: string;
  financialObligations: string;
  totalExpenses: string;
  assetsValue: string;
  liabilitiesValue: string;
  equityValue: string;
  incomeBand: string;
  voluntarySavings: string;
  voluntarySavingsValue: string;
};

type BeneficiaryData = {
  documentType: string;
  documentNumber: string;
  fullName: string;
  relationship: string;
  birthDate: string;
  phone: string;
  percentage: string;
};

type EmergencyContactData = {
  fullName: string;
  relationship: string;
  phone: string;
};

type SarlaftData = {
  economicActivity: string;
  incomeSource: string[];
  resourceOrigin: string[];
  pep: string;
  pepType: string;
  pepPosition: string;
  pepEntity: string;
  pepLinkDate: string;
  pepUnlinkDate: string;
  relatedPepName: string;
  relatedPepRelation: string;
  foreignAccounts: string;
  foreignAccountCountry: string;
  foreignAccountEntity: string;
  foreignAccountType: string;
  foreignAccountOrigin: string;
  actsOnBehalfOfThirdParties: string;
  thirdPartyName: string;
  thirdPartyId: string;
  thirdPartyRelation: string;
  thirdPartyOrigin: string;
  taxResidenceCountry: string;
  hasForeignTaxObligations: string;
  foreignTaxId: string;
  expectedOperations: string[];
};

type FinalStepData = {
  documentFile: File | null;
  signatureCity: string;
  signatureDate: string;
  signatureMechanism: string;
  declarations: {
    truthful: boolean;
    lawfulFunds: boolean;
    updateInfo: boolean;
    pepDeclaration: boolean;
    dataProcessing: boolean;
    consultations: boolean;
    bylaws: boolean;
  };
};

type SectionState = {
  personal: PersonalData;
  employment: EmploymentData;
  financial: FinancialData;
  beneficiaries: BeneficiaryData[];
  emergencyContact: EmergencyContactData;
  sarlaft: SarlaftData;
  finalStep: FinalStepData;
};

type InputType = 'text' | 'email' | 'date' | 'number' | 'textarea' | 'select';
type FieldConfig = {
  key: string;
  label: string;
  type?: InputType;
  options?: string[];
  helper?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
  maxLength?: number;
};

const POLICY_VERSION = 'afiliacion-v1';
const NAME_MAX_LENGTH = 35;
const TEXT_MAX_LENGTH = 120;
const MIN_MONTHLY_SALARY = 1750905;
const MONEY_MAX_VALUE = 100000000;
const MONEY_MAX_DIGITS = String(MONEY_MAX_VALUE).length;
const MONEY_MAX_DISPLAY_LENGTH = '100.000.000'.length;
const currencyFieldKeys = new Set([
  'monthlySalary',
  'principalIncome',
  'otherIncome',
  'totalIncome',
  'monthlyExpenses',
  'financialObligations',
  'totalExpenses',
  'assetsValue',
  'liabilitiesValue',
  'equityValue',
  'voluntarySavingsValue',
]);
const stepLabels: Array<{ key: StepKey; label: string; title: string; description: string }> = [
  { key: 'personal', label: '1', title: 'Datos personales', description: 'Identificacion, contacto y base del asociado.' },
  { key: 'employment', label: '2', title: 'Informacion laboral', description: 'Empresa, cargo, contrato y ciudad de trabajo.' },
  { key: 'financial', label: '3', title: 'Informacion economica', description: 'Ingresos, egresos, patrimonio y ahorro voluntario.' },
  { key: 'beneficiaries', label: '4', title: 'Beneficiarios', description: 'Hasta 5 beneficiarios y un contacto de emergencia.' },
  { key: 'sarlaft', label: '5', title: 'SARLAFT', description: 'Actividad economica, origen de recursos y condiciones especiales.' },
  { key: 'final', label: '6', title: 'Documentos y cierre', description: 'Declaraciones, autorizaciones, documento y firma.' },
];

const documentTypes = ['CC', 'CE', 'TI', 'Pasaporte', 'Registro civil', 'Otro'];
const maritalStatuses = ['Soltero/a', 'Casado/a', 'Union libre', 'Divorciado/a', 'Viudo/a'];
const educationLevels = ['Primaria', 'Bachillerato', 'Tecnico', 'Tecnologo', 'Profesional', 'Especializacion', 'Maestria', 'Doctorado'];
const contractTypes = ['Indefinido', 'Termino fijo', 'Obra o labor', 'Prestacion de servicios', 'Otro'];
const incomeSources = ['Salario', 'Honorarios', 'Actividad independiente', 'Pension', 'Rentas', 'Inversiones', 'Otro'];
const resourceOrigins = ['Salario', 'Ahorros', 'Actividad comercial', 'Honorarios', 'Pension', 'Inversiones', 'Venta de bienes', 'Otro'];
const pepTypes = ['Nacional', 'Extranjera', 'Organizacion internacional', 'Por vinculo'];
const accountTypes = ['Cuenta de ahorros', 'Cuenta corriente', 'Cuenta de inversion', 'Otra'];
const expectedOperations = ['Aportes', 'Ahorros', 'Credito', 'Otros servicios'];
const signatureMechanisms = ['Firma manuscrita', 'Firma electronica', 'Validacion interna'];
const incomeBands = ['Hasta $2 millones', '$2 a $5 millones', '$5 a $10 millones', 'Mas de $10 millones'];
const relationshipOptions = ['Padre', 'Madre', 'Hijo/a', 'Conyuge', 'Hermano/a', 'Otro'];

const personalFields: FieldConfig[] = [
  { key: 'documentType', label: 'Tipo de documento', type: 'select', options: documentTypes },
  { key: 'documentNumber', label: 'Numero de documento', inputMode: 'numeric' },
  { key: 'issueDate', label: 'Fecha de expedicion', type: 'date' },
  { key: 'issuePlace', label: 'Lugar de expedicion' },
  { key: 'firstName', label: 'Primer nombre', maxLength: NAME_MAX_LENGTH },
  { key: 'middleName', label: 'Segundo nombre', maxLength: NAME_MAX_LENGTH },
  { key: 'lastName', label: 'Primer apellido', maxLength: NAME_MAX_LENGTH },
  { key: 'secondLastName', label: 'Segundo apellido', maxLength: NAME_MAX_LENGTH },
  { key: 'birthDate', label: 'Fecha de nacimiento', type: 'date' },
  { key: 'nationality', label: 'Nacionalidad' },
  { key: 'residenceCountry', label: 'Pais de residencia' },
  { key: 'maritalStatus', label: 'Estado civil', type: 'select', options: maritalStatuses },
  { key: 'residenceAddress', label: 'Direccion de residencia' },
  { key: 'city', label: 'Ciudad / municipio' },
  { key: 'department', label: 'Departamento' },
  { key: 'neighborhood', label: 'Barrio' },
  { key: 'mobile', label: 'Celular' },
  { key: 'email', label: 'Correo electronico', type: 'email' },
  { key: 'educationLevel', label: 'Nivel educativo', type: 'select', options: educationLevels },
  { key: 'profession', label: 'Profesion' },
  { key: 'hasDependents', label: 'Tiene personas a cargo', type: 'select', options: ['No', 'Si'] },
];

const employmentFields: FieldConfig[] = [
  { key: 'employer', label: 'Empresa donde trabaja' },
  { key: 'position', label: 'Cargo' },
  { key: 'departmentArea', label: 'Area / dependencia' },
  { key: 'contractType', label: 'Tipo de contrato', type: 'select', options: contractTypes },
  { key: 'hireDate', label: 'Fecha de ingreso', type: 'date' },
  { key: 'workCity', label: 'Ciudad donde trabaja' },
  { key: 'monthlySalary', label: 'Salario mensual', inputMode: 'numeric' },
];

const financialFields: FieldConfig[] = [
  { key: 'principalIncome', label: 'Ingreso mensual principal', inputMode: 'numeric' },
  { key: 'otherIncome', label: 'Otros ingresos mensuales', inputMode: 'numeric' },
  { key: 'totalIncome', label: 'Total ingresos mensuales', inputMode: 'numeric' },
  { key: 'monthlyExpenses', label: 'Gastos mensuales', inputMode: 'numeric' },
  { key: 'financialObligations', label: 'Obligaciones financieras mensuales', inputMode: 'numeric' },
  { key: 'totalExpenses', label: 'Total egresos mensuales', inputMode: 'numeric' },
  { key: 'assetsValue', label: 'Valor aproximado de activos', inputMode: 'numeric' },
  { key: 'liabilitiesValue', label: 'Valor aproximado de pasivos', inputMode: 'numeric' },
  { key: 'equityValue', label: 'Patrimonio aproximado', inputMode: 'numeric' },
  { key: 'incomeBand', label: 'Rango de ingresos mensuales', type: 'select', options: incomeBands },
  { key: 'voluntarySavings', label: 'Desea abrir un ahorro voluntario', type: 'select', options: ['No', 'Si'] },
];

function createBeneficiary(): BeneficiaryData {
  return {
    documentType: 'CC',
    documentNumber: '',
    fullName: '',
    relationship: '',
    birthDate: '',
    phone: '',
    percentage: '',
  };
}

function createInitialState(): SectionState {
  return {
    personal: {
      documentType: 'CC',
      documentNumber: '',
      issueDate: '',
      issuePlace: '',
      firstName: '',
      middleName: '',
      lastName: '',
      secondLastName: '',
      birthDate: '',
      nationality: 'Colombiana',
      residenceCountry: 'Colombia',
      maritalStatus: '',
      residenceAddress: '',
      city: '',
      department: '',
      neighborhood: '',
      mobile: '',
      email: '',
      educationLevel: '',
      profession: '',
      hasDependents: 'No',
      dependentsCount: '',
    },
    employment: {
      employer: '',
      position: '',
      departmentArea: '',
      contractType: '',
      hireDate: '',
      workCity: '',
      monthlySalary: '',
    },
    financial: {
      principalIncome: '',
      otherIncome: '',
      totalIncome: '',
      monthlyExpenses: '',
      financialObligations: '',
      totalExpenses: '',
      assetsValue: '',
      liabilitiesValue: '',
      equityValue: '',
      incomeBand: '',
      voluntarySavings: 'No',
      voluntarySavingsValue: '',
    },
    beneficiaries: [createBeneficiary()],
    emergencyContact: {
      fullName: '',
      relationship: '',
      phone: '',
    },
    sarlaft: {
      economicActivity: '',
      incomeSource: [],
      resourceOrigin: [],
      pep: 'No',
      pepType: '',
      pepPosition: '',
      pepEntity: '',
      pepLinkDate: '',
      pepUnlinkDate: '',
      relatedPepName: '',
      relatedPepRelation: '',
      foreignAccounts: 'No',
      foreignAccountCountry: '',
      foreignAccountEntity: '',
      foreignAccountType: '',
      foreignAccountOrigin: '',
      actsOnBehalfOfThirdParties: 'Si',
      thirdPartyName: '',
      thirdPartyId: '',
      thirdPartyRelation: '',
      thirdPartyOrigin: '',
      taxResidenceCountry: 'Colombia',
      hasForeignTaxObligations: 'No',
      foreignTaxId: '',
      expectedOperations: [],
    },
    finalStep: {
      documentFile: null,
      signatureCity: '',
      signatureDate: '',
      signatureMechanism: 'Firma manuscrita',
      declarations: {
        truthful: false,
        lawfulFunds: false,
        updateInfo: false,
        pepDeclaration: false,
        dataProcessing: false,
        consultations: false,
        bylaws: false,
      },
    },
  };
}

function validateCurrentStep(step: number, state: SectionState): string | null {
  if (step === 0) {
    const missing = missingFields(state.personal as unknown as Record<string, unknown>, requiredBySection.personal);
    if (missing.length > 0) {
      return `Faltan campos obligatorios: ${friendlyList(missing.map((key) => requiredLabels[key] ?? key))}.`;
    }
    if (!isValidEmail(state.personal.email)) {
      return 'El correo electronico debe tener un formato valido.';
    }
    if (state.personal.firstName.length > NAME_MAX_LENGTH || state.personal.lastName.length > NAME_MAX_LENGTH) {
      return `Los nombres y apellidos principales no deben superar ${NAME_MAX_LENGTH} caracteres.`;
    }
    if (state.personal.hasDependents === 'Si' && isBlank(state.personal.dependentsCount)) {
      return 'Indica cuantas personas tienes a cargo.';
    }
  }

  if (step === 1) {
    const missing = missingFields(state.employment as unknown as Record<string, unknown>, requiredBySection.employment);
    if (missing.length > 0) {
      return `Faltan campos obligatorios: ${friendlyList(missing.map((key) => requiredLabels[key] ?? key))}.`;
    }
    const monthlySalary = Number(state.employment.monthlySalary || '0');
    if (monthlySalary < MIN_MONTHLY_SALARY || monthlySalary > MONEY_MAX_VALUE) {
      return `El salario mensual debe estar entre ${moneyLabel(MIN_MONTHLY_SALARY)} y ${moneyLabel(MONEY_MAX_VALUE)}.`;
    }
  }

  if (step === 2) {
    const missing = missingFields(state.financial as unknown as Record<string, unknown>, requiredBySection.financial);
    if (missing.length > 0) {
      return `Faltan campos obligatorios: ${friendlyList(missing.map((key) => requiredLabels[key] ?? key))}.`;
    }
    if (state.financial.voluntarySavings === 'Si' && isBlank(state.financial.voluntarySavingsValue)) {
      return 'Indica el valor mensual del ahorro voluntario.';
    }
  }

  if (step === 3) {
    const incompleteBeneficiaries = state.beneficiaries.some((beneficiary) =>
      ['documentNumber', 'fullName', 'relationship', 'birthDate', 'phone'].some((key) => isBlank(beneficiary[key as keyof BeneficiaryData])),
    );
    if (incompleteBeneficiaries) {
      return 'Cada beneficiario debe tener documento, nombre, parentesco, fecha de nacimiento y telefono.';
    }
    const emergencyMissing = missingFields(state.emergencyContact as unknown as Record<string, unknown>, ['fullName', 'relationship', 'phone']);
    if (emergencyMissing.length > 0) {
      return `Faltan datos del contacto de emergencia: ${friendlyList(emergencyMissing.map((key) => requiredLabels[key] ?? key))}.`;
    }
  }

  if (step === 4) {
    const missing = missingFields(state.sarlaft as unknown as Record<string, unknown>, requiredBySection.sarlaft);
    if (missing.length > 0) {
      return `Faltan campos obligatorios: ${friendlyList(missing.map((key) => requiredLabels[key] ?? key))}.`;
    }
    if (state.sarlaft.pep === 'Si') {
      const pepMissing = missingFields(state.sarlaft as unknown as Record<string, unknown>, ['pepType', 'pepPosition', 'pepEntity']);
      if (pepMissing.length > 0) {
        return 'Completa el detalle PEP antes de continuar.';
      }
    }
    if (state.sarlaft.foreignAccounts === 'Si') {
      const foreignAccountMissing = missingFields(state.sarlaft as unknown as Record<string, unknown>, [
        'foreignAccountCountry',
        'foreignAccountEntity',
        'foreignAccountType',
        'foreignAccountOrigin',
      ]);
      if (foreignAccountMissing.length > 0) {
        return 'Completa los datos de la cuenta financiera en el exterior.';
      }
    }
  }

  if (step === 5) {
    if (!state.finalStep.documentFile) {
      return 'Debes adjuntar el documento de identidad antes de enviar.';
    }
    if (state.finalStep.documentFile.size > 5 * 1024 * 1024) {
      return 'El documento de identidad no debe superar 5MB.';
    }
    if (isBlank(state.finalStep.signatureCity) || isBlank(state.finalStep.signatureDate)) {
      return 'Completa ciudad y fecha de firma.';
    }
    const unchecked = Object.values(state.finalStep.declarations).some((checked) => !checked);
    if (unchecked) {
      return 'Debes aceptar todas las declaraciones y autorizaciones para enviar la solicitud.';
    }
  }

  return null;
}

function currencyOnly(value: string): string {
  return value.replace(/[^\d]/g, '');
}

function formatCurrency(value: string): string {
  const digits = currencyOnly(value);

  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function moneyLabel(value: number): string {
  return `$${formatCurrency(String(value))}`;
}

function limitedCurrency(value: string): string {
  const digits = currencyOnly(value).slice(0, MONEY_MAX_DIGITS);
  const amount = Number(digits || '0');

  if (amount > MONEY_MAX_VALUE) {
    return String(MONEY_MAX_VALUE);
  }

  return digits;
}

function isBlank(value: unknown): boolean {
  return typeof value !== 'string' || value.trim() === '';
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function friendlyList(items: string[]): string {
  if (items.length <= 1) return items.join('');

  return `${items.slice(0, -1).join(', ')} y ${items[items.length - 1]}`;
}

const requiredLabels: Record<string, string> = {
  documentType: 'tipo de documento',
  documentNumber: 'numero de documento',
  issueDate: 'fecha de expedicion',
  issuePlace: 'lugar de expedicion',
  firstName: 'primer nombre',
  lastName: 'primer apellido',
  birthDate: 'fecha de nacimiento',
  nationality: 'nacionalidad',
  residenceCountry: 'pais de residencia',
  maritalStatus: 'estado civil',
  residenceAddress: 'direccion de residencia',
  city: 'ciudad',
  department: 'departamento',
  mobile: 'celular',
  email: 'correo electronico',
  educationLevel: 'nivel educativo',
  profession: 'profesion',
  hasDependents: 'personas a cargo',
  employer: 'empresa donde trabaja',
  position: 'cargo',
  departmentArea: 'area o dependencia',
  contractType: 'tipo de contrato',
  hireDate: 'fecha de ingreso',
  workCity: 'ciudad donde trabaja',
  monthlySalary: 'salario mensual',
  principalIncome: 'ingreso mensual principal',
  totalIncome: 'total de ingresos',
  monthlyExpenses: 'gastos mensuales',
  totalExpenses: 'total de egresos',
  assetsValue: 'activos',
  liabilitiesValue: 'pasivos',
  equityValue: 'patrimonio',
  incomeBand: 'rango de ingresos',
  voluntarySavings: 'ahorro voluntario',
  voluntarySavingsValue: 'valor mensual del ahorro voluntario',
  economicActivity: 'actividad economica',
  incomeSource: 'fuente de ingresos',
  resourceOrigin: 'origen de recursos',
  expectedOperations: 'operaciones esperadas',
  signatureCity: 'ciudad de firma',
  signatureDate: 'fecha de firma',
};

const requiredBySection: Record<AffiliationSectionKey, string[]> = {
  personal: [
    'documentType',
    'documentNumber',
    'issueDate',
    'issuePlace',
    'firstName',
    'lastName',
    'birthDate',
    'nationality',
    'residenceCountry',
    'maritalStatus',
    'residenceAddress',
    'city',
    'department',
    'mobile',
    'email',
    'educationLevel',
    'profession',
    'hasDependents',
  ],
  employment: ['employer', 'position', 'departmentArea', 'contractType', 'hireDate', 'workCity', 'monthlySalary'],
  financial: [
    'principalIncome',
    'totalIncome',
    'monthlyExpenses',
    'totalExpenses',
    'assetsValue',
    'liabilitiesValue',
    'equityValue',
    'incomeBand',
    'voluntarySavings',
  ],
  beneficiaries: [],
  sarlaft: ['economicActivity', 'incomeSource', 'resourceOrigin', 'expectedOperations'],
};

function fieldMaxLength(field: FieldConfig): number | undefined {
  if (field.maxLength) return field.maxLength;
  if (currencyFieldKeys.has(field.key)) return MONEY_MAX_DISPLAY_LENGTH;
  if (field.inputMode === 'numeric') return MONEY_MAX_DIGITS;
  if (field.type === 'email') return TEXT_MAX_LENGTH;
  if (field.type === 'text' || !field.type) return TEXT_MAX_LENGTH;

  return undefined;
}

function isRequiredField(section: AffiliationSectionKey, key: string): boolean {
  return requiredBySection[section].includes(key);
}

function missingFields(values: Record<string, unknown>, keys: string[]): string[] {
  return keys.filter((key) => {
    const value = values[key];

    return Array.isArray(value) ? value.length === 0 : isBlank(value);
  });
}

function toggleValue(values: string[], value: string): string[] {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}

function Field({
  label,
  helper,
  required,
  children,
}: {
  label: string;
  helper?: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-slate-800">
        {label}
        {required ? <span className="ml-1 text-red-500" aria-label="obligatorio">*</span> : null}
      </span>
      {helper ? <span className="mt-1 block text-xs leading-5 text-slate-500">{helper}</span> : null}
      <div className="mt-2">{children}</div>
    </label>
  );
}

function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 ${props.className ?? ''}`}
    />
  );
}

function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 ${props.className ?? ''}`}
    />
  );
}

function SelectInput(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-slate-900 shadow-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 ${props.className ?? ''}`}
    />
  );
}

function SectionHeader({
  icon,
  eyebrow,
  title,
  description,
}: {
  icon: ReactNode;
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-4">
      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/20">
        {icon}
      </div>
      <div>
        <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-700">{eyebrow}</p>
        <h3 className="mt-1 text-xl font-black text-slate-950">{title}</h3>
        <p className="mt-1.5 max-w-3xl text-sm leading-6 text-slate-600">{description}</p>
      </div>
    </div>
  );
}

function renderFields(
  fields: FieldConfig[],
  values: Record<string, string>,
  setValues: (next: Record<string, string>) => void,
  section?: AffiliationSectionKey,
) {
  return (
    <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
      {fields.map((field) => (
        <Field key={field.key} label={field.label} helper={field.helper} required={section ? isRequiredField(section, field.key) : false}>
          {field.type === 'select' ? (
            <SelectInput
              value={values[field.key] ?? ''}
              onChange={(event) => setValues({ ...values, [field.key]: event.target.value })}
            >
              <option value="">Selecciona una opcion</option>
              {(field.options ?? []).map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </SelectInput>
          ) : field.type === 'textarea' ? (
            <TextArea
              rows={4}
              value={values[field.key] ?? ''}
              onChange={(event) => setValues({ ...values, [field.key]: event.target.value })}
            />
          ) : (
            <TextInput
              type={field.type ?? 'text'}
              inputMode={field.inputMode as any}
              maxLength={fieldMaxLength(field)}
              value={currencyFieldKeys.has(field.key) ? formatCurrency(values[field.key] ?? '') : values[field.key] ?? ''}
              onChange={(event) =>
                setValues({
                  ...values,
                  [field.key]: currencyFieldKeys.has(field.key) ? limitedCurrency(event.target.value) : event.target.value,
                })
              }
            />
          )}
        </Field>
      ))}
    </div>
  );
}

export default function AffiliationForm() {
  const [step, setStep] = useState(0);
  const [backendMode, setBackendMode] = useState<BackendMode>('loading');
  const [backendMessage, setBackendMessage] = useState('Conectando con el borrador de afiliacion...');
  const [draft, setDraft] = useState<AffiliationDraft | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [generatedDocuments, setGeneratedDocuments] = useState<GeneratedAffiliationDocument[]>([]);
  const [state, setState] = useState<SectionState>(createInitialState);

  const progress = useMemo(() => Math.round(((step + 1) / stepLabels.length) * 100), [step]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const response = await createAffiliationDraft();
        if (!active) return;
        setDraft(response);
        setBackendMode('ready');
        setBackendMessage(`Borrador ${response.id} listo para sincronizar secciones.`);
      } catch {
        if (!active) return;
        setBackendMode('local');
        setBackendMessage('Modo local activo. El backend aun no responde en este entorno.');
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  async function syncSection(section: AffiliationSectionKey, data: Record<string, unknown>) {
    if (!draft || backendMode !== 'ready') return;
    await saveAffiliationSection(draft.links.sections[section], {
      schemaVersion: 1,
      data,
      completed: true,
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setSaving(true);

    const validationMessage = validateCurrentStep(step, state);
    if (validationMessage) {
      setError(validationMessage);
      setSaving(false);
      return;
    }

    try {
      if (step === 0) {
        await syncSection('personal', state.personal);
        setMessage('Datos personales guardados.');
      } else if (step === 1) {
        await syncSection('employment', state.employment);
        setMessage('Informacion laboral guardada.');
      } else if (step === 2) {
        await syncSection('financial', state.financial);
        setMessage('Informacion economica guardada.');
      } else if (step === 3) {
        await syncSection('beneficiaries', {
          beneficiaries: state.beneficiaries,
          emergencyContact: state.emergencyContact,
        });
        setMessage('Beneficiarios guardados.');
      } else if (step === 4) {
        await syncSection('sarlaft', state.sarlaft);
        setMessage('Seccion SARLAFT guardada.');
      } else {
        if (!state.finalStep.documentFile) {
          throw new Error('Debes adjuntar el documento de identidad antes de enviar.');
        }

        if (draft && backendMode === 'ready') {
          await uploadAffiliationDocument(draft.links.documents, {
            documentType: 'identity',
            file: state.finalStep.documentFile,
          });

          await acceptAffiliationConsent(draft.links.consents, {
            consentType: 'data_processing',
            policyVersion: POLICY_VERSION,
          });
          await acceptAffiliationConsent(draft.links.consents, {
            consentType: 'bylaws',
            policyVersion: POLICY_VERSION,
          });
          const submittedDraft = await submitAffiliationApplication(draft.links.submit, POLICY_VERSION);
          setDraft(submittedDraft);
          setGeneratedDocuments(submittedDraft.generated_documents ?? []);
        }

        setSubmitted(true);
        setMessage('Solicitud enviada al backend.');
        return;
      }

      setStep((current) => Math.min(current + 1, stepLabels.length - 1));
    } catch (caught) {
      if (backendMode === 'ready') {
        setBackendMessage('Laravel rechazo la sincronizacion. Corrige la seccion y vuelve a intentar.');
      }
      setError(caught instanceof Error ? caught.message : 'No pudimos continuar con esta seccion.');
    } finally {
      setSaving(false);
    }
  }

  function renderPersonalSection() {
    return (
      <div className="space-y-6">
        <SectionHeader
          icon={<Users size={22} />}
          eyebrow="Bloque 1"
          title="Datos personales y de contacto"
          description="Identificacion, ubicacion, contacto y datos basicos de vinculacion."
        />
        {renderFields(personalFields, state.personal, (next) =>
          setState((current) => ({
            ...current,
            personal: {
              ...current.personal,
              ...next,
            },
          })),
        'personal')}
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Numero de personas a cargo" helper="Solo visible si el asociado indica que si tiene personas a cargo." required={state.personal.hasDependents === 'Si'}>
            {state.personal.hasDependents === 'Si' ? (
              <TextInput
                inputMode="numeric"
                value={state.personal.dependentsCount}
                onChange={(event) =>
                  setState((current) => ({
                    ...current,
                    personal: { ...current.personal, dependentsCount: event.target.value },
                  }))
                }
              />
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-500">
                Si marca No, este campo no es obligatorio.
              </div>
            )}
          </Field>
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3.5 text-sm leading-6 text-emerald-900">
            El documento original pide que esta seccion cubra identificacion, contacto, nivel educativo, profesion y
            contexto familiar.
          </div>
        </div>
      </div>
    );
  }

  function renderEmploymentSection() {
    return (
      <div className="space-y-6">
        <SectionHeader
          icon={<Briefcase size={22} />}
          eyebrow="Bloque 2"
          title="Informacion laboral"
          description="Empresa, cargo, area, contrato, ciudad de trabajo e ingreso mensual."
        />
        {renderFields(employmentFields, state.employment, (next) =>
          setState((current) => ({
            ...current,
            employment: {
              ...current.employment,
              ...next,
              monthlySalary: next.monthlySalary ? currencyOnly(next.monthlySalary) : current.employment.monthlySalary,
            },
          })),
        'employment')}
      </div>
    );
  }

  function renderFinancialSection() {
    return (
      <div className="space-y-6">
        <SectionHeader
          icon={<Banknote size={22} />}
          eyebrow="Bloque 3"
          title="Informacion economica y productos del Fondo"
          description="Ingresos, egresos, patrimonio y ahorro voluntario."
        />
        {renderFields(financialFields, state.financial, (next) =>
          setState((current) => ({
            ...current,
            financial: {
              ...current.financial,
              ...next,
              principalIncome: next.principalIncome ? currencyOnly(next.principalIncome) : current.financial.principalIncome,
              otherIncome: next.otherIncome ? currencyOnly(next.otherIncome) : current.financial.otherIncome,
              totalIncome: next.totalIncome ? currencyOnly(next.totalIncome) : current.financial.totalIncome,
              monthlyExpenses: next.monthlyExpenses ? currencyOnly(next.monthlyExpenses) : current.financial.monthlyExpenses,
              financialObligations: next.financialObligations ? currencyOnly(next.financialObligations) : current.financial.financialObligations,
              totalExpenses: next.totalExpenses ? currencyOnly(next.totalExpenses) : current.financial.totalExpenses,
              assetsValue: next.assetsValue ? currencyOnly(next.assetsValue) : current.financial.assetsValue,
              liabilitiesValue: next.liabilitiesValue ? currencyOnly(next.liabilitiesValue) : current.financial.liabilitiesValue,
              equityValue: next.equityValue ? currencyOnly(next.equityValue) : current.financial.equityValue,
            },
          })),
        'financial')}
        {state.financial.voluntarySavings === 'Si' ? (
          <Field label="Valor mensual del ahorro voluntario" required>
            <TextInput
              inputMode="numeric"
              maxLength={MONEY_MAX_DISPLAY_LENGTH}
              value={formatCurrency(state.financial.voluntarySavingsValue)}
              onChange={(event) =>
                setState((current) => ({
                  ...current,
                  financial: {
                    ...current.financial,
                    voluntarySavingsValue: limitedCurrency(event.target.value),
                  },
                }))
              }
            />
          </Field>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-500">
            Si no desea ahorro voluntario, puede continuar.
          </div>
        )}
      </div>
    );
  }

  function renderBeneficiariesSection() {
    return (
      <div className="space-y-6">
        <SectionHeader
          icon={<HeartHandshake size={22} />}
          eyebrow="Bloque 4"
          title="Beneficiarios y contacto de emergencia"
          description="Hasta 5 beneficiarios y una persona de apoyo inmediato."
        />

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-emerald-100 bg-emerald-50 px-4 py-3">
          <p className="text-sm font-semibold text-emerald-950">Puedes agregar hasta 5 beneficiarios.</p>
          <button
            type="button"
            onClick={() =>
              setState((current) => ({
                ...current,
                beneficiaries: current.beneficiaries.length >= 5 ? current.beneficiaries : [...current.beneficiaries, createBeneficiary()],
              }))
            }
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={state.beneficiaries.length >= 5}
          >
            <Plus size={16} /> Agregar otro beneficiario
          </button>
        </div>

        <div className="space-y-4">
          {state.beneficiaries.map((beneficiary, index) => (
            <div key={index} className="rounded-[1.6rem] border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">Beneficiario {index + 1}</p>
                  <h4 className="mt-1 text-lg font-black text-slate-950">Registro del beneficiario</h4>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setState((current) => ({
                      ...current,
                      beneficiaries: current.beneficiaries.length === 1 ? current.beneficiaries : current.beneficiaries.filter((_, itemIndex) => itemIndex !== index),
                    }))
                  }
                  className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-3 py-2 text-xs font-bold text-red-600 transition hover:bg-red-50"
                >
                  <Trash2 size={14} /> Quitar
                </button>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
                {[
                  { key: 'documentType', label: 'Tipo de documento', type: 'select', options: documentTypes },
                  { key: 'documentNumber', label: 'Numero de documento' },
                  { key: 'fullName', label: 'Nombre completo' },
                  { key: 'relationship', label: 'Parentesco', type: 'select', options: relationshipOptions },
                  { key: 'birthDate', label: 'Fecha de nacimiento', type: 'date' },
                  { key: 'phone', label: 'Telefono' },
                ].map((field) => (
                  <Field key={field.key} label={field.label} required>
                    {field.type === 'select' ? (
                      <SelectInput
                        value={beneficiary[field.key as keyof BeneficiaryData]}
                        onChange={(event) =>
                          setState((current) => ({
                            ...current,
                            beneficiaries: current.beneficiaries.map((item, itemIndex) =>
                              itemIndex === index ? { ...item, [field.key]: event.target.value } : item,
                            ),
                          }))
                        }
                      >
                        <option value="">Selecciona una opcion</option>
                        {(field.options ?? []).map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </SelectInput>
                    ) : (
                      <TextInput
                        type={field.type === 'date' ? 'date' : 'text'}
                        inputMode={'inputMode' in field ? (field.inputMode as any) : undefined}
                        maxLength={field.key === 'fullName' ? TEXT_MAX_LENGTH : 'inputMode' in field && field.inputMode === 'numeric' ? 3 : TEXT_MAX_LENGTH}
                        value={beneficiary[field.key as keyof BeneficiaryData] as string}
                        onChange={(event) =>
                          setState((current) => ({
                            ...current,
                            beneficiaries: current.beneficiaries.map((item, itemIndex) =>
                              itemIndex === index ? { ...item, [field.key]: event.target.value } : item,
                            ),
                          }))
                        }
                      />
                    )}
                  </Field>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-[1.6rem] border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-100 text-emerald-700">
              <MapPin size={20} />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">Contacto de emergencia</p>
              <h4 className="text-lg font-black text-slate-950">Persona de apoyo inmediato</h4>
            </div>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {[
              { key: 'fullName', label: 'Nombre completo' },
              { key: 'relationship', label: 'Parentesco' },
              { key: 'phone', label: 'Celular' },
            ].map((field) => (
              <Field key={field.key} label={field.label} required>
                <TextInput
                  maxLength={field.key === 'fullName' ? TEXT_MAX_LENGTH : 80}
                  value={state.emergencyContact[field.key as keyof EmergencyContactData]}
                  onChange={(event) =>
                    setState((current) => ({
                      ...current,
                      emergencyContact: { ...current.emergencyContact, [field.key]: event.target.value },
                    }))
                  }
                />
              </Field>
            ))}
          </div>
        </div>
      </div>
    );
  }

  function renderSarlaftSection() {
    return (
      <div className="space-y-6">
        <SectionHeader
          icon={<ShieldCheck size={22} />}
          eyebrow="Bloque 5"
          title="Conocimiento del asociado - SARLAFT"
          description="Actividad economica, origen de recursos y condiciones especiales."
        />

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Actividad economica principal" required>
            <TextInput
              maxLength={TEXT_MAX_LENGTH}
              value={state.sarlaft.economicActivity}
              onChange={(event) =>
                setState((current) => ({
                  ...current,
                  sarlaft: { ...current.sarlaft, economicActivity: event.target.value },
                }))
              }
            />
          </Field>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-bold text-slate-800">Fuente principal de ingresos <span className="text-red-500">*</span></p>
            <div className="mt-3 grid gap-2">
              {incomeSources.map((option) => (
                <label
                  key={option}
                  className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                    state.sarlaft.incomeSource.includes(option)
                      ? 'border-emerald-300 bg-emerald-50 text-emerald-950'
                      : 'border-slate-200 bg-white text-slate-700'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={state.sarlaft.incomeSource.includes(option)}
                    onChange={() =>
                      setState((current) => ({
                        ...current,
                        sarlaft: { ...current.sarlaft, incomeSource: toggleValue(current.sarlaft.incomeSource, option) },
                      }))
                    }
                  />
                  {option}
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-bold text-slate-800">Origen de los recursos <span className="text-red-500">*</span></p>
            <div className="mt-3 grid gap-2">
              {resourceOrigins.map((option) => (
                <label
                  key={option}
                  className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                    state.sarlaft.resourceOrigin.includes(option)
                      ? 'border-emerald-300 bg-emerald-50 text-emerald-950'
                      : 'border-slate-200 bg-white text-slate-700'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={state.sarlaft.resourceOrigin.includes(option)}
                    onChange={() =>
                      setState((current) => ({
                        ...current,
                        sarlaft: { ...current.sarlaft, resourceOrigin: toggleValue(current.sarlaft.resourceOrigin, option) },
                      }))
                    }
                  />
                  {option}
                </label>
              ))}
            </div>
          </div>

          <Field label="PEP" helper="Si marca Si, se despliegan los campos adicionales.">
            <SelectInput
              value={state.sarlaft.pep}
              onChange={(event) =>
                setState((current) => ({
                  ...current,
                  sarlaft: { ...current.sarlaft, pep: event.target.value },
                }))
              }
            >
              <option value="No">No</option>
              <option value="Si">Si</option>
            </SelectInput>
          </Field>
        </div>

        {state.sarlaft.pep === 'Si' ? (
          <div className="rounded-[1.6rem] border border-amber-200 bg-amber-50 p-4">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-800">Detalle PEP</p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Field label="Tipo de PEP" required>
                <SelectInput
                  value={state.sarlaft.pepType}
                  onChange={(event) =>
                    setState((current) => ({
                      ...current,
                      sarlaft: { ...current.sarlaft, pepType: event.target.value },
                    }))
                  }
                >
                  <option value="">Selecciona una opcion</option>
                  {pepTypes.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </SelectInput>
              </Field>
              <Field label="Cargo o funcion" required>
                <TextInput
                  maxLength={TEXT_MAX_LENGTH}
                  value={state.sarlaft.pepPosition}
                  onChange={(event) =>
                    setState((current) => ({
                      ...current,
                      sarlaft: { ...current.sarlaft, pepPosition: event.target.value },
                    }))
                  }
                />
              </Field>
              <Field label="Entidad" required>
                <TextInput
                  maxLength={TEXT_MAX_LENGTH}
                  value={state.sarlaft.pepEntity}
                  onChange={(event) =>
                    setState((current) => ({
                      ...current,
                      sarlaft: { ...current.sarlaft, pepEntity: event.target.value },
                    }))
                  }
                />
              </Field>
              <Field label="Fecha de vinculacion">
                <TextInput
                  type="date"
                  value={state.sarlaft.pepLinkDate}
                  onChange={(event) =>
                    setState((current) => ({
                      ...current,
                      sarlaft: { ...current.sarlaft, pepLinkDate: event.target.value },
                    }))
                  }
                />
              </Field>
              <Field label="Fecha de desvinculacion">
                <TextInput
                  type="date"
                  value={state.sarlaft.pepUnlinkDate}
                  onChange={(event) =>
                    setState((current) => ({
                      ...current,
                      sarlaft: { ...current.sarlaft, pepUnlinkDate: event.target.value },
                    }))
                  }
                />
              </Field>
              <Field label="PEP relacionada">
                <TextInput
                  value={state.sarlaft.relatedPepName}
                  onChange={(event) =>
                    setState((current) => ({
                      ...current,
                      sarlaft: { ...current.sarlaft, relatedPepName: event.target.value },
                    }))
                  }
                />
              </Field>
              <Field label="Tipo de relacion">
                <TextInput
                  value={state.sarlaft.relatedPepRelation}
                  onChange={(event) =>
                    setState((current) => ({
                      ...current,
                      sarlaft: { ...current.sarlaft, relatedPepRelation: event.target.value },
                    }))
                  }
                />
              </Field>
            </div>
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Posee cuentas financieras en el exterior">
            <SelectInput
              value={state.sarlaft.foreignAccounts}
              onChange={(event) =>
                setState((current) => ({
                  ...current,
                  sarlaft: { ...current.sarlaft, foreignAccounts: event.target.value },
                }))
              }
            >
              <option value="No">No</option>
              <option value="Si">Si</option>
            </SelectInput>
          </Field>
          <Field label="Actua por cuenta propia">
            <SelectInput
              value={state.sarlaft.actsOnBehalfOfThirdParties}
              onChange={(event) =>
                setState((current) => ({
                  ...current,
                  sarlaft: { ...current.sarlaft, actsOnBehalfOfThirdParties: event.target.value },
                }))
              }
            >
              <option value="Si">Si</option>
              <option value="No">No</option>
            </SelectInput>
          </Field>
        </div>

        {state.sarlaft.foreignAccounts === 'Si' ? (
          <div className="rounded-[1.6rem] border border-sky-200 bg-sky-50 p-4">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-sky-800">Cuentas en el exterior</p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Field label="Pais" required>
                <TextInput
                  maxLength={80}
                  value={state.sarlaft.foreignAccountCountry}
                  onChange={(event) =>
                    setState((current) => ({
                      ...current,
                      sarlaft: { ...current.sarlaft, foreignAccountCountry: event.target.value },
                    }))
                  }
                />
              </Field>
              <Field label="Entidad financiera" required>
                <TextInput
                  maxLength={TEXT_MAX_LENGTH}
                  value={state.sarlaft.foreignAccountEntity}
                  onChange={(event) =>
                    setState((current) => ({
                      ...current,
                      sarlaft: { ...current.sarlaft, foreignAccountEntity: event.target.value },
                    }))
                  }
                />
              </Field>
              <Field label="Tipo de cuenta" required>
                <SelectInput
                  value={state.sarlaft.foreignAccountType}
                  onChange={(event) =>
                    setState((current) => ({
                      ...current,
                      sarlaft: { ...current.sarlaft, foreignAccountType: event.target.value },
                    }))
                  }
                >
                  <option value="">Selecciona una opcion</option>
                  {accountTypes.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </SelectInput>
              </Field>
              <Field label="Origen de los recursos" required>
                <TextInput
                  maxLength={TEXT_MAX_LENGTH}
                  value={state.sarlaft.foreignAccountOrigin}
                  onChange={(event) =>
                    setState((current) => ({
                      ...current,
                      sarlaft: { ...current.sarlaft, foreignAccountOrigin: event.target.value },
                    }))
                  }
                />
              </Field>
            </div>
          </div>
        ) : null}

        {state.sarlaft.actsOnBehalfOfThirdParties === 'No' ? (
          <div className="rounded-[1.6rem] border border-violet-200 bg-violet-50 p-4">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-violet-800">Actuacion por terceros</p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Field label="Nombre del tercero" required>
                <TextInput
                  maxLength={TEXT_MAX_LENGTH}
                  value={state.sarlaft.thirdPartyName}
                  onChange={(event) =>
                    setState((current) => ({
                      ...current,
                      sarlaft: { ...current.sarlaft, thirdPartyName: event.target.value },
                    }))
                  }
                />
              </Field>
              <Field label="Identificacion" required>
                <TextInput
                  maxLength={35}
                  value={state.sarlaft.thirdPartyId}
                  onChange={(event) =>
                    setState((current) => ({
                      ...current,
                      sarlaft: { ...current.sarlaft, thirdPartyId: event.target.value },
                    }))
                  }
                />
              </Field>
              <Field label="Relacion con el tercero" required>
                <TextInput
                  maxLength={80}
                  value={state.sarlaft.thirdPartyRelation}
                  onChange={(event) =>
                    setState((current) => ({
                      ...current,
                      sarlaft: { ...current.sarlaft, thirdPartyRelation: event.target.value },
                    }))
                  }
                />
              </Field>
              <Field label="Origen de los recursos" required>
                <TextInput
                  maxLength={TEXT_MAX_LENGTH}
                  value={state.sarlaft.thirdPartyOrigin}
                  onChange={(event) =>
                    setState((current) => ({
                      ...current,
                      sarlaft: { ...current.sarlaft, thirdPartyOrigin: event.target.value },
                    }))
                  }
                />
              </Field>
            </div>
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Pais de residencia fiscal" required>
            <TextInput
              maxLength={80}
              value={state.sarlaft.taxResidenceCountry}
              onChange={(event) =>
                setState((current) => ({
                  ...current,
                  sarlaft: { ...current.sarlaft, taxResidenceCountry: event.target.value },
                }))
              }
            />
          </Field>
          <Field label="Obligaciones tributarias en otro pais">
            <SelectInput
              value={state.sarlaft.hasForeignTaxObligations}
              onChange={(event) =>
                setState((current) => ({
                  ...current,
                  sarlaft: { ...current.sarlaft, hasForeignTaxObligations: event.target.value },
                }))
              }
            >
              <option value="No">No</option>
              <option value="Si">Si</option>
            </SelectInput>
          </Field>
          {state.sarlaft.hasForeignTaxObligations === 'Si' ? (
            <Field label="Identificacion tributaria extranjera" required>
              <TextInput
                maxLength={35}
                value={state.sarlaft.foreignTaxId}
                onChange={(event) =>
                  setState((current) => ({
                    ...current,
                    sarlaft: { ...current.sarlaft, foreignTaxId: event.target.value },
                  }))
                }
              />
            </Field>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-500">
              Si no tiene obligaciones tributarias en otro pais, puede continuar.
            </div>
          )}
        </div>

        <div className="rounded-[1.6rem] border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-bold text-slate-800">Operaciones esperadas con el Fondo <span className="text-red-500">*</span></p>
          <div className="mt-3 flex flex-wrap gap-3">
            {expectedOperations.map((option) => {
              const selected = state.sarlaft.expectedOperations.includes(option);
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() =>
                    setState((current) => ({
                      ...current,
                      sarlaft: {
                        ...current.sarlaft,
                        expectedOperations: toggleValue(current.sarlaft.expectedOperations, option),
                      },
                    }))
                  }
                  className={`rounded-full border px-4 py-2 text-sm font-bold transition ${
                    selected
                      ? 'border-emerald-300 bg-emerald-600 text-white'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-200 hover:text-emerald-700'
                  }`}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  function renderFinalSection() {
    const declarationItems: Array<[keyof FinalStepData['declarations'], string]> = [
      ['truthful', 'Declaro que la informacion suministrada es verdadera, completa y verificable.'],
      ['lawfulFunds', 'Declaro que los recursos utilizados provienen de actividades licitas.'],
      ['updateInfo', 'Me comprometo a actualizar mi informacion cuando sea requerido.'],
      ['pepDeclaration', 'Declaro la informacion relacionada con mi condicion de PEP, si aplica.'],
    ];

    const consentItems: Array<[keyof FinalStepData['declarations'], string]> = [
      ['dataProcessing', 'Autorizo el tratamiento de mis datos personales.'],
      ['consultations', 'Autorizo las consultas y verificaciones necesarias.'],
      ['bylaws', 'Declaro conocer y aceptar estatutos y reglamentos.'],
    ];

    return (
      <div className="space-y-6">
        <SectionHeader
          icon={<FileText size={22} />}
          eyebrow="Bloque 6"
          title="Documentos, declaraciones y autorizaciones"
          description="El documento separa esta parte del formulario principal. Aqui quedan el cierre y la firma."
        />

        <div className="grid gap-4 lg:grid-cols-[1.05fr_.95fr]">
          <div className="space-y-4">
            <div className="rounded-[1.6rem] border border-emerald-100 bg-emerald-50 p-4">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-600 text-white">
                  <Upload size={20} />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">Documento obligatorio</p>
                  <h4 className="text-lg font-black text-slate-950">Documento de identidad</h4>
                </div>
              </div>
              <label className="mt-4 block">
                <span className="text-sm font-bold text-slate-800">Adjuntar documento <span className="text-red-500">*</span></span>
                <div className="mt-2 rounded-2xl border border-dashed border-emerald-300 bg-white px-4 py-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-sm text-slate-600">
                      <p className="font-semibold text-slate-900">
                        {state.finalStep.documentFile ? state.finalStep.documentFile.name : 'Seleccionar PDF, JPG o PNG'}
                      </p>
                      <p className="mt-1 text-xs leading-5 text-slate-500">El backend acepta PDF, JPG y PNG hasta 5MB.</p>
                    </div>
                    <span className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white">
                      <Upload size={16} /> Cargar archivo
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                        className="sr-only"
                        onChange={(event) =>
                          setState((current) => ({
                            ...current,
                            finalStep: { ...current.finalStep, documentFile: event.target.files?.[0] ?? null },
                          }))
                        }
                      />
                    </span>
                  </div>
                </div>
              </label>
            </div>

            <div className="rounded-[1.6rem] border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">Declaraciones del asociado</p>
              <div className="mt-4 space-y-3">
                {declarationItems.map(([key, text]) => (
                  <label key={String(key)} className="flex gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={state.finalStep.declarations[key]}
                      onChange={(event) =>
                        setState((current) => ({
                          ...current,
                          finalStep: {
                            ...current.finalStep,
                            declarations: { ...current.finalStep.declarations, [key]: event.target.checked },
                          },
                        }))
                      }
                    />
                    <span>{text}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-[1.6rem] border border-sky-100 bg-sky-50 p-4">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-sky-700">Autorizaciones obligatorias</p>
              <div className="mt-4 space-y-3">
                {consentItems.map(([key, text]) => (
                  <label key={String(key)} className="flex gap-3 rounded-2xl border border-sky-100 bg-white p-4 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={state.finalStep.declarations[key]}
                      onChange={(event) =>
                        setState((current) => ({
                          ...current,
                          finalStep: {
                            ...current.finalStep,
                            declarations: { ...current.finalStep.declarations, [key]: event.target.checked },
                          },
                        }))
                      }
                    />
                    <span>{text}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="rounded-[1.6rem] border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">Firma / autenticacion</p>
              <div className="mt-4 grid gap-4">
                <Field label="Ciudad" required>
                  <TextInput
                    maxLength={80}
                    value={state.finalStep.signatureCity}
                    onChange={(event) =>
                      setState((current) => ({
                        ...current,
                        finalStep: { ...current.finalStep, signatureCity: event.target.value },
                      }))
                    }
                  />
                </Field>
                <Field label="Fecha" required>
                  <TextInput
                    type="date"
                    value={state.finalStep.signatureDate}
                    onChange={(event) =>
                      setState((current) => ({
                        ...current,
                        finalStep: { ...current.finalStep, signatureDate: event.target.value },
                      }))
                    }
                  />
                </Field>
                <Field label="Mecanismo de autenticacion">
                  <SelectInput
                    value={state.finalStep.signatureMechanism}
                    onChange={(event) =>
                      setState((current) => ({
                        ...current,
                        finalStep: { ...current.finalStep, signatureMechanism: event.target.value },
                      }))
                    }
                  >
                    {signatureMechanisms.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </SelectInput>
                </Field>
              </div>
            </div>

            <div className="rounded-[1.6rem] border border-slate-950 bg-slate-950 p-4 text-white">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-200">Resumen final</p>
              <div className="mt-3 space-y-2 text-sm text-slate-200">
                <p>Se enviara un documento de identidad.</p>
                <p>Se guardaran las declaraciones y autorizaciones requeridas.</p>
                <p>Los endpoints de Laravel ya quedaron referenciados desde la vista.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="rounded-[2rem] border border-emerald-100 bg-white p-8 text-center shadow-[0_24px_70px_rgba(6,74,46,0.12)]">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-emerald-100 text-emerald-700">
          <CheckCircle2 size={34} />
        </div>
        <h2 className="mt-5 text-3xl font-black text-slate-950">Solicitud preparada</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          El formulario quedo listo para revision. Si el entorno esta conectado, las secciones, documentos y
          autorizaciones se sincronizaran en el siguiente paso.
        </p>
        {generatedDocuments.length > 0 ? (
          <div className="mx-auto mt-6 max-w-xl rounded-[1.5rem] border border-emerald-100 bg-emerald-50 p-4 text-left">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">Documentos generados</p>
            <div className="mt-3 grid gap-3">
              {generatedDocuments.map((document) => (
                <a
                  key={document.id}
                  href={affiliationDownloadUrl(document.links.download)}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-emerald-100 bg-white px-4 py-3 text-sm font-bold text-emerald-800 transition hover:bg-emerald-50"
                >
                  <span>{document.original_filename}</span>
                  <Download size={16} />
                </a>
              ))}
            </div>
          </div>
        ) : null}
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => {
              setSubmitted(false);
              setStep(0);
            }}
            className="rounded-xl border border-emerald-200 bg-white px-5 py-3 text-sm font-bold text-emerald-700 transition hover:bg-emerald-50"
          >
            Revisar de nuevo
          </button>
          <button
            type="button"
            onClick={() => {
              setState(createInitialState());
              setGeneratedDocuments([]);
              setStep(0);
              setSubmitted(false);
            }}
            className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-700"
          >
            Reiniciar formulario
          </button>
        </div>
      </div>
    );
  }

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
      <div className="space-y-6">
        <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 px-5 py-5 sm:px-6 sm:py-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-700">
                Solicitud de afiliación
              </p>
              <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                Complete cada paso para registrar la solicitud
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                Los campos están organizados por secciones para facilitar el diligenciamiento y la revisión.
              </p>
            </div>

            <div className="w-full max-w-sm">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                <span>Progreso</span>
                <span>{progress}%</span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-emerald-600 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div
          className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${
            backendMode === 'ready'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : backendMode === 'loading'
                ? 'border-slate-200 bg-slate-50 text-slate-600'
                : 'border-amber-200 bg-amber-50 text-amber-900'
          }`}
          role="status"
        >
          {backendMessage}
        </div>

        <div className="grid gap-5 xl:grid-cols-[.7fr_1.3fr]">
          <aside className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">Secciones</p>
            <ol className="mt-4 space-y-2">
              {stepLabels.map((item, index) => {
                const active = index === step;
                const done = index < step;

                return (
                  <li
                    key={item.key}
                    className={`rounded-2xl border px-4 py-3 transition ${
                      active
                        ? 'border-emerald-300 bg-emerald-50'
                        : done
                          ? 'border-slate-200 bg-white'
                          : 'border-slate-200 bg-white/70'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-black ${
                          active
                            ? 'bg-emerald-600 text-white'
                            : done
                              ? 'bg-slate-900 text-white'
                              : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {item.label}
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-950">{item.title}</p>
                        <p className="mt-0.5 text-xs leading-5 text-slate-500">{item.description}</p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
            <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-600">
              Guarde cada bloque antes de continuar. El cierre incluye documentos, declaraciones y autorizaciones.
            </div>
          </aside>

          <form onSubmit={handleSubmit} className="rounded-[1.5rem] border border-slate-200 bg-white p-6 sm:p-8">
            {step === 0 ? renderPersonalSection() : null}
            {step === 1 ? renderEmploymentSection() : null}
            {step === 2 ? renderFinancialSection() : null}
            {step === 3 ? renderBeneficiariesSection() : null}
            {step === 4 ? renderSarlaftSection() : null}
            {step === 5 ? renderFinalSection() : null}

            <div className="mt-8 border-t border-slate-100 pt-5">
              {error ? (
                <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
              ) : null}
              {message ? (
                <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{message}</div>
              ) : null}

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  onClick={() => setStep((current) => Math.max(current - 1, 0))}
                  disabled={step === 0 || saving}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ArrowLeft size={16} /> Anterior
                </button>

                <div className="text-xs text-slate-500">
                  Paso {step + 1} de {stepLabels.length}
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? 'Guardando...' : step === stepLabels.length - 1 ? 'Enviar solicitud' : 'Guardar y continuar'}
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
