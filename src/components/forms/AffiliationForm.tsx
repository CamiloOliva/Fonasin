import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Banknote,
  Briefcase,
  CheckCircle2,
  ExternalLink,
  FileText,
  HeartHandshake,
  MapPin,
  Plus,
  ShieldCheck,
  Trash2,
  Upload,
  Users,
} from 'lucide-react';
import StatutesBookViewer from '../sections/StatutesBookViewer';
import {
  acceptAffiliationConsent,
  createAffiliationDraft,
  readAffiliationDraft,
  saveAffiliationSection,
  submitAffiliationApplication,
  uploadAffiliationDocument,
  type AffiliationDraft,
  type GeneratedAffiliationDocument,
  type AffiliationSectionKey,
} from '../../services/affiliationService';
import colombiaDepartmentsCatalog from '../../data/catalogs/colombia_departamentos_municipios.json';
import economicActivitiesCatalog from '../../data/catalogs/actividades_economicas_dian.json';
import nationalitiesCatalog from '../../data/catalogs/nacionalidades.json';
import countriesCatalog from '../../data/catalogs/paises.json';

type BackendMode = 'loading' | 'ready' | 'local';
type StepKey = 'personal' | 'employment' | 'financial' | 'beneficiaries' | 'sarlaft' | 'final' | 'review';
type RequiredDocumentType = 'identity' | 'employment_certificate';

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
  contractTypeOther: string;
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
  relationshipOther: string;
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
  incomeSourceOther: string;
  resourceOrigin: string[];
  resourceOriginOther: string;
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
  foreignAccountTypeOther: string;
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
  expectedOperationsOther: string;
};

