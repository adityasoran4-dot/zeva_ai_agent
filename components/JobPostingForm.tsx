// components/JobPostingForm.tsx
import React, { useMemo, useState, useEffect, useRef} from 'react';
import dynamic from 'next/dynamic';
import type { ComponentType } from 'react';

import {
  Bold,
  Italic,
  Underline,
  Link as LinkIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Palette,
  Highlighter,
} from 'lucide-react';
import 'react-quill/dist/quill.snow.css';

// Dynamic import for ReactQuill
const ReactQuill = dynamic<ComponentType<unknown>>(
  () =>
    import("react-quill").then((mod) => {
      return mod.default as ComponentType<unknown>;
    }),
  {
    ssr: false,
    loading: () => (
      <div className="h-48 bg-gray-100 animate-pulse rounded flex items-center justify-center">
        <p className="text-gray-700 text-sm">Loading editor...</p>
      </div>
    ),
  }
);

// Minimal Quill types
type QuillRange = { index: number; length: number } | null;
type StringMap = Record<string, unknown>;
interface MinimalQuillEditor {
  getSelection: (focus?: boolean) => QuillRange;
  focus: () => void;
  setSelection: (index: number, length: number, source?: string) => void;
  getFormat: (index?: number, length?: number) => StringMap;
  on: (event: string, handler: (range: QuillRange) => void) => void;
  off: (event: string, handler: (range: QuillRange) => void) => void;
  getBounds: (index: number, length?: number) => { top: number; left: number };
  formatText: (index: number, length: number, formats: Record<string, unknown>) => void;
  format: (name: string, value: unknown) => void;
}

const qualifications = [
  "B.Tech", "M.Tech", "BCA", "MCA", "Diploma in CS/IT",
  "B.Sc IT", "M.Sc IT", "BBA", "MBA", "Other Software",
  "MBBS", "BDS", "BAMS", "BHMS", "MD", "MS", "PhD",
  "Diploma", "Nursing", "Pharmacy", "Other Medical",
  "Graduate", "Post Graduate", "12th Pass", "10th Pass", "Other"
];

const departments = [
  "Software Development", "Frontend", "Backend", "Full Stack", "DevOps",
  "QA & Testing", "Automation Testing", "Manual Testing", "UI/UX", "Data Science",
  "AI/ML", "Cloud Computing", "Cybersecurity", "Database Administration",
  "Product Management", "Business Analysis",
  "General Medicine", "Cardiology", "Radiology", "Dental", "Pathology",
  "Pediatrics", "Orthopedics", "Gynecology", "Dermatology",
  "Anesthesiology", "Surgery", "ENT", "Psychiatry", "Physiotherapy",
  "Administration", "Pharmacy", "Research", "Other"
];

const jobTypes = ['Full Time', 'Part Time', 'Internship'];

interface JobFormData {
  companyName: string;
  jobTitle: string;
  department: string;
  qualification: string;
  jobType: string;
  location: string;
  jobTiming: string;
  skills: string;
  perks: string;
  languagesPreferred: string;
  description: string;
  noOfOpenings: string;
  salary: string;
  salaryType: string;
  experience: string;
  establishment: string;
  workingDays: string;
}

type FieldKey = keyof JobFormData;

interface JobPostingFormProps {
  onSubmit: (formData: JobFormData) => Promise<void>;
  isSubmitting?: boolean;
  title?: string;
  subtitle?: string;
  initialData?: Partial<JobFormData>;
  isCompact?: boolean;
}

const JobPostingForm: React.FC<JobPostingFormProps> = ({
  onSubmit,
  isSubmitting = false,
  title = "Post a Job",
  subtitle = "Create a new job posting for your clinic",
  initialData,
  isCompact = false,
}) => {
  const [formData, setFormData] = useState<JobFormData>({
    companyName: initialData?.companyName || '',
    jobTitle: initialData?.jobTitle || '',
    department: initialData?.department || '',
    qualification: initialData?.qualification || '',
    jobType: initialData?.jobType || '',
    location: initialData?.location || '',
    jobTiming: initialData?.jobTiming || '',
    skills: initialData?.skills || '',
    perks: initialData?.perks || '',
    languagesPreferred: initialData?.languagesPreferred || '',
    description: initialData?.description || '',
    noOfOpenings: initialData?.noOfOpenings || '',
    salary: initialData?.salary || '',
    salaryType: initialData?.salaryType || '',
    experience: initialData?.experience || '',
    establishment: initialData?.establishment || '',
    workingDays: initialData?.workingDays || '',
  });

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // React Quill refs and state
  const quillRef = useRef<{ getEditor: () => MinimalQuillEditor } | null>(null);
  const quillInstanceRef = useRef<MinimalQuillEditor | null>(null);
  const lastRangeRef = useRef<QuillRange>(null);
  const [showFloatingToolbar, setShowFloatingToolbar] = useState<boolean>(false);
  const [floatingToolbarPosition, setFloatingToolbarPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const [currentFormats, setCurrentFormats] = useState<StringMap>({});
  const floatingToolbarRef = useRef<HTMLDivElement | null>(null);

  // Quill modules configuration
  const modules = useMemo(() => ({
    toolbar: {
      container: [
        [{ 'header': [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'color': [] }, { 'background': [] }],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        [{ 'align': [] }],
        ['link', 'image'],
        ['clean']
      ],
    },
    history: {
      delay: 1000,
      maxStack: 50,
      userOnly: true
    }
  }), []);

  const formats = [
    'header', 'bold', 'italic', 'underline', 'strike',
    'color', 'background', 'list', 'bullet', 'align',
    'link', 'image'
  ];

  // Handle Quill ref
  const handleQuillRef = (ref: any) => {
    quillRef.current = ref;
    if (ref) {
      try {
        if (typeof ref.getEditor === 'function') {
          quillInstanceRef.current = ref.getEditor();
        } else if ((ref as any).editor) {
          quillInstanceRef.current = (ref as any).editor;
        }
      } catch (error) {
        console.warn('Error getting Quill instance:', error);
      }
    } else {
      quillInstanceRef.current = null;
    }
  };

  // Get Quill instance
  const getQuillInstance = (): MinimalQuillEditor | null => {
    if (quillInstanceRef.current) return quillInstanceRef.current;
    if (quillRef.current) {
      try {
        if (typeof quillRef.current.getEditor === 'function') {
          const instance = quillRef.current.getEditor();
          if (instance) {
            quillInstanceRef.current = instance;
            return instance;
          }
        }
      } catch (error) {
        console.warn('Error getting Quill instance:', error);
      }
    }
    return null;
  };

  // Setup floating toolbar
  useEffect(() => {
    const quill = getQuillInstance();
    if (!quill) return;

    const updateFloatingToolbar = (range: QuillRange) => {
      if (!range || range.length === 0) {
        setShowFloatingToolbar(false);
        setCurrentFormats({});
        return;
      }

      try {
        const editorElement = document.querySelector('.ql-editor') as HTMLElement;
        if (!editorElement) return;

        const bounds = quill.getBounds(range.index, range.length);
        if (!bounds) return;

        const formats = quill.getFormat(range.index, range.length);
        setCurrentFormats(formats);

        const editorRect = editorElement.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        const top = editorRect.top + bounds.top + scrollTop - 50;
        const left = editorRect.left + bounds.left;
        
        const toolbarWidth = 320;
        const viewportWidth = window.innerWidth;
        let finalLeft = left;
        let finalTop = top;
        
        if (left + toolbarWidth / 2 > viewportWidth) {
          finalLeft = viewportWidth - toolbarWidth / 2 - 10;
        } else if (left - toolbarWidth / 2 < 0) {
          finalLeft = toolbarWidth / 2 + 10;
        }
        
        if (top < 10) {
          finalTop = editorRect.top + bounds.top + scrollTop + 30;
        }

        setFloatingToolbarPosition({ top: finalTop, left: finalLeft });
        setShowFloatingToolbar(true);
      } catch (error) {
        console.error('Error updating floating toolbar:', error);
      }
    };

    const handler = (range: QuillRange) => {
      if (range && range.length > 0) {
        lastRangeRef.current = range;
        updateFloatingToolbar(range);
      } else {
        setShowFloatingToolbar(false);
        setCurrentFormats({});
      }
    };

    quill.on("selection-change", handler);

    return () => {
      quill.off("selection-change", handler);
    };
  }, [formData.description]);

  // Format with Quill
  const formatWithQuill = (format: string, desiredValue?: unknown) => {
    const quill = getQuillInstance();
    if (!quill) return;

    quill.focus();
    let currentRange = quill.getSelection(true);
    
    if (!currentRange || currentRange.length === 0) {
      if (lastRangeRef.current) {
        currentRange = lastRangeRef.current;
        quill.setSelection(currentRange.index, currentRange.length || 0, "user");
      } else {
        const length = quill.getFormat().toString().length || 0;
        quill.setSelection(length, 0, "user");
        currentRange = { index: length, length: 0 };
      }
    }

    if (format === "bold" || format === "italic" || format === "underline") {
      const current = quill.getFormat(currentRange.index, currentRange.length);
      quill.format(format, !current[format]);
    } else if (format === "align") {
      quill.format("align", desiredValue);
    } else if (format === "link") {
      const url = prompt("Enter URL:");
      if (url) {
        quill.format("link", url);
      }
    } else if (format === "color" || format === "background") {
      const colorInput = document.createElement("input");
      colorInput.type = "color";
      colorInput.onchange = () => {
        if (format === "color") {
          quill.formatText(currentRange.index, currentRange.length, { color: colorInput.value });
        } else {
          quill.formatText(currentRange.index, currentRange.length, { background: colorInput.value });
        }
      };
      colorInput.click();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setTouched(prev => ({ ...prev, [name]: true }));
    const fieldError = validateField(name as FieldKey, value);
    setErrors(prev => ({ ...prev, [name]: fieldError }));
  };

  const handleDescriptionChange = (value: string) => {
    setFormData(prev => ({ ...prev, description: value }));
    setTouched(prev => ({ ...prev, description: true }));
    if (!value || value.trim() === '' || value === '<p><br></p>') {
      setErrors(prev => ({ ...prev, description: 'This field is required' }));
    } else {
      setErrors(prev => ({ ...prev, description: '' }));
    }
  };

  const sectionFields: FieldKey[][] = useMemo(() => ([
    ['companyName', 'establishment', 'jobTitle', 'department', 'qualification', 'jobType', 'location'],
    ['jobTiming', 'workingDays', 'salary', 'salaryType', 'experience', 'noOfOpenings'],
    ['description'],
    ['skills', 'perks', 'languagesPreferred'],
  ]), []);

  const validateField = (name: FieldKey, value: string): string => {
    if (!value || value.toString().trim() === '') {
      if (name === "salaryType") {
        if (formData.salary && formData.salary.trim() !== '') {
          return "Please select Per Month or Per Year";
        }
        return "";
      }
      if (name === "description") {
        if (!value || value.trim() === '' || value === '<p><br></p>') {
          return "This field is required";
        }
      }
      return "This field is required";
    }

    if (name === 'noOfOpenings') {
      const n = Number(value);
      if (!Number.isFinite(n) || n <= 0) return 'Enter a valid number greater than 0';
    }

    if (name === 'establishment') {
      if (!/^\d{2,4}$/.test(value.trim())) return 'Enter a valid year (e.g., 2015)';
    }

    if (name === 'salary') {
      if (value && value.trim() !== '' && (!formData.salaryType || formData.salaryType.trim() === '')) {
        setErrors(prev => ({ ...prev, salaryType: 'Please select Per Month or Per Year' }));
      } else if ((!value || value.trim() === '') && formData.salaryType) {
        setErrors(prev => ({ ...prev, salaryType: '' }));
      }
    }

    return '';
  };

  const validateSection = (step: number): Record<string, string> => {
    const fields = sectionFields[step] || [];
    const sectionErrors: Record<string, string> = {};
    fields.forEach((f) => {
      let value = formData[f] || '';
      if (f === 'description') {
        if (!value || value.trim() === '' || value === '<p><br></p>') {
          sectionErrors[f] = 'This field is required';
        }
      } else {
        const err = validateField(f, value);
        if (err) sectionErrors[f] = err;
      }
    });

    if (fields.includes('salary') || fields.includes('salaryType')) {
      if (formData.salary && formData.salary.trim() !== '' && (!formData.salaryType || formData.salaryType.trim() === '')) {
        sectionErrors.salaryType = 'Please select Per Month or Per Year';
      }
    }

    return sectionErrors;
  };

  const validateAll = (): Record<string, string> => {
    const allErrors: Record<string, string> = {};
    sectionFields.flat().forEach((f) => {
      let value = formData[f] || '';
      if (f === 'description') {
        if (!value || value.trim() === '' || value === '<p><br></p>') {
          allErrors[f] = 'This field is required';
        }
      } else {
        const err = validateField(f, value);
        if (err) allErrors[f] = err;
      }
    });

    if (formData.salary && formData.salary.trim() !== '' && (!formData.salaryType || formData.salaryType.trim() === '')) {
      allErrors.salaryType = 'Please select Per Month or Per Year';
    }

    return allErrors;
  };

  const goNext = () => {
    const sectionErrs = validateSection(currentStep);
    setErrors(prev => ({ ...prev, ...sectionErrs }));
    const touchedUpdate: Record<string, boolean> = {};
    sectionFields[currentStep].forEach(f => { touchedUpdate[f] = true; });
    setTouched(prev => ({ ...prev, ...touchedUpdate }));
    if (Object.keys(sectionErrs).length > 0) {
      return;
    }
    setCurrentStep(s => Math.min(s + 1, sectionFields.length - 1));
  };

  const goBack = () => setCurrentStep(s => Math.max(s - 1, 0));

  const handleSubmit = () => {
    const allErrs = validateAll();
    setErrors(prev => ({ ...prev, ...allErrs }));
    const allTouched: Record<string, boolean> = {};
    sectionFields.flat().forEach(f => { allTouched[f] = true; });
    setTouched(prev => ({ ...prev, ...allTouched }));
    if (Object.keys(allErrs).length > 0) {
      for (let i = 0; i < sectionFields.length; i++) {
        const fields = sectionFields[i];
        if (fields.some(f => allErrs[f])) { setCurrentStep(i); break; }
      }
      return;
    }
    setShowConfirmModal(true);
  };

  const confirmSubmit = async () => {
    try {
      let salaryRaw: string = formData.salary ? formData.salary.replace(/,/g, "") : "";

      if (salaryRaw.includes("-")) {
        const [min, max] = salaryRaw.split("-").map((v: string) => v.trim());
        salaryRaw = `${Number(min)} - ${Number(max)}`;
      } else if (salaryRaw) {
        salaryRaw = `${Number(salaryRaw)}`;
      }

      const payload = {
        ...formData,
        salary: salaryRaw,
        salaryType: formData.salaryType,
      };

      await onSubmit(payload);
      setShowConfirmModal(false);

      // Reset form
      setFormData({
        companyName: '',
        jobTitle: '',
        department: '',
        qualification: '',
        jobType: '',
        location: '',
        jobTiming: '',
        skills: '',
        perks: '',
        languagesPreferred: '',
        description: '',
        noOfOpenings: '',
        salary: '',
        salaryType: '',
        experience: '',
        establishment: '',
        workingDays: '',
      });
      setErrors({});
      setTouched({});
      setCurrentStep(0);
    } catch (error) {
      console.error(error);
    }
  };

  const QuillAny: any = ReactQuill as any;

  // Compact mode styles
  const containerClass = isCompact ? "p-2" : "min-h-screen bg-gray-50 p-2 sm:p-3 md:p-4 lg:p-6";
  const wrapperClass = isCompact ? "w-full" : "max-w-xs sm:max-w-sm md:max-w-2xl lg:max-w-4xl xl:max-w-5xl mx-auto";
  const headerClass = isCompact ? "mb-2" : "mb-4 sm:mb-6 lg:mb-8";
  const formClass = isCompact ? "bg-white p-2" : "bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4 md:p-6 lg:p-8";
  const stepIndicatorClass = isCompact ? "mb-2" : "mb-4 sm:mb-6";
  const stepSize = isCompact ? "w-5 h-5 text-[9px]" : "w-6 h-6 sm:w-8 sm:h-8 text-xs sm:text-sm";
  const stepLabelClass = isCompact ? "text-[8px] mt-0.5" : "text-xs sm:text-sm mt-1";
  const sectionTitleClass = isCompact ? "text-sm mb-2" : "text-lg sm:text-xl mb-4 sm:mb-6";
  const gridGap = isCompact ? "gap-2" : "gap-4 sm:gap-6";
  const inputPadding = isCompact ? "px-2 py-1.5 text-[10px]" : "px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm md:text-base";
  const labelClass = isCompact ? "text-[9px] mb-0.5" : "text-xs sm:text-sm mb-1 sm:mb-2";

  return (
    <div className={containerClass}>
      <div className={wrapperClass}>
        {/* Header - Hidden in compact mode */}
        {!isCompact && (
          <div className={headerClass}>
            <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
              <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-gray-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m-8 0V6a2 2 0 00-2 2v6.001" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 truncate">
                  {title}
                </h1>
                <p className="text-xs sm:text-sm md:text-base text-gray-700 mt-0.5 sm:mt-1">
                  {subtitle}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Form - Multi-step slider */}
        <div className={`${formClass} overflow-hidden ${isCompact ? '' : 'rounded-lg shadow-sm border border-gray-200'}`}>
          {/* Step indicators - Compact */}
          <div className={`flex items-center justify-between ${stepIndicatorClass} overflow-x-auto`}>
            <div className="flex items-center min-w-max w-full justify-between">
              {['Basic Info', 'Details', 'Description', 'Requirements'].map((label, idx) => (
                <div key={label} className="flex-1 flex items-center min-w-0">
                  <div className="flex flex-col items-center">
                    <div className={`flex items-center justify-center ${stepSize} rounded-full font-semibold ${currentStep >= idx ? 'bg-gray-900 text-white' : 'bg-gray-200 text-gray-700'}`}>
                      {idx + 1}
                    </div>
                    <span className={`${stepLabelClass} text-gray-700 text-center ${isCompact ? 'block' : 'hidden sm:block'}`}>
                      {label}
                    </span>
                    {!isCompact && (
                      <span className="text-xs text-gray-700 mt-1 text-center block sm:hidden">
                        Step {idx + 1}
                      </span>
                    )}
                  </div>
                  {idx < 3 && (
                    <div className={`h-0.5 flex-1 mx-1 ${currentStep > idx ? 'bg-gray-900' : 'bg-gray-200'}`}></div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Sliding container */}
          <div className="relative w-full overflow-hidden">
            <div
              className="flex transition-transform duration-500 ease-in-out"
              style={{ width: '400%', transform: `translateX(-${currentStep * 25}%)` }}
            >
              {/* Section 1: Basic Information */}
              <div className={`w-full ${isCompact ? 'bg-white' : 'bg-white rounded-xl shadow-sm border border-gray-200'} ${isCompact ? 'p-0' : 'p-3 sm:p-4 md:p-6 lg:p-8'}`}>
                <h3 className={`${sectionTitleClass} font-semibold text-gray-900`}>Basic Information</h3>

                <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 ${gridGap}`}>
                  <div className="col-span-1">
                    <label className={`block ${labelClass} font-medium text-gray-700`}>
                      Company Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      name="companyName"
                      value={formData.companyName}
                      placeholder="Enter company name"
                      onChange={handleChange}
                      className={`w-full rounded-lg border border-gray-300 bg-white ${inputPadding} text-gray-900 placeholder-gray-500 focus:border-gray-900 focus:ring-2 focus:ring-gray-900 transition`}
                    />
                    {touched.companyName && errors.companyName && (
                      <p className="mt-1 text-[9px] text-red-600">{errors.companyName}</p>
                    )}
                  </div>

                  <div className="col-span-1">
                    <label className={`block ${labelClass} font-medium text-gray-700`}>
                      Establishment Year <span className="text-red-500">*</span>
                    </label>
                    <input
                      name="establishment"
                      value={formData.establishment}
                      placeholder="Enter establishment year"
                      onChange={handleChange}
                      className={`w-full rounded-lg border border-gray-300 bg-white ${inputPadding} text-gray-900 placeholder-gray-500 focus:border-gray-900 focus:ring-2 focus:ring-gray-900 transition`}
                    />
                    {touched.establishment && errors.establishment && (
                      <p className="mt-1 text-[9px] text-red-600">{errors.establishment}</p>
                    )}
                  </div>

                  <div className="col-span-1">
                    <label className={`block ${labelClass} font-medium text-gray-700`}>
                      Job Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      name="jobTitle"
                      value={formData.jobTitle}
                      placeholder="Enter job title"
                      onChange={handleChange}
                      className={`w-full rounded-lg border border-gray-300 bg-white ${inputPadding} text-gray-900 placeholder-gray-500 focus:border-gray-900 focus:ring-2 focus:ring-gray-900 transition`}
                    />
                    {touched.jobTitle && errors.jobTitle && (
                      <p className="mt-1 text-[9px] text-red-600">{errors.jobTitle}</p>
                    )}
                  </div>

                  <div className="col-span-1">
                    <label className={`block ${labelClass} font-medium text-gray-700`}>
                      Department <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="department"
                      value={formData.department}
                      onChange={handleChange}
                      className={`w-full rounded-lg border border-gray-300 bg-white ${inputPadding} text-gray-900 focus:border-gray-900 focus:ring-2 focus:ring-gray-900 transition`}
                    >
                      <option value="">Select Department</option>
                      {departments.map((dep) => (
                        <option key={dep} value={dep}>
                          {dep}
                        </option>
                      ))}
                    </select>
                    {touched.department && errors.department && (
                      <p className="mt-1 text-[9px] text-red-600">{errors.department}</p>
                    )}
                  </div>

                  <div className="col-span-1">
                    <label className={`block ${labelClass} font-medium text-gray-700`}>
                      Required Qualification
                    </label>
                    <select
                      name="qualification"
                      value={formData.qualification}
                      onChange={handleChange}
                      className={`w-full rounded-lg border border-gray-300 bg-white ${inputPadding} text-gray-900 focus:border-gray-900 focus:ring-2 focus:ring-gray-900 transition`}
                    >
                      <option value="">Select Qualification</option>
                      {qualifications.map((q) => (
                        <option key={q} value={q}>
                          {q}
                        </option>
                      ))}
                    </select>
                    {touched.qualification && errors.qualification && (
                      <p className="mt-1 text-[9px] text-red-600">{errors.qualification}</p>
                    )}
                  </div>

                  <div className="col-span-1">
                    <label className={`block ${labelClass} font-medium text-gray-700`}>
                      Job Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="jobType"
                      value={formData.jobType}
                      onChange={handleChange}
                      className={`w-full rounded-lg border border-gray-300 bg-white ${inputPadding} text-gray-900 focus:border-gray-900 focus:ring-2 focus:ring-gray-900 transition`}
                    >
                      <option value="">Select Job Type</option>
                      {jobTypes.map((j) => (
                        <option key={j} value={j}>
                          {j}
                        </option>
                      ))}
                    </select>
                    {touched.jobType && errors.jobType && (
                      <p className="mt-1 text-[9px] text-red-600">{errors.jobType}</p>
                    )}
                  </div>

                  <div className="col-span-1">
                    <label className={`block ${labelClass} font-medium text-gray-700`}>
                      Location
                    </label>
                    <input
                      name="location"
                      value={formData.location}
                      placeholder="Enter location"
                      onChange={handleChange}
                      className={`w-full rounded-lg border border-gray-300 bg-white ${inputPadding} text-gray-900 placeholder-gray-500 focus:border-gray-900 focus:ring-2 focus:ring-gray-900 transition`}
                    />
                    {touched.location && errors.location && (
                      <p className="mt-1 text-[9px] text-red-600">{errors.location}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Section 2: Job Details */}
              <div className={`w-full ${isCompact ? 'bg-white' : 'bg-white rounded-xl shadow-sm border border-gray-200'} ${isCompact ? 'p-0' : 'p-3 sm:p-4 md:p-6 lg:p-8'}`}>
                <h3 className={`${sectionTitleClass} font-semibold text-gray-900`}>Job Details</h3>
                <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 ${gridGap}`}>
                  <div className="col-span-1">
                    <label className={`block ${labelClass} font-medium text-gray-700`}>
                      Job Timing
                    </label>
                    <input
                      name="jobTiming"
                      value={formData.jobTiming}
                      placeholder="e.g. 9 AM - 6 PM"
                      onChange={handleChange}
                      className={`w-full rounded-lg border border-gray-300 bg-white ${inputPadding} text-gray-900 placeholder-gray-500 focus:border-gray-900 focus:ring-2 focus:ring-gray-900 transition`}
                    />
                    {touched.jobTiming && errors.jobTiming && <p className="mt-1 text-[9px] text-red-600">{errors.jobTiming}</p>}
                  </div>

                  <div className="col-span-1">
                    <label className={`block ${labelClass} font-medium text-gray-700`}>
                      Working Days
                    </label>
                    <input
                      name="workingDays"
                      placeholder="e.g. Monday–Friday"
                      value={formData.workingDays}
                      onChange={handleChange}
                      className={`w-full rounded-lg border border-gray-300 bg-white ${inputPadding} text-gray-900 placeholder-gray-500 focus:border-gray-900 focus:ring-2 focus:ring-gray-900 transition`}
                    />
                    {touched.workingDays && errors.workingDays && <p className="mt-1 text-[9px] text-red-600">{errors.workingDays}</p>}
                  </div>

                  <div className="col-span-1 sm:col-span-2 lg:col-span-1">
                    <label className={`block ${labelClass} font-medium text-gray-700`}>
                      Salary
                    </label>
                    <div className="flex flex-col sm:flex-row gap-1.5">
                      <input
                        type="text"
                        name="salary"
                        value={formData.salary}
                        placeholder="e.g. 10,000 or 10,000 - 20,000"
                        onChange={(e) => {
                          let rawValue = e.target.value;
                          if (/^[0-9,\s-]*$/.test(rawValue)) {
                            const cleaned = rawValue.replace(/,/g, "");
                            if (cleaned.includes("-")) {
                              const [min, max] = cleaned.split("-").map((v) => v.trim());
                              const formattedMin = min && !isNaN(Number(min)) ? Number(min).toLocaleString("en-IN") : "";
                              const formattedMax = max && !isNaN(Number(max)) ? Number(max).toLocaleString("en-IN") : "";
                              rawValue = formattedMin + (cleaned.includes("-") ? " - " : "") + (formattedMax ? formattedMax : "");
                            } else {
                              rawValue = cleaned && !isNaN(Number(cleaned)) ? Number(cleaned).toLocaleString("en-IN") : "";
                            }
                            setFormData(prev => ({ ...prev, salary: rawValue }));
                            setTouched(prev => ({ ...prev, salary: true }));
                            const salaryError = validateField('salary', rawValue);
                            const salaryTypeError = validateField('salaryType', formData.salaryType);
                            setErrors(prev => ({ ...prev, salary: salaryError, salaryType: salaryTypeError }));
                          }
                        }}
                        className={`flex-1 rounded-lg border border-gray-300 bg-white ${inputPadding} text-gray-900 placeholder-gray-500 focus:border-gray-900 focus:ring-2 focus:ring-gray-900 transition`}
                      />
                      <select
                        name="salaryType"
                        value={formData.salaryType}
                        onChange={handleChange}
                        className={`${isCompact ? 'w-full sm:w-auto sm:min-w-[100px]' : 'w-full sm:w-auto sm:min-w-[120px]'} rounded-lg border border-gray-300 bg-white ${inputPadding} text-gray-900 focus:border-gray-900 focus:ring-2 focus:ring-gray-900 transition`}
                      >
                        <option value="">Select</option>
                        <option value="month">Per Month</option>
                        <option value="year">Per Year</option>
                      </select>
                    </div>
                    {touched.salary && errors.salary && (
                      <p className="mt-1 text-[9px] text-red-600">{errors.salary}</p>
                    )}
                    {touched.salaryType && errors.salaryType && (
                      <p className="mt-1 text-[9px] text-red-600">{errors.salaryType}</p>
                    )}
                  </div>

                  <div className="col-span-1">
                    <label className={`block ${labelClass} font-medium text-gray-700`}>
                      Experience
                    </label>
                    <input
                      name="experience"
                      value={formData.experience}
                      placeholder="Enter Experience"
                      onChange={handleChange}
                      className={`w-full rounded-lg border border-gray-300 bg-white ${inputPadding} text-gray-900 placeholder-gray-500 focus:border-gray-900 focus:ring-2 focus:ring-gray-900 transition`}
                    />
                    {touched.experience && errors.experience && (
                      <p className="mt-1 text-[9px] text-red-600">{errors.experience}</p>
                    )}
                  </div>

                  <div className="col-span-1">
                    <label className={`block ${labelClass} font-medium text-gray-700`}>
                      Number of Openings
                    </label>
                    <input
                      name="noOfOpenings"
                      type="number"
                      value={formData.noOfOpenings}
                      placeholder="Enter number"
                      onChange={handleChange}
                      className={`w-full rounded-lg border border-gray-300 bg-white ${inputPadding} text-gray-900 placeholder-gray-500 focus:border-gray-900 focus:ring-2 focus:ring-gray-900 transition`}
                    />
                    {touched.noOfOpenings && errors.noOfOpenings && <p className="mt-1 text-[9px] text-red-600">{errors.noOfOpenings}</p>}
                  </div>
                </div>
              </div>

              {/* Section 3: Job Description with React Quill */}
              <div className={`w-full ${isCompact ? 'bg-white' : 'bg-white rounded-xl shadow-sm border border-gray-200'} ${isCompact ? 'p-0' : 'p-3 sm:p-4 md:p-6 lg:p-8'}`}>
                <h3 className={`${sectionTitleClass} font-semibold text-gray-900`}>Job Description</h3>
                <div>
                  <label className={`block ${labelClass} font-medium text-gray-700`}>
                    Description <span className="text-red-500">*</span>
                  </label>
                  <div className="border-2 border-gray-300 rounded-lg overflow-hidden flex-1 flex flex-col relative bg-white shadow-sm hover:border-gray-900/50 transition-colors">
                    <div className={`relative quill-container flex-1 ${isCompact ? 'min-h-[200px]' : 'min-h-[300px]'}`}>
                      <QuillAny
                        theme="snow"
                        value={formData.description}
                        onChange={handleDescriptionChange}
                        ref={handleQuillRef}
                        modules={modules}
                        formats={formats}
                        placeholder="Describe the job role, responsibilities, and requirements... Select text to format with the floating toolbar."
                        className="h-full"
                        style={{ ["--ql-primary"]: "#1f2937" }}
                      />
                    </div>
                    
                    {/* Floating Toolbar */}
                    {showFloatingToolbar && (
                      <div
                        ref={floatingToolbarRef}
                        className="fixed z-[9999] bg-gray-900 text-white rounded-lg shadow-2xl flex items-center gap-0.5 p-1 pointer-events-auto"
                        style={{
                          top: `${floatingToolbarPosition.top}px`,
                          left: `${floatingToolbarPosition.left}px`,
                          transform: 'translateX(-50%)',
                          position: 'fixed',
                        }}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                      >
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            formatWithQuill("bold");
                          }}
                          className={`p-1.5 rounded hover:bg-gray-700 transition-colors ${currentFormats?.bold ? 'bg-gray-700' : ''}`}
                          title="Bold (Ctrl+B)"
                        >
                          <Bold size={12} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            formatWithQuill("italic");
                          }}
                          className={`p-1.5 rounded hover:bg-gray-700 transition-colors ${currentFormats?.italic ? 'bg-gray-700' : ''}`}
                          title="Italic (Ctrl+I)"
                        >
                          <Italic size={12} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            formatWithQuill("underline");
                          }}
                          className={`p-1.5 rounded hover:bg-gray-700 transition-colors ${currentFormats?.underline ? 'bg-gray-700' : ''}`}
                          title="Underline (Ctrl+U)"
                        >
                          <Underline size={12} />
                        </button>
                        <div className="w-px h-4 bg-gray-600 mx-0.5"></div>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            formatWithQuill("link");
                          }}
                          className={`p-1.5 rounded hover:bg-gray-700 transition-colors ${currentFormats?.link ? 'bg-gray-700' : ''}`}
                          title="Add Link"
                        >
                          <LinkIcon size={12} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            formatWithQuill("color");
                          }}
                          className="p-1.5 rounded hover:bg-gray-700 transition-colors"
                          title="Text Color"
                        >
                          <Palette size={12} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            formatWithQuill("background");
                          }}
                          className="p-1.5 rounded hover:bg-gray-700 transition-colors"
                          title="Highlight"
                        >
                          <Highlighter size={12} />
                        </button>
                        <div className="w-px h-4 bg-gray-600 mx-0.5"></div>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            formatWithQuill("align", "left");
                          }}
                          className={`p-1.5 rounded hover:bg-gray-700 transition-colors ${currentFormats?.align === 'left' ? 'bg-gray-700' : ''}`}
                          title="Align Left"
                        >
                          <AlignLeft size={12} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            formatWithQuill("align", "center");
                          }}
                          className={`p-1.5 rounded hover:bg-gray-700 transition-colors ${currentFormats?.align === 'center' ? 'bg-gray-700' : ''}`}
                          title="Align Center"
                        >
                          <AlignCenter size={12} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            formatWithQuill("align", "right");
                          }}
                          className={`p-1.5 rounded hover:bg-gray-700 transition-colors ${currentFormats?.align === 'right' ? 'bg-gray-700' : ''}`}
                          title="Align Right"
                        >
                          <AlignRight size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                  {touched.description && errors.description && <p className="mt-1 text-[9px] text-red-600">{errors.description}</p>}
                </div>
              </div>

              {/* Section 4: Additional Requirements */}
              <div className={`w-full ${isCompact ? 'bg-white' : 'bg-white rounded-xl shadow-sm border border-gray-200'} ${isCompact ? 'p-0' : 'p-3 sm:p-4 md:p-6 lg:p-8'}`}>
                <h3 className={`${sectionTitleClass} font-semibold text-gray-900`}>Additional Requirements</h3>
                <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 ${gridGap}`}>
                  <div className="col-span-1 sm:col-span-2 lg:col-span-1">
                    <label className={`block ${labelClass} font-medium text-gray-700`}>
                      Required Skills
                      <span className={`text-gray-700 ${isCompact ? 'text-[8px]' : 'text-xs'} ml-1`}>(comma separated)</span>
                    </label>
                    <input
                      name="skills"
                      value={formData.skills}
                      placeholder="e.g. Communication, Team Work, Problem Solving"
                      onChange={handleChange}
                      className={`w-full rounded-lg border border-gray-300 bg-white ${inputPadding} text-gray-900 placeholder-gray-500 focus:border-gray-900 focus:ring-2 focus:ring-gray-900 transition`}
                    />
                    {touched.skills && errors.skills && <p className="mt-1 text-[9px] text-red-600">{errors.skills}</p>}
                  </div>

                  <div className="col-span-1 sm:col-span-2 lg:col-span-1">
                    <label className={`block ${labelClass} font-medium text-gray-700`}>
                      Perks & Benefits
                      <span className={`text-gray-700 ${isCompact ? 'text-[8px]' : 'text-xs'} ml-1`}>(comma separated)</span>
                    </label>
                    <input
                      name="perks"
                      value={formData.perks}
                      placeholder="e.g. Health Insurance, Paid Leave, Training"
                      onChange={handleChange}
                      className={`w-full rounded-lg border border-gray-300 bg-white ${inputPadding} text-gray-900 placeholder-gray-500 focus:border-gray-900 focus:ring-2 focus:ring-gray-900 transition`}
                    />
                    {touched.perks && errors.perks && <p className="mt-1 text-[9px] text-red-600">{errors.perks}</p>}
                  </div>

                  <div className="col-span-1 sm:col-span-2 lg:col-span-1">
                    <label className={`block ${labelClass} font-medium text-gray-700`}>
                      Preferred Languages
                      <span className={`text-gray-700 ${isCompact ? 'text-[8px]' : 'text-xs'} ml-1`}>(comma separated)</span>
                    </label>
                    <input
                      name="languagesPreferred"
                      value={formData.languagesPreferred}
                      placeholder="e.g. English, Hindi, Local Language"
                      onChange={handleChange}
                      className={`w-full rounded-lg border border-gray-300 bg-white ${inputPadding} text-gray-900 placeholder-gray-500 focus:border-gray-900 focus:ring-2 focus:ring-gray-900 transition`}
                    />
                    {touched.languagesPreferred && errors.languagesPreferred && <p className="mt-1 text-[9px] text-red-600">{errors.languagesPreferred}</p>}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className={`flex items-center justify-between pt-3 border-t border-gray-200 ${isCompact ? 'mt-3' : 'mt-4 sm:mt-6'}`}>
            <button
              onClick={goBack}
              disabled={currentStep === 0}
              className={`px-3 py-1.5 ${isCompact ? 'text-xs' : 'text-sm sm:text-base'} rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
            >
              Back
            </button>
            {currentStep < sectionFields.length - 1 ? (
              <button
                onClick={goNext}
                className={`bg-gray-900 text-white ${isCompact ? 'px-4 py-1.5 text-xs' : 'px-4 sm:px-6 md:px-8 py-2 sm:py-3 text-sm sm:text-base'} rounded-lg hover:bg-gray-800 transition-colors font-medium`}
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                className={`bg-gray-900 text-white ${isCompact ? 'px-4 py-1.5 text-xs' : 'px-4 sm:px-6 md:px-8 py-2 sm:py-3 text-sm sm:text-base'} rounded-lg hover:bg-gray-800 transition-colors font-medium`}
              >
                Review & Submit
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal - Compact */}
      {showConfirmModal && (
        <div className="fixed inset-0 backdrop-blur-md bg-black/50 flex items-center justify-center z-50 p-2">
          <div className={`bg-white rounded-lg shadow-2xl ${isCompact ? 'max-w-lg' : 'max-w-xl'} w-full max-h-[90vh] overflow-y-auto border border-gray-200`}>
            <div className={isCompact ? "p-3" : "p-4"}>
              <div className={`flex items-center justify-between ${isCompact ? 'mb-3' : 'mb-4'}`}>
                <div className="flex items-center gap-1.5">
                  <div className={`${isCompact ? 'w-6 h-6' : 'w-8 h-8'} bg-orange-100 rounded-md flex items-center justify-center`}>
                    <svg className={`${isCompact ? 'w-3 h-3' : 'w-4 h-4'} text-orange-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className={`${isCompact ? 'text-sm' : 'text-base'} font-bold text-gray-900`}>Confirm Job Posting</h3>
                    <p className={`${isCompact ? 'text-[9px]' : 'text-[10px]'} text-gray-700`}>Please review your job details before posting</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="text-gray-400 hover:text-gray-700 transition-colors p-1 rounded hover:bg-gray-100"
                >
                  <svg className={`${isCompact ? 'w-3 h-3' : 'w-4 h-4'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className={`${isCompact ? 'space-y-1.5 mb-3' : 'space-y-2 mb-4'}`}>
                <div className={`grid grid-cols-1 sm:grid-cols-2 ${isCompact ? 'gap-1.5' : 'gap-2'}`}>
                  <div className={`bg-gray-50 ${isCompact ? 'p-1.5' : 'p-2'} rounded-md border border-gray-200`}>
                    <label className="text-[9px] font-bold text-gray-700 uppercase tracking-wide">Company Name</label>
                    <p className={`${isCompact ? 'text-[10px]' : 'text-[11px]'} font-semibold text-gray-900 mt-0.5`}>{formData.companyName || 'Not specified'}</p>
                  </div>
                  <div className={`bg-gray-50 ${isCompact ? 'p-1.5' : 'p-2'} rounded-md border border-gray-200`}>
                    <label className="text-[9px] font-bold text-gray-700 uppercase tracking-wide">Job Title</label>
                    <p className={`${isCompact ? 'text-[10px]' : 'text-[11px]'} font-semibold text-gray-900 mt-0.5`}>{formData.jobTitle || 'Not specified'}</p>
                  </div>
                  <div className={`bg-gray-50 ${isCompact ? 'p-1.5' : 'p-2'} rounded-md border border-gray-200`}>
                    <label className="text-[9px] font-bold text-gray-700 uppercase tracking-wide">Department</label>
                    <p className={`${isCompact ? 'text-[10px]' : 'text-[11px]'} font-semibold text-gray-900 mt-0.5`}>{formData.department || 'Not specified'}</p>
                  </div>
                  <div className={`bg-gray-50 ${isCompact ? 'p-1.5' : 'p-2'} rounded-md border border-gray-200`}>
                    <label className="text-[9px] font-bold text-gray-700 uppercase tracking-wide">Job Type</label>
                    <p className={`${isCompact ? 'text-[10px]' : 'text-[11px]'} font-semibold text-gray-900 mt-0.5`}>{formData.jobType || 'Not specified'}</p>
                  </div>
                  <div className={`bg-gray-50 ${isCompact ? 'p-1.5' : 'p-2'} rounded-md border border-gray-200`}>
                    <label className="text-[9px] font-bold text-gray-700 uppercase tracking-wide">Salary</label>
                    <p className={`${isCompact ? 'text-[10px]' : 'text-[11px]'} font-semibold text-gray-900 mt-0.5`}>{formData.salary || 'Not specified'}</p>
                  </div>
                  <div className={`bg-gray-50 ${isCompact ? 'p-1.5' : 'p-2'} rounded-md border border-gray-200`}>
                    <label className="text-[9px] font-bold text-gray-700 uppercase tracking-wide">Experience</label>
                    <p className={`${isCompact ? 'text-[10px]' : 'text-[11px]'} font-semibold text-gray-900 mt-0.5`}>{formData.experience || 'Not specified'}</p>
                  </div>
                </div>

                {formData.description && (
                  <div className={`bg-gray-50 ${isCompact ? 'p-1.5' : 'p-2'} rounded-md border border-gray-200`}>
                    <label className="text-[9px] font-bold text-gray-700 uppercase tracking-wide">Job Description</label>
                    <div className={`${isCompact ? 'text-[10px]' : 'text-[11px]'} text-gray-900 mt-0.5 prose max-w-none line-clamp-3`} dangerouslySetInnerHTML={{ __html: formData.description }} />
                  </div>
                )}
              </div>

              <div className={`flex flex-col sm:flex-row ${isCompact ? 'gap-1.5' : 'gap-2'} justify-end`}>
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className={`${isCompact ? 'px-2.5 py-1 text-[9px]' : 'px-3 py-1.5 text-[10px]'} text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-all duration-200 font-medium border border-gray-200`}
                >
                  Go Back & Edit
                </button>
                <button
                  onClick={confirmSubmit}
                  disabled={isSubmitting}
                  className={`${isCompact ? 'px-3 py-1 text-[9px]' : 'px-4 py-1.5 text-[10px]'} bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 shadow-lg`}
                >
                  {isSubmitting ? (
                    <>
                      <svg className={`animate-spin ${isCompact ? 'h-2.5 w-2.5' : 'h-3 w-3'} text-white`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Posting Job...
                    </>
                  ) : (
                    "Confirm & Post Job"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobPostingForm;
export type { JobFormData };