type FinalStepData = {
  identityDocumentFile: File | null;
  employmentCertificateFile: File | null;
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

type InputType = 'text' | 'email' | 'date' | 'number' | 'textarea' | 'select' | 'combobox';
type FieldConfig = {
  key: string;
  label: string;
  type?: InputType;
  options?: string[];
  helper?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
  maxLength?: number;
};

type CatalogCity = {
  code: string;
  name: string;
  type: string;
};

type CatalogDepartment = {
  code: string;
  department: string;
  countryCode: string;
  cities: CatalogCity[];
};

type EconomicActivity = {
  code: string;
  name: string;
  type: string;
  sectionCode: string | null;
  section: string | null;
  division: string | null;
  group: string | null;
};

type Nationality = {
  countryCode: string;
  country: string;
  name: string;
};

type Country = {
  iso2: string;
  iso3: string;
  numericCode: string;
  name: string;
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
  { key: 'review', label: '7', title: 'Revision y envio', description: 'Verificacion final de la informacion antes de enviar.' },
];

const documentTypes = ['CC', 'CE', 'Pasaporte', 'TI'];
const colombianNationalityDocumentTypes = new Set(['CC', 'TI']);
const maritalStatuses = ['Soltero/a', 'Casado/a', 'Union libre', 'Divorciado/a', 'Viudo/a'];
const educationLevels = ['Primaria', 'Bachillerato', 'Tecnico', 'Tecnologo', 'Profesional', 'Especializacion', 'Maestria', 'Doctorado'];
const contractTypes = ['Indefinido', 'Termino fijo', 'Obra o labor', 'Prestacion de servicios', 'Otro'];
const incomeSources = ['Salario', 'Honorarios', 'Actividad independiente', 'Pension', 'Rentas', 'Inversiones', 'Otro'];
const resourceOrigins = ['Salario', 'Ahorros', 'Actividad comercial', 'Honorarios', 'Pension', 'Inversiones', 'Venta de bienes', 'Otro'];
const pepTypes = ['Nacional', 'Extranjera', 'Organizacion internacional', 'Por vinculo'];
const accountTypes = ['Cuenta de ahorros', 'Cuenta corriente', 'Cuenta de inversion', 'Otra'];
const expectedOperations = ['Aportes', 'Ahorros', 'Credito', 'Otros servicios'];
const SIGNATURE_MECHANISM = 'Firma electronica simple';

function todayInputDate(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function generatedDocumentTitle(document: GeneratedAffiliationDocument): string {
  if (document.document_type === 'affiliation_summary') return 'Formulario de afiliacion completo';
  if (document.document_type === 'payroll_authorization') return 'Autorizacion de descuento por nomina';

  return document.original_filename;
}
const incomeBands = ['Hasta $2 millones', '$2 a $5 millones', '$5 a $10 millones', 'Mas de $10 millones'];
const relationshipOptions = ['Padre', 'Madre', 'Hijo/a', 'Conyuge', 'Hermano/a', 'Otro'];
const countryOptions = (countriesCatalog as Country[]).map((item) => item.name);
const nationalityOptions = (nationalitiesCatalog as Nationality[]).map((item) => item.name);
const colombiaDepartments = colombiaDepartmentsCatalog as CatalogDepartment[];
const departmentOptions = colombiaDepartments.map((item) => item.department);
const citiesByDepartment = new Map(
  colombiaDepartments.map((item) => [item.department, item.cities.map((city) => city.name)]),
);
const colombiaCityOptions = colombiaDepartments.flatMap((department) =>
  department.cities.map((city) => `${city.name} - ${department.department}`),
);
const economicActivityOptions = (economicActivitiesCatalog as EconomicActivity[]).map((activity) => ({
  value: activity.code,
  label: `${activity.code} - ${activity.name}`,
}));
const economicActivitySearchOptions = economicActivityOptions.map((activity) => activity.label);
const legalDocuments = [
  {
    key: 'data-policy',
    title: 'Politica de tratamiento de datos',
    description: 'Documento que soporta la autorizacion de datos personales.',
    url: '/Politica_Tratamiento_Datos_Personales_FONASIN_2026.pdf',
  },
  {
    key: 'bylaws',
    title: 'Estatutos definitivos 2024',
    description: 'Reglamento base que el solicitante declara conocer y aceptar.',
    url: '/ESTATUTOS%20DEFINITIVOS%202024.pdf',
  },
] as const;
const DRAFT_STORAGE_KEY = 'fonasin.affiliation.draft.v1';
const DRAFT_STORAGE_TTL_MS = 24 * 60 * 60 * 1000;

type StoredAffiliationDraft = {
  savedAt: number;
  draft: AffiliationDraft;
};

function readStoredDraft(): AffiliationDraft | null {
  try {
    const raw = window.localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return null;

    const stored = JSON.parse(raw) as StoredAffiliationDraft;
    if (!stored?.draft?.id || !stored.draft.links?.read || Date.now() - stored.savedAt > DRAFT_STORAGE_TTL_MS) {
      window.localStorage.removeItem(DRAFT_STORAGE_KEY);
      return null;
    }

    return stored.draft;
  } catch {
    return null;
  }
}

function storeDraft(draft: AffiliationDraft): void {
  if (draft.status !== 'draft') return;

  try {
    window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify({
      savedAt: Date.now(),
      draft,
    }));
  } catch {
    // El formulario sigue funcionando aunque el navegador bloquee storage local.
  }
}

function clearStoredDraft(): void {
  try {
    window.localStorage.removeItem(DRAFT_STORAGE_KEY);
  } catch {
    // No hay accion necesaria si el navegador bloquea storage local.
  }
}

function stringValue(data: Record<string, unknown>, key: string, fallback = ''): string {
  const value = data[key];

  return typeof value === 'string' ? value : fallback;
}

function stringArrayValue(data: Record<string, unknown>, key: string): string[] {
  const value = data[key];

  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function beneficiariesValue(value: unknown): BeneficiaryData[] {
  if (!Array.isArray(value)) return [createBeneficiary()];

  const beneficiaries = value
    .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
    .map((item): BeneficiaryData => ({
      documentType: stringValue(item, 'documentType', 'CC'),
      documentNumber: stringValue(item, 'documentNumber'),
      fullName: stringValue(item, 'fullName'),
      relationship: stringValue(item, 'relationship'),
      relationshipOther: stringValue(item, 'relationshipOther'),
      birthDate: stringValue(item, 'birthDate'),
      phone: stringValue(item, 'phone'),
      percentage: stringValue(item, 'percentage'),
    }));

  return beneficiaries.length > 0 ? beneficiaries : [createBeneficiary()];
}

function stateFromDraft(draft: AffiliationDraft): SectionState {
  const next = createInitialState();

  for (const section of draft.sections ?? []) {
    const data = section.data;

    if (section.section === 'personal') {
      next.personal = {
        ...next.personal,
        documentType: stringValue(data, 'documentType', next.personal.documentType),
        documentNumber: stringValue(data, 'documentNumber'),
        issueDate: stringValue(data, 'issueDate'),
        issuePlace: stringValue(data, 'issuePlace'),
        firstName: stringValue(data, 'firstName'),
        middleName: stringValue(data, 'middleName'),
        lastName: stringValue(data, 'lastName'),
        secondLastName: stringValue(data, 'secondLastName'),
        birthDate: stringValue(data, 'birthDate'),
        nationality: stringValue(data, 'nationality', next.personal.nationality),
        residenceCountry: stringValue(data, 'residenceCountry', next.personal.residenceCountry),
        maritalStatus: stringValue(data, 'maritalStatus'),
        residenceAddress: stringValue(data, 'residenceAddress'),
        city: stringValue(data, 'city'),
        department: stringValue(data, 'department'),
        neighborhood: stringValue(data, 'neighborhood'),
        mobile: stringValue(data, 'mobile'),
        email: stringValue(data, 'email'),
        educationLevel: stringValue(data, 'educationLevel'),
        profession: stringValue(data, 'profession'),
        hasDependents: stringValue(data, 'hasDependents', next.personal.hasDependents),
        dependentsCount: stringValue(data, 'dependentsCount'),
      };
    }

    if (section.section === 'employment') {
      next.employment = {
        ...next.employment,
        employer: stringValue(data, 'employer'),
        position: stringValue(data, 'position'),
        departmentArea: stringValue(data, 'departmentArea'),
        contractType: stringValue(data, 'contractType'),
        contractTypeOther: stringValue(data, 'contractTypeOther'),
        hireDate: stringValue(data, 'hireDate'),
        workCity: stringValue(data, 'workCity'),
        monthlySalary: stringValue(data, 'monthlySalary'),
      };
    }

    if (section.section === 'financial') {
      next.financial = {
        ...next.financial,
        principalIncome: stringValue(data, 'principalIncome'),
        otherIncome: stringValue(data, 'otherIncome'),
        totalIncome: stringValue(data, 'totalIncome'),
        monthlyExpenses: stringValue(data, 'monthlyExpenses'),
        financialObligations: stringValue(data, 'financialObligations'),
        totalExpenses: stringValue(data, 'totalExpenses'),
        assetsValue: stringValue(data, 'assetsValue'),
        liabilitiesValue: stringValue(data, 'liabilitiesValue'),
        equityValue: stringValue(data, 'equityValue'),
        incomeBand: stringValue(data, 'incomeBand'),
        voluntarySavings: stringValue(data, 'voluntarySavings', next.financial.voluntarySavings),
        voluntarySavingsValue: stringValue(data, 'voluntarySavingsValue'),
      };
    }

    if (section.section === 'beneficiaries') {
      next.beneficiaries = beneficiariesValue(data.beneficiaries);
      const emergencyContact = typeof data.emergencyContact === 'object' && data.emergencyContact !== null
        ? data.emergencyContact as Record<string, unknown>
        : {};
      next.emergencyContact = {
        fullName: stringValue(emergencyContact, 'fullName'),
        relationship: stringValue(emergencyContact, 'relationship'),
        phone: stringValue(emergencyContact, 'phone'),
      };
    }

    if (section.section === 'sarlaft') {
      next.sarlaft = {
        ...next.sarlaft,
        economicActivity: stringValue(data, 'economicActivity'),
        incomeSource: stringArrayValue(data, 'incomeSource'),
        incomeSourceOther: stringValue(data, 'incomeSourceOther'),
        resourceOrigin: stringArrayValue(data, 'resourceOrigin'),
        resourceOriginOther: stringValue(data, 'resourceOriginOther'),
        pep: stringValue(data, 'pep', next.sarlaft.pep),
        pepType: stringValue(data, 'pepType'),
        pepPosition: stringValue(data, 'pepPosition'),
        pepEntity: stringValue(data, 'pepEntity'),
        pepLinkDate: stringValue(data, 'pepLinkDate'),
        pepUnlinkDate: stringValue(data, 'pepUnlinkDate'),
        relatedPepName: stringValue(data, 'relatedPepName'),
        relatedPepRelation: stringValue(data, 'relatedPepRelation'),
        foreignAccounts: stringValue(data, 'foreignAccounts', next.sarlaft.foreignAccounts),
        foreignAccountCountry: stringValue(data, 'foreignAccountCountry'),
        foreignAccountEntity: stringValue(data, 'foreignAccountEntity'),
        foreignAccountType: stringValue(data, 'foreignAccountType'),
        foreignAccountTypeOther: stringValue(data, 'foreignAccountTypeOther'),
        foreignAccountOrigin: stringValue(data, 'foreignAccountOrigin'),
        actsOnBehalfOfThirdParties: stringValue(data, 'actsOnBehalfOfThirdParties', next.sarlaft.actsOnBehalfOfThirdParties),
        thirdPartyName: stringValue(data, 'thirdPartyName'),
        thirdPartyId: stringValue(data, 'thirdPartyId'),
        thirdPartyRelation: stringValue(data, 'thirdPartyRelation'),
        thirdPartyOrigin: stringValue(data, 'thirdPartyOrigin'),
        taxResidenceCountry: stringValue(data, 'taxResidenceCountry', next.sarlaft.taxResidenceCountry),
        hasForeignTaxObligations: stringValue(data, 'hasForeignTaxObligations', next.sarlaft.hasForeignTaxObligations),
        foreignTaxId: stringValue(data, 'foreignTaxId'),
        expectedOperations: stringArrayValue(data, 'expectedOperations'),
        expectedOperationsOther: stringValue(data, 'expectedOperationsOther'),
      };
    }
  }

  return next;
}

const personalFields: FieldConfig[] = [
  { key: 'documentType', label: 'Tipo de documento', type: 'select', options: documentTypes },
  { key: 'documentNumber', label: 'Numero de documento' },
  { key: 'issueDate', label: 'Fecha de expedicion', type: 'date' },
  { key: 'issuePlace', label: 'Lugar de expedicion' },
  { key: 'firstName', label: 'Primer nombre', maxLength: NAME_MAX_LENGTH },
  { key: 'middleName', label: 'Segundo nombre', maxLength: NAME_MAX_LENGTH },
  { key: 'lastName', label: 'Primer apellido', maxLength: NAME_MAX_LENGTH },
  { key: 'secondLastName', label: 'Segundo apellido', maxLength: NAME_MAX_LENGTH },
  { key: 'birthDate', label: 'Fecha de nacimiento', type: 'date' },
  { key: 'nationality', label: 'Nacionalidad', type: 'select' },
  { key: 'residenceCountry', label: 'Pais de residencia', type: 'select' },
  { key: 'maritalStatus', label: 'Estado civil', type: 'select', options: maritalStatuses },
  { key: 'residenceAddress', label: 'Direccion de residencia' },
  { key: 'department', label: 'Departamento', type: 'select' },
  { key: 'city', label: 'Ciudad / municipio', type: 'select' },
  { key: 'neighborhood', label: 'Barrio' },
  { key: 'mobile', label: 'Celular', inputMode: 'numeric', helper: 'Ejemplo: 3001234567' },
  { key: 'email', label: 'Correo electronico', type: 'email', helper: 'Ejemplo: nombre@dominio.com' },
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
  { key: 'workCity', label: 'Ciudad donde trabaja', type: 'combobox', helper: 'Escribe para buscar municipio y departamento.' },
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
    relationshipOther: '',
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
      contractTypeOther: '',
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
      incomeSourceOther: '',
      resourceOrigin: [],
      resourceOriginOther: '',
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
      foreignAccountTypeOther: '',
      foreignAccountOrigin: '',
      actsOnBehalfOfThirdParties: 'No',
      thirdPartyName: '',
      thirdPartyId: '',
      thirdPartyRelation: '',
      thirdPartyOrigin: '',
      taxResidenceCountry: 'Colombia',
      hasForeignTaxObligations: 'No',
      foreignTaxId: '',
      expectedOperations: [],
      expectedOperationsOther: '',
    },
    finalStep: {
      identityDocumentFile: null,
      employmentCertificateFile: null,
      signatureCity: '',
      signatureDate: todayInputDate(),
      signatureMechanism: SIGNATURE_MECHANISM,
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

function validateCurrentStep(step: number, state: SectionState, uploadedDocumentTypes = new Set<RequiredDocumentType>()): string | null {
  if (step === 0) {
    const missing = missingFields(state.personal as unknown as Record<string, unknown>, requiredBySection.personal);
    if (missing.length > 0) {
      return `Faltan campos obligatorios: ${friendlyList(missing.map((key) => requiredLabels[key] ?? key))}.`;
    }
    if (!isValidEmail(state.personal.email)) {
      return 'El correo electronico debe tener un formato valido.';
    }
    if (!/^3\d{9}$/.test(state.personal.mobile)) {
      return 'El celular debe tener 10 digitos e iniciar por 3.';
    }
    if (state.personal.firstName.length > NAME_MAX_LENGTH || state.personal.lastName.length > NAME_MAX_LENGTH) {
      return `Los nombres y apellidos principales no deben superar ${NAME_MAX_LENGTH} caracteres.`;
    }
    if (state.personal.hasDependents === 'Si' && isBlank(state.personal.dependentsCount)) {
      return 'Indica cuantas personas tienes a cargo.';
    }
    if (state.personal.hasDependents === 'Si' && !/^[1-9]\d{0,2}$/.test(state.personal.dependentsCount)) {
      return 'El numero de personas a cargo debe estar entre 1 y 999.';
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
    if (!isValidCatalogOption(state.employment.workCity, colombiaCityOptions)) {
      return 'Selecciona la ciudad donde trabaja desde el catalogo.';
    }
    if (state.employment.contractType === 'Otro' && !isValidOtherDetail(state.employment.contractTypeOther)) {
      return otherDetailMessage('el tipo de contrato');
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
    const beneficiaryWithoutOtherDetail = state.beneficiaries.some(
      (beneficiary) => beneficiary.relationship === 'Otro' && !isValidOtherDetail(beneficiary.relationshipOther),
    );
    if (beneficiaryWithoutOtherDetail) {
      return otherDetailMessage('el parentesco del beneficiario');
    }
    const invalidBeneficiaryPhone = state.beneficiaries.some((beneficiary) => !/^\d{7,10}$/.test(beneficiary.phone));
    if (invalidBeneficiaryPhone) {
      return 'El telefono de cada beneficiario debe tener entre 7 y 10 digitos.';
    }
    const emergencyMissing = missingFields(state.emergencyContact as unknown as Record<string, unknown>, ['fullName', 'relationship', 'phone']);
    if (emergencyMissing.length > 0) {
      return `Faltan datos del contacto de emergencia: ${friendlyList(emergencyMissing.map((key) => requiredLabels[key] ?? key))}.`;
    }
    if (!/^3\d{9}$/.test(state.emergencyContact.phone)) {
      return 'El celular de la persona de apoyo inmediato debe tener 10 digitos e iniciar por 3.';
    }
  }

  if (step === 4) {
    const missing = missingFields(state.sarlaft as unknown as Record<string, unknown>, requiredBySection.sarlaft);
    if (missing.length > 0) {
      return `Faltan campos obligatorios: ${friendlyList(missing.map((key) => requiredLabels[key] ?? key))}.`;
    }
    if (!isValidEconomicActivity(state.sarlaft.economicActivity)) {
      return 'Selecciona una actividad economica del catalogo DIAN.';
    }
    if (state.sarlaft.incomeSource.includes('Otro') && !isValidOtherDetail(state.sarlaft.incomeSourceOther)) {
      return otherDetailMessage('la fuente de ingresos');
    }
    if (state.sarlaft.resourceOrigin.includes('Otro') && !isValidOtherDetail(state.sarlaft.resourceOriginOther)) {
      return otherDetailMessage('el origen de recursos');
    }
    if (state.sarlaft.expectedOperations.includes('Otros servicios') && !isValidOtherDetail(state.sarlaft.expectedOperationsOther)) {
      return otherDetailMessage('las operaciones esperadas');
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
      if (state.sarlaft.foreignAccountType === 'Otra' && !isValidOtherDetail(state.sarlaft.foreignAccountTypeOther)) {
        return otherDetailMessage('el tipo de cuenta');
      }
    }
    if (state.sarlaft.actsOnBehalfOfThirdParties === 'Si') {
      const thirdPartyMissing = missingFields(state.sarlaft as unknown as Record<string, unknown>, [
        'thirdPartyName',
        'thirdPartyId',
        'thirdPartyRelation',
        'thirdPartyOrigin',
      ]);
      if (thirdPartyMissing.length > 0) {
        return 'Completa los datos del tercero por cuenta de quien actuas.';
      }
    }
  }

  if (step === 5) {
    const hasIdentityDocument = Boolean(state.finalStep.identityDocumentFile) || uploadedDocumentTypes.has('identity');
    const hasEmploymentCertificate = Boolean(state.finalStep.employmentCertificateFile) || uploadedDocumentTypes.has('employment_certificate');

    if (!hasIdentityDocument) {
      return 'Debes adjuntar el documento de identidad por ambos lados en PDF.';
    }
    if (!hasEmploymentCertificate) {
      return 'Debes adjuntar el certificado laboral en PDF.';
    }
    if (state.finalStep.identityDocumentFile && state.finalStep.identityDocumentFile.type !== 'application/pdf') {
      return 'El documento de identidad debe estar en formato PDF.';
    }
    if (state.finalStep.employmentCertificateFile && state.finalStep.employmentCertificateFile.type !== 'application/pdf') {
      return 'El certificado laboral debe estar en formato PDF.';
    }
    if (state.finalStep.identityDocumentFile && state.finalStep.identityDocumentFile.size > 5 * 1024 * 1024) {
      return 'El documento de identidad no debe superar 5MB.';
    }
    if (state.finalStep.employmentCertificateFile && state.finalStep.employmentCertificateFile.size > 5 * 1024 * 1024) {
      return 'El certificado laboral no debe superar 5MB.';
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
  contractTypeOther: 'detalle del tipo de contrato',
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
  incomeSourceOther: 'detalle de fuente de ingresos',
  resourceOrigin: 'origen de recursos',
  resourceOriginOther: 'detalle de origen de recursos',
  expectedOperations: 'operaciones esperadas',
  expectedOperationsOther: 'detalle de operaciones esperadas',
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

function normalizeMobile(value: string): string {
  return value.replace(/[^\d]/g, '').slice(0, 10);
}

function normalizePhone(value: string): string {
  return value.replace(/[^\d]/g, '').slice(0, 10);
}

function documentNumberMaxLength(documentType: string): number {
  if (documentType === 'CC') return 10;
  if (documentType === 'TI') return 11;
  if (documentType === 'CE') return 7;
  if (documentType === 'Pasaporte') return 16;

  return 16;
}

function normalizeDocumentNumber(value: string, documentType: string): string {
  const normalized = documentType === 'CC' || documentType === 'TI'
    ? value.replace(/[^\d]/g, '')
    : value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();

  return normalized.slice(0, documentNumberMaxLength(documentType));
}

function normalizeEconomicActivity(value: string): string {
  const exactOption = economicActivityOptions.find((activity) => activity.label === value || activity.value === value);

  return exactOption ? exactOption.value : value.trim();
}

function isValidCatalogOption(value: string, options: string[]): boolean {
  return options.includes(value);
}

function isValidEconomicActivity(value: string): boolean {
  return economicActivityOptions.some((activity) => activity.label === value || activity.value === value);
}

function isValidOtherDetail(value: string): boolean {
  const normalized = value.trim();

  return normalized.length >= 3 && /[\p{L}\p{N}]/u.test(normalized);
}

function otherDetailMessage(label: string): string {
  return `Especifica ${label} con al menos 3 caracteres validos.`;
}

function normalizePersonalData(current: PersonalData, next: Record<string, string>): PersonalData {
  const merged = { ...current, ...next };

  if ('department' in next && next.department !== current.department) {
    merged.city = '';
  }

  const availableCities = citiesByDepartment.get(merged.department) ?? [];
  if (merged.city && !availableCities.includes(merged.city)) {
    merged.city = '';
  }

  if (colombianNationalityDocumentTypes.has(merged.documentType)) {
    merged.nationality = 'Colombiana';
    merged.residenceCountry = 'Colombia';
  }

  if ('mobile' in next) {
    merged.mobile = normalizeMobile(next.mobile);
  }

  if ('documentNumber' in next || 'documentType' in next) {
    merged.documentNumber = normalizeDocumentNumber(merged.documentNumber, merged.documentType);
  }

  return merged;
}

function fieldMaxLength(field: FieldConfig): number | undefined {
  if (field.maxLength) return field.maxLength;
  if (currencyFieldKeys.has(field.key)) return MONEY_MAX_DISPLAY_LENGTH;
  if (field.key === 'mobile') return 10;
  if (field.key === 'email') return 254;
  if (field.key === 'documentNumber') return 16;
  if (field.key === 'dependentsCount') return 3;
  if (field.inputMode === 'numeric') return 30;
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
      className={`w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 ${props.className ?? ''}`}
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
      className={`w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-slate-900 shadow-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 ${props.className ?? ''}`}
    />
  );
}

function ComboInput({
  id,
  options,
  value,
  onChange,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  id: string;
  options: string[];
}) {
  const [open, setOpen] = useState(false);
  const currentValue = typeof value === 'string' ? value : '';
  const normalizedValue = currentValue.trim().toLocaleLowerCase('es-CO');
  const visibleOptions = options
    .filter((option) => (normalizedValue ? option.toLocaleLowerCase('es-CO').includes(normalizedValue) : true))
    .slice(0, 8);

  function selectOption(option: string) {
    onChange?.({ target: { value: option } } as React.ChangeEvent<HTMLInputElement>);
    setOpen(false);
  }

  function closeAndNormalize() {
    window.setTimeout(() => {
      if (currentValue && !options.includes(currentValue)) {
        onChange?.({ target: { value: '' } } as React.ChangeEvent<HTMLInputElement>);
      }
      setOpen(false);
    }, 120);
  }

  return (
    <div className="relative">
      <TextInput
        {...props}
        id={id}
        value={value}
        autoComplete="off"
        onFocus={() => setOpen(true)}
        onBlur={closeAndNormalize}
        onChange={(event) => {
          setOpen(true);
          onChange?.(event);
        }}
      />
      {open && visibleOptions.length > 0 ? (
        <div className="absolute left-0 right-0 z-30 mt-2 max-h-72 overflow-y-auto rounded-2xl border border-emerald-100 bg-white p-1.5 shadow-xl shadow-slate-900/12">
          {visibleOptions.map((option) => (
            <button
              key={option}
              type="button"
              className="block w-full rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-slate-700 transition hover:bg-emerald-50 hover:text-emerald-900"
              onMouseDown={(event) => {
                event.preventDefault();
                selectOption(option);
              }}
            >
              {option}
            </button>
          ))}
        </div>
      ) : null}
    </div>
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
  options: {
    disabledKeys?: Set<string>;
    fieldOptions?: Record<string, string[]>;
    placeholders?: Record<string, string>;
  } = {},
) {
  return (
    <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
      {fields.map((field) => {
        const selectOptions = options.fieldOptions?.[field.key] ?? field.options ?? [];

        return (
          <Field key={field.key} label={field.label} helper={field.helper} required={section ? isRequiredField(section, field.key) : false}>
            {field.type === 'select' ? (
              <SelectInput
                disabled={options.disabledKeys?.has(field.key)}
                value={values[field.key] ?? ''}
                onChange={(event) => setValues({ ...values, [field.key]: event.target.value })}
              >
                <option value="">Selecciona una opcion</option>
                {selectOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </SelectInput>
            ) : field.type === 'combobox' ? (
              <ComboInput
                id={`affiliation-${field.key}-options`}
                options={selectOptions}
                maxLength={field.key === 'documentNumber' ? documentNumberMaxLength(values.documentType) : fieldMaxLength(field)}
                disabled={options.disabledKeys?.has(field.key)}
                placeholder={options.placeholders?.[field.key]}
                value={values[field.key] ?? ''}
                onChange={(event) => setValues({ ...values, [field.key]: event.target.value })}
              />
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
                disabled={options.disabledKeys?.has(field.key)}
                placeholder={options.placeholders?.[field.key]}
                value={currencyFieldKeys.has(field.key) ? formatCurrency(values[field.key] ?? '') : values[field.key] ?? ''}
                onChange={(event) =>
                  setValues({
                    ...values,
                    [field.key]: currencyFieldKeys.has(field.key)
                      ? limitedCurrency(event.target.value)
                      : field.key === 'documentNumber'
                        ? normalizeDocumentNumber(event.target.value, values.documentType)
                        : event.target.value,
                  })
                }
              />
            )}
          </Field>
        );
      })}
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
  const [uploadedDocumentTypes, setUploadedDocumentTypes] = useState<Set<RequiredDocumentType>>(new Set());
  const [selectedLegalDocument, setSelectedLegalDocument] = useState<(typeof legalDocuments)[number]>(legalDocuments[0]);
  const [state, setState] = useState<SectionState>(createInitialState);

  const progress = useMemo(() => Math.round(((step + 1) / stepLabels.length) * 100), [step]);
  const uploadedDocumentNames = useMemo(() => new Map(
    (draft?.documents ?? []).map((document) => [document.document_type, document.original_filename]),
  ), [draft]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const storedDraft = readStoredDraft();
        if (storedDraft) {
          try {
            const recoveredDraft = await readAffiliationDraft(storedDraft.links.read);
            if (!active) return;
            setDraft(recoveredDraft);
            storeDraft(recoveredDraft);
            setState(stateFromDraft(recoveredDraft));
            setUploadedDocumentTypes(new Set(
              (recoveredDraft.documents ?? [])
                .map((document) => document.document_type)
                .filter((documentType): documentType is RequiredDocumentType =>
                  documentType === 'identity' || documentType === 'employment_certificate',
                ),
            ));
            setBackendMode('ready');
            setBackendMessage(`Borrador ${recoveredDraft.id} recuperado en este navegador.`);
            return;
          } catch {
            clearStoredDraft();
          }
        }

        const response = await createAffiliationDraft();
        if (!active) return;
        setDraft(response);
        storeDraft(response);
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

    const validationMessage = validateCurrentStep(step, state, uploadedDocumentTypes);
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
        await syncSection('sarlaft', {
          ...state.sarlaft,
          economicActivity: normalizeEconomicActivity(state.sarlaft.economicActivity),
        });
        setMessage('Seccion SARLAFT guardada.');
      } else if (step === 5) {
        if (
          (!state.finalStep.identityDocumentFile && !uploadedDocumentTypes.has('identity'))
          || (!state.finalStep.employmentCertificateFile && !uploadedDocumentTypes.has('employment_certificate'))
        ) {
          throw new Error('Debes adjuntar documento de identidad y certificado laboral en PDF.');
        }

        setMessage('Documentos, declaraciones y autorizaciones listos para revision.');
      } else {
        if (
          (!state.finalStep.identityDocumentFile && !uploadedDocumentTypes.has('identity'))
          || (!state.finalStep.employmentCertificateFile && !uploadedDocumentTypes.has('employment_certificate'))
        ) {
          throw new Error('Debes adjuntar documento de identidad y certificado laboral en PDF.');
        }

        if (draft && backendMode === 'ready') {
          if (state.finalStep.identityDocumentFile) {
            await uploadAffiliationDocument(draft.links.documents, {
              documentType: 'identity',
              file: state.finalStep.identityDocumentFile,
            });
          }
          if (state.finalStep.employmentCertificateFile) {
            await uploadAffiliationDocument(draft.links.documents, {
              documentType: 'employment_certificate',
              file: state.finalStep.employmentCertificateFile,
            });
          }

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
          clearStoredDraft();
          setUploadedDocumentTypes(new Set());
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
    const nationalityLocked = colombianNationalityDocumentTypes.has(state.personal.documentType);
    const disabledKeys = new Set<string>();

    if (nationalityLocked) {
      disabledKeys.add('nationality');
      disabledKeys.add('residenceCountry');
    }

    if (!state.personal.department) {
      disabledKeys.add('city');
    }

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
            personal: normalizePersonalData(current.personal, next),
          })),
        'personal', {
          disabledKeys,
          fieldOptions: {
            nationality: nationalityOptions,
            residenceCountry: countryOptions,
            department: departmentOptions,
            city: citiesByDepartment.get(state.personal.department) ?? [],
          },
          placeholders: {
            email: 'nombre@dominio.com',
            mobile: '3001234567',
          },
        })}
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Numero de personas a cargo" helper="Solo visible si el asociado indica que si tiene personas a cargo." required={state.personal.hasDependents === 'Si'}>
            {state.personal.hasDependents === 'Si' ? (
              <TextInput
                inputMode="numeric"
                maxLength={3}
                value={state.personal.dependentsCount}
                onChange={(event) =>
                  setState((current) => ({
                    ...current,
                    personal: { ...current.personal, dependentsCount: event.target.value.replace(/[^\d]/g, '').slice(0, 3) },
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
          setState((current) => {
            const nextMonthlySalary = next.monthlySalary ? currencyOnly(next.monthlySalary) : current.employment.monthlySalary;
            const shouldMirrorSalary = !current.financial.principalIncome
              || current.financial.principalIncome === current.employment.monthlySalary;

            return {
              ...current,
              employment: {
                ...current.employment,
                ...next,
                contractTypeOther:
                  next.contractType && next.contractType !== 'Otro' ? '' : next.contractTypeOther ?? current.employment.contractTypeOther,
                monthlySalary: nextMonthlySalary,
              },
              financial: shouldMirrorSalary
                ? { ...current.financial, principalIncome: nextMonthlySalary }
                : current.financial,
            };
          }),
        'employment', {
          fieldOptions: {
            workCity: colombiaCityOptions,
          },
        })}
        {state.employment.contractType === 'Otro' ? (
          <Field label="Especifique el tipo de contrato" required>
            <TextInput
              maxLength={80}
              value={state.employment.contractTypeOther}
              onChange={(event) =>
                setState((current) => ({
                  ...current,
                  employment: { ...current.employment, contractTypeOther: event.target.value },
                }))
              }
            />
          </Field>
        ) : null}
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
                  { key: 'phone', label: 'Telefono', inputMode: 'numeric', maxLength: 10 },
                ].map((field) => (
                  <Field key={field.key} label={field.label} required>
                    {field.type === 'select' ? (
                      <SelectInput
                        value={beneficiary[field.key as keyof BeneficiaryData]}
                        onChange={(event) =>
                          setState((current) => ({
                            ...current,
                            beneficiaries: current.beneficiaries.map((item, itemIndex) =>
                              itemIndex === index
                                ? {
                                    ...item,
                                    [field.key]: event.target.value,
                                    documentNumber:
                                      field.key === 'documentType'
                                        ? normalizeDocumentNumber(item.documentNumber, event.target.value)
                                        : item.documentNumber,
                                    relationshipOther:
                                      field.key === 'relationship' && event.target.value !== 'Otro' ? '' : item.relationshipOther,
                                  }
                                : item,
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
                        maxLength={
                          field.key === 'documentNumber'
                            ? documentNumberMaxLength(beneficiary.documentType)
                            : field.maxLength ?? (field.key === 'fullName' ? TEXT_MAX_LENGTH : TEXT_MAX_LENGTH)
                        }
                        value={beneficiary[field.key as keyof BeneficiaryData] as string}
                        onChange={(event) =>
                          setState((current) => ({
                            ...current,
                            beneficiaries: current.beneficiaries.map((item, itemIndex) =>
                              itemIndex === index
                                ? {
                                    ...item,
                                    [field.key]:
                                      field.key === 'phone'
                                        ? normalizePhone(event.target.value)
                                        : field.key === 'documentNumber'
                                          ? normalizeDocumentNumber(event.target.value, beneficiary.documentType)
                                          : event.target.value,
                                  }
                                : item,
                            ),
                          }))
                        }
                      />
                    )}
                  </Field>
                ))}
              </div>
              {beneficiary.relationship === 'Otro' ? (
                <div className="mt-4">
                  <Field label="Especifique parentesco" required>
                    <TextInput
                      maxLength={80}
                      value={beneficiary.relationshipOther}
                      onChange={(event) =>
                        setState((current) => ({
                          ...current,
                          beneficiaries: current.beneficiaries.map((item, itemIndex) =>
                            itemIndex === index ? { ...item, relationshipOther: event.target.value } : item,
                          ),
                        }))
                      }
                    />
                  </Field>
                </div>
              ) : null}
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
                  inputMode={field.key === 'phone' ? 'numeric' : undefined}
                  maxLength={field.key === 'fullName' ? TEXT_MAX_LENGTH : field.key === 'phone' ? 10 : 80}
                  value={state.emergencyContact[field.key as keyof EmergencyContactData]}
                  onChange={(event) =>
                    setState((current) => ({
                      ...current,
                      emergencyContact: {
                        ...current.emergencyContact,
                        [field.key]: field.key === 'phone' ? normalizeMobile(event.target.value) : event.target.value,
                      },
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
            <ComboInput
              id="affiliation-economic-activity-options"
              options={economicActivitySearchOptions}
              maxLength={240}
              placeholder="Escribe codigo o actividad"
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
                        sarlaft: {
                          ...current.sarlaft,
                          incomeSource: toggleValue(current.sarlaft.incomeSource, option),
                          incomeSourceOther:
                            option === 'Otro' && current.sarlaft.incomeSource.includes(option) ? '' : current.sarlaft.incomeSourceOther,
                        },
                      }))
                    }
                  />
                  {option}
                </label>
              ))}
            </div>
            {state.sarlaft.incomeSource.includes('Otro') ? (
              <div className="mt-3">
                <Field label="Especifique fuente de ingresos" required>
                  <TextInput
                    maxLength={80}
                    value={state.sarlaft.incomeSourceOther}
                    onChange={(event) =>
                      setState((current) => ({
                        ...current,
                        sarlaft: { ...current.sarlaft, incomeSourceOther: event.target.value },
                      }))
                    }
                  />
                </Field>
              </div>
            ) : null}
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
                        sarlaft: {
                          ...current.sarlaft,
                          resourceOrigin: toggleValue(current.sarlaft.resourceOrigin, option),
                          resourceOriginOther:
                            option === 'Otro' && current.sarlaft.resourceOrigin.includes(option) ? '' : current.sarlaft.resourceOriginOther,
                        },
                      }))
                    }
                  />
                  {option}
                </label>
              ))}
            </div>
            {state.sarlaft.resourceOrigin.includes('Otro') ? (
              <div className="mt-3">
                <Field label="Especifique origen de recursos" required>
                  <TextInput
                    maxLength={80}
                    value={state.sarlaft.resourceOriginOther}
                    onChange={(event) =>
                      setState((current) => ({
                        ...current,
                        sarlaft: { ...current.sarlaft, resourceOriginOther: event.target.value },
                      }))
                    }
                  />
                </Field>
              </div>
            ) : null}
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
                  maxLength={160}
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
                  maxLength={80}
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
          <Field label="Actua por cuenta de terceros">
            <SelectInput
              value={state.sarlaft.actsOnBehalfOfThirdParties}
              onChange={(event) =>
                setState((current) => ({
                  ...current,
                  sarlaft: { ...current.sarlaft, actsOnBehalfOfThirdParties: event.target.value },
                }))
              }
            >
              <option value="No">No</option>
              <option value="Si">Si</option>
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
                      sarlaft: {
                        ...current.sarlaft,
                        foreignAccountType: event.target.value,
                        foreignAccountTypeOther: event.target.value === 'Otra' ? current.sarlaft.foreignAccountTypeOther : '',
                      },
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
              {state.sarlaft.foreignAccountType === 'Otra' ? (
                <Field label="Especifique tipo de cuenta" required>
                  <TextInput
                    maxLength={80}
                    value={state.sarlaft.foreignAccountTypeOther}
                    onChange={(event) =>
                      setState((current) => ({
                        ...current,
                        sarlaft: { ...current.sarlaft, foreignAccountTypeOther: event.target.value },
                      }))
                    }
                  />
                </Field>
              ) : null}
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

        {state.sarlaft.actsOnBehalfOfThirdParties === 'Si' ? (
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
                        expectedOperationsOther:
                          option === 'Otros servicios' && current.sarlaft.expectedOperations.includes(option)
                            ? ''
                            : current.sarlaft.expectedOperationsOther,
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
          {state.sarlaft.expectedOperations.includes('Otros servicios') ? (
            <div className="mt-4">
              <Field label="Especifique otros servicios" required>
                <TextInput
                  maxLength={80}
                  value={state.sarlaft.expectedOperationsOther}
                  onChange={(event) =>
                    setState((current) => ({
                      ...current,
                      sarlaft: { ...current.sarlaft, expectedOperationsOther: event.target.value },
                    }))
                  }
                />
              </Field>
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  function renderReviewSection() {
    const economicActivityLabel =
      economicActivityOptions.find((activity) => activity.value === normalizeEconomicActivity(state.sarlaft.economicActivity))?.label ??
      state.sarlaft.economicActivity;

    const reviewCard = (title: string, items: Array<[string, ReactNode]>) => (
      <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
        <h4 className="text-base font-black text-slate-950">{title}</h4>
        <dl className="mt-4 grid gap-3 sm:grid-cols-2">
          {items.map(([label, value]) => (
            <div key={label} className="rounded-2xl bg-slate-50 px-4 py-3">
              <dt className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">{label}</dt>
              <dd className="mt-1 text-sm font-semibold text-slate-800">{value || 'No registra'}</dd>
            </div>
          ))}
        </dl>
      </div>
    );

    return (
      <div className="space-y-6">
        <SectionHeader
          icon={<CheckCircle2 size={22} />}
          eyebrow="Bloque 7"
          title="Revision y envio"
          description="Verifique la informacion diligenciada antes de enviar la solicitud a FONASIN."
        />

        <div className="rounded-[1.5rem] border border-emerald-100 bg-emerald-50 p-4 text-sm leading-6 text-emerald-950">
          Revise con calma. Al enviar, Laravel registrara la solicitud, guardara el documento privado, aceptara los
          consentimientos y generara los formatos internos sin descarga para el solicitante.
        </div>

        {reviewCard('Datos personales', [
          ['Documento', `${state.personal.documentType} ${state.personal.documentNumber}`],
          ['Nombre completo', [state.personal.firstName, state.personal.middleName, state.personal.lastName, state.personal.secondLastName].filter(Boolean).join(' ')],
          ['Fecha de nacimiento', state.personal.birthDate],
          ['Expedicion', `${state.personal.issuePlace} - ${state.personal.issueDate}`],
          ['Ubicacion', `${state.personal.city}, ${state.personal.department}`],
          ['Residencia', `${state.personal.residenceAddress}${state.personal.neighborhood ? `, ${state.personal.neighborhood}` : ''}`],
          ['Pais / nacionalidad', `${state.personal.residenceCountry} / ${state.personal.nationality}`],
          ['Contacto', `${state.personal.mobile} - ${state.personal.email}`],
          ['Nivel / profesion', `${state.personal.educationLevel} - ${state.personal.profession}`],
          ['Personas a cargo', state.personal.hasDependents === 'Si' ? state.personal.dependentsCount : 'No'],
        ])}

        {reviewCard('Informacion laboral', [
          ['Empresa', state.employment.employer],
          ['Cargo', state.employment.position],
          ['Area', state.employment.departmentArea],
          ['Contrato', state.employment.contractType === 'Otro' ? `Otro: ${state.employment.contractTypeOther}` : state.employment.contractType],
          ['Fecha de ingreso', state.employment.hireDate],
          ['Ciudad de trabajo', state.employment.workCity],
          ['Salario mensual', moneyLabel(Number(state.employment.monthlySalary || '0'))],
        ])}

        {reviewCard('Informacion economica', [
          ['Ingreso principal', moneyLabel(Number(state.financial.principalIncome || '0'))],
          ['Otros ingresos', moneyLabel(Number(state.financial.otherIncome || '0'))],
          ['Total ingresos', moneyLabel(Number(state.financial.totalIncome || '0'))],
          ['Gastos mensuales', moneyLabel(Number(state.financial.monthlyExpenses || '0'))],
          ['Obligaciones', moneyLabel(Number(state.financial.financialObligations || '0'))],
          ['Total egresos', moneyLabel(Number(state.financial.totalExpenses || '0'))],
          ['Activos', moneyLabel(Number(state.financial.assetsValue || '0'))],
          ['Pasivos', moneyLabel(Number(state.financial.liabilitiesValue || '0'))],
          ['Patrimonio', moneyLabel(Number(state.financial.equityValue || '0'))],
          ['Ahorro voluntario', state.financial.voluntarySavings === 'Si' ? moneyLabel(Number(state.financial.voluntarySavingsValue || '0')) : 'No'],
        ])}

        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
          <h4 className="text-base font-black text-slate-950">Beneficiarios y contacto</h4>
          <div className="mt-4 grid gap-3">
            {state.beneficiaries.map((beneficiary, index) => (
              <div key={`${beneficiary.documentNumber}-${index}`} className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
                <p className="font-black text-slate-950">Beneficiario {index + 1}</p>
                <p className="mt-1 font-semibold">
                  {beneficiary.fullName} - {beneficiary.documentType} {beneficiary.documentNumber}
                </p>
                <p className="mt-1">
                  {beneficiary.relationship === 'Otro' ? `Otro parentesco: ${beneficiary.relationshipOther}` : beneficiary.relationship}
                  {' · '}
                  {beneficiary.birthDate}
                  {' · '}
                  {beneficiary.phone}
                </p>
              </div>
            ))}
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-950">
              <p className="font-black">Contacto de emergencia</p>
              <p className="mt-1 font-semibold">
                {state.emergencyContact.fullName} - {state.emergencyContact.relationship} - {state.emergencyContact.phone}
              </p>
            </div>
          </div>
        </div>

        {reviewCard('SARLAFT', [
          ['Actividad economica', economicActivityLabel],
          ['Fuente de ingresos', state.sarlaft.incomeSource.includes('Otro') ? `${state.sarlaft.incomeSource.join(', ')}: ${state.sarlaft.incomeSourceOther}` : state.sarlaft.incomeSource.join(', ')],
          ['Origen de recursos', state.sarlaft.resourceOrigin.includes('Otro') ? `${state.sarlaft.resourceOrigin.join(', ')}: ${state.sarlaft.resourceOriginOther}` : state.sarlaft.resourceOrigin.join(', ')],
          ['PEP', state.sarlaft.pep],
          ['Cuentas en exterior', state.sarlaft.foreignAccounts],
          ['Actua por terceros', state.sarlaft.actsOnBehalfOfThirdParties],
          ['Residencia fiscal', state.sarlaft.taxResidenceCountry],
          ['Operaciones esperadas', state.sarlaft.expectedOperations.includes('Otros servicios') ? `${state.sarlaft.expectedOperations.join(', ')}: ${state.sarlaft.expectedOperationsOther}` : state.sarlaft.expectedOperations.join(', ')],
        ])}

        {reviewCard('Documentos y autorizaciones', [
          ['Documento de identidad', state.finalStep.identityDocumentFile?.name ?? 'No registra'],
          ['Certificado laboral', state.finalStep.employmentCertificateFile?.name ?? 'No registra'],
          ['Firma', `${state.finalStep.signatureCity} - ${state.finalStep.signatureDate}`],
          ['Mecanismo', state.finalStep.signatureMechanism],
          ['Declaraciones', 'Aceptadas'],
          ['Autorizaciones', 'Tratamiento de datos, consultas y estatutos aceptados'],
        ])}

        <div className="rounded-[1.5rem] border border-slate-950 bg-slate-950 p-4 text-white">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-200">Formatos internos</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {['Formulario de afiliacion completo', 'Autorizacion de descuento por nomina'].map((document) => (
              <div key={document} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-100">
                {document}
                <p className="mt-1 text-xs font-normal leading-5 text-slate-300">Se genera para revision interna. No se descarga desde este formulario.</p>
              </div>
            ))}
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

    const consentItems: Array<[keyof FinalStepData['declarations'], string, (typeof legalDocuments)[number] | null]> = [
      ['dataProcessing', 'Autorizo el tratamiento de mis datos personales.', legalDocuments[0]],
      ['consultations', 'Autorizo las consultas y verificaciones necesarias.', null],
      ['bylaws', 'Declaro conocer y aceptar estatutos y reglamentos.', legalDocuments[1]],
    ];

    return (
      <div className="space-y-6">
        <SectionHeader
          icon={<FileText size={22} />}
          eyebrow="Bloque 6"
          title="Documentos, declaraciones y autorizaciones"
          description="El documento separa esta parte del formulario principal. Aqui quedan el cierre y la firma."
        />

        <div className="grid gap-5">
          <div className="space-y-4">
            {[
              {
                key: 'identityDocumentFile' as const,
                eyebrow: 'Documento obligatorio 1',
                title: 'Documento de identidad',
                helper: 'Incluye ambos lados en un solo PDF. Maximo 5MB.',
                file: state.finalStep.identityDocumentFile,
                uploadedName: uploadedDocumentNames.get('identity'),
              },
              {
                key: 'employmentCertificateFile' as const,
                eyebrow: 'Documento obligatorio 2',
                title: 'Certificado laboral',
                helper: 'Adjunta certificado laboral en PDF. Maximo 5MB.',
                file: state.finalStep.employmentCertificateFile,
                uploadedName: uploadedDocumentNames.get('employment_certificate'),
              },
            ].map((document) => (
              <div key={document.key} className="rounded-[1.6rem] border border-emerald-100 bg-emerald-50 p-4">
                <div className="flex items-center gap-3">
                  <div className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-600 text-white">
                    <Upload size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">{document.eyebrow}</p>
                    <h4 className="text-lg font-black text-slate-950">{document.title}</h4>
                  </div>
                </div>
                <label className="mt-4 block">
                  <span className="text-sm font-bold text-slate-800">Adjuntar PDF <span className="text-red-500">*</span></span>
                  <div className="mt-2 rounded-2xl border border-dashed border-emerald-300 bg-white px-4 py-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0 text-sm text-slate-600">
                        <p className="max-w-full truncate font-semibold text-slate-900 sm:max-w-56">
                          {document.file?.name ?? document.uploadedName ?? 'Seleccionar PDF'}
                        </p>
                        <p className="mt-1 text-xs leading-5 text-slate-500">
                          {document.file || !document.uploadedName ? document.helper : 'PDF cargado previamente en este borrador.'}
                        </p>
                      </div>
                      <span className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white">
                        <Upload size={16} /> Cargar archivo
                        <input
                          type="file"
                          accept=".pdf,application/pdf"
                          className="sr-only"
                          onChange={(event) =>
                            setState((current) => ({
                              ...current,
                              finalStep: { ...current.finalStep, [document.key]: event.target.files?.[0] ?? null },
                            }))
                          }
                        />
                      </span>
                    </div>
                  </div>
                </label>
              </div>
            ))}

            <div className="rounded-[1.6rem] border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">Documentos legales</p>
                  <h4 className="mt-1 text-lg font-black text-slate-950">Revise antes de aceptar</h4>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    Estos documentos respaldan las autorizaciones y declaraciones del cierre.
                  </p>
                </div>
                <a
                  href={selectedLegalDocument.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-bold text-emerald-700 transition hover:bg-emerald-100"
                >
                  Abrir PDF <ExternalLink size={15} />
                </a>
              </div>

              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {legalDocuments.map((document) => {
                  const active = selectedLegalDocument.key === document.key;

                  return (
                    <button
                      key={document.key}
                      type="button"
                      onClick={() => setSelectedLegalDocument(document)}
                      className={`rounded-2xl border px-4 py-3 text-left transition ${
                        active
                          ? 'border-emerald-300 bg-emerald-50 text-emerald-950'
                          : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-emerald-200 hover:bg-white'
                      }`}
                    >
                      <span className="block text-sm font-black">{document.title}</span>
                      <span className="mt-1 block text-xs leading-5 text-slate-500">{document.description}</span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                <iframe
                  key={selectedLegalDocument.key}
                  title={selectedLegalDocument.title}
                  src={selectedLegalDocument.url}
                  className="h-[24rem] w-full bg-white"
                />
              </div>
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
                {consentItems.map(([key, text, document]) => (
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
                    <span>
                      {text}
                      {document ? (
                        <button
                          type="button"
                          onClick={(event) => {
                            event.preventDefault();
                            setSelectedLegalDocument(document);
                          }}
                          className="ml-1 font-bold text-emerald-700 underline-offset-4 hover:underline"
                        >
                          Ver documento.
                        </button>
                      ) : null}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="rounded-[1.6rem] border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">Firma electronica simple</p>
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
                    disabled
                    value={state.finalStep.signatureDate}
                    onChange={() => undefined}
                  />
                </Field>
                <p className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900">
                  La solicitud se cerrara mediante firma electronica simple.
                </p>
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
    const generatedDocuments = draft?.generated_documents ?? [];

    return (
      <div className="rounded-[2rem] border border-emerald-100 bg-white p-6 text-center shadow-[0_24px_70px_rgba(6,74,46,0.12)] sm:p-8">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-emerald-100 text-emerald-700">
          <CheckCircle2 size={34} />
        </div>
        <h2 className="mt-5 text-3xl font-black text-slate-950">Solicitud preparada</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          La solicitud fue enviada para revision interna. Los documentos generados quedan protegidos en el backend y
          se muestran aqui solo como vista previa.
        </p>
        {generatedDocuments.length > 0 ? (
          <div className="mt-6 space-y-5 text-left">
            {generatedDocuments.map((document) => (
              <article key={document.id} className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">Documento interno</p>
                    <h3 className="mt-1 text-xl font-black text-slate-950">{generatedDocumentTitle(document)}</h3>
                  </div>
                  <p className="text-xs font-semibold text-slate-500">Vista protegida, sin descarga desde el formulario</p>
                </div>
                <StatutesBookViewer url={document.links.preview} title={generatedDocumentTitle(document)} />
              </article>
            ))}
          </div>
        ) : (
          <div className="mx-auto mt-6 max-w-xl rounded-[1.5rem] border border-amber-100 bg-amber-50 p-4 text-left">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-700">Documentos internos</p>
            <p className="mt-2 text-sm leading-6 text-amber-900">
              La solicitud quedo enviada, pero este entorno no devolvio los enlaces de vista previa de los documentos.
            </p>
          </div>
        )}
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
            {step === 6 ? renderReviewSection() : null}

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
                  {saving ? 'Guardando...' : step === stepLabels.length - 1 ? 'Enviar solicitud' : step === 5 ? 'Ir a revision' : 'Guardar y continuar'}
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
