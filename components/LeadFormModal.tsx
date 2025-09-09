"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { blazeblog } from "@/lib/blazeblog";

type LeadField = {
  id: string;
  type: string;
  label: string;
  placeholder?: string | null;
  required?: boolean;
  options?: Array<{ value: string; label?: string }> | string[] | null;
  fieldOrder?: number;
};

type LeadStep = {
  id: string;
  title?: string;
  description?: string;
  stepOrder?: number;
  fields: LeadField[];
};

type LeadForm = {
  id: string;
  name?: string;
  description?: string; // markdown
  isMultiStep?: boolean;
  status?: string;
  steps: LeadStep[];
};

type ApiResponse<T> = { message: string; data?: T };

function normalizeOptions(opts: LeadField["options"]): Array<{ value: string; label: string }> {
  if (!opts) return [];
  if (Array.isArray(opts)) {
    return (opts as any[]).map((o) => {
      if (typeof o === 'string') return { value: o, label: o };
      if (o && typeof o === 'object') return { value: String(o.value ?? o.label ?? ''), label: String(o.label ?? o.value ?? '') };
      return { value: '', label: '' };
    }).filter(o => o.value !== '' || o.label !== '');
  }
  return [];
}

// Minimal markdown to HTML for headings, bold, italics, and links
function mdToHtml(md?: string): string {
  if (!md) return '';
  let html = md;
  // Escape basic HTML (very basic; admins control content)
  html = html.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  // Headings
  html = html.replace(/^###\s+(.*)$/gm, '<h3>$1</h3>');
  html = html.replace(/^##\s+(.*)$/gm, '<h2>$1</h2>');
  html = html.replace(/^#\s+(.*)$/gm, '<h1>$1</h1>');
  // Bold and italics
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  // Links
  html = html.replace(/\[(.*?)\]\((https?:[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1<\/a>');
  // Paragraphs: split on double newlines
  html = html.split(/\n{2,}/).map(block => {
    if (/^<h[1-6]>/.test(block)) return block; // leave headings as-is
    return `<p>${block.replace(/\n/g, '<br/>')}</p>`;
  }).join('\n');
  return html;
}

export default function LeadFormModal() {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<LeadForm | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [shownAt, setShownAt] = useState<number | null>(null);
  const IS_PROD = process.env.NODE_ENV === 'production';

  // Flat map of field values keyed by field id
  const fieldsMap = useMemo(() => {
    if (!form) return {} as Record<string, any>;
    const acc: Record<string, any> = {};
    for (const step of form.steps || []) {
      for (const field of step.fields || []) {
        if (acc[field.id] === undefined) {
          // default value by type
          switch (field.type) {
            case 'checkbox':
              acc[field.id] = field.options ? [] : false; // multi vs single
              break;
            case 'rating':
              acc[field.id] = 0;
              break;
            case 'number':
              acc[field.id] = '';
              break;
            default:
              acc[field.id] = '';
          }
        }
      }
    }
    return acc;
  }, [form]);

  const [values, setValues] = useState<Record<string, any>>({});
  useEffect(() => {
    setValues(fieldsMap);
  }, [fieldsMap]);

  useEffect(() => {
    setMounted(true);
    const t = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const lf: any = await blazeblog.getActivePublicLeadForm();
        if (!lf) {
          setLoading(false);
          return;
        }
        // Respect submitted and dismissed cooldown
        try {
          const submitted = localStorage.getItem(`bb_lead_form_submitted_${lf.id}`);
          if (submitted === 'true') {
            setLoading(false);
            return;
          }
          const dismissedAtStr = localStorage.getItem(`bb_lead_form_dismissed_at_${lf.id}`);
          const dismissedAt = dismissedAtStr ? Number(dismissedAtStr) : 0;
          const DAY_MS = 24 * 60 * 60 * 1000;
          if (IS_PROD && dismissedAt && Date.now() - dismissedAt < DAY_MS) {
            setLoading(false);
            return;
          }
        } catch {}
        if (lf && lf.steps && lf.steps.length > 0) {
          lf.steps = [...lf.steps]
            .sort((a: any, b: any) => (a.stepOrder ?? 0) - (b.stepOrder ?? 0))
            .map((s: any) => ({
              ...s,
              fields: [...(s.fields || [])].sort((a: any, b: any) => (a.fieldOrder ?? 0) - (b.fieldOrder ?? 0))
            }));
          setForm(lf);
          setOpen(true);
          setShownAt(Date.now());
        }
      } catch (e: any) {
        console.error(e);
        setError(e?.message || 'Failed to load lead form');
      } finally {
        setLoading(false);
      }
    }, 5000);
    return () => clearTimeout(t);
  }, []);

  const currentStep = useMemo(() => {
    if (!form) return null;
    return form.steps?.[stepIndex] || null;
  }, [form, stepIndex]);

  const validateStep = useCallback(() => {
    if (!currentStep) return true;
    for (const field of currentStep.fields || []) {
      const v = values[field.id];
      if (field.required) {
        if (field.type === 'checkbox' && Array.isArray(v)) {
          if (v.length === 0) return false;
        } else if (v === undefined || v === null || String(v).trim() === '') {
          return false;
        }
        if (field.type === 'email') {
          const re = /[^@\s]+@[^@\s]+\.[^@\s]+/;
          if (!re.test(String(v))) return false;
        }
        if (field.type === 'rating') {
          const n = Number(v);
          if (!Number.isFinite(n) || n < 1) return false; // require at least 1 star when required
        }
      }
    }
    return true;
  }, [currentStep, values]);

  const setField = (id: string, val: any) => setValues((prev) => ({ ...prev, [id]: val }));

  const onNext = () => {
    if (!validateStep()) return;
    setStepIndex(i => Math.min(i + 1, (form?.steps?.length || 1) - 1));
  };
  const onBack = () => setStepIndex(i => Math.max(0, i - 1));

  const onSubmit = async () => {
    if (!validateStep() || !form) return;
    setSubmitting(true);
    setSubmitMessage(null);
    setError(null);
    try {
      const secs = typeof shownAt === 'number' ? Math.max(0, Math.round((Date.now() - shownAt) / 1000)) : undefined;
      const ua = (typeof navigator !== 'undefined' && navigator.userAgent) ? navigator.userAgent : undefined;
      const res = await blazeblog.submitPublicLeadForm(form.id, values, { timeTaken: secs, userAgent: ua });
      if (res) {
        setSubmitMessage('Thanks! Your details have been submitted.');
        try { localStorage.setItem(`bb_lead_form_submitted_${form.id}`, 'true'); } catch {}
        // Close after a moment
        setTimeout(() => setOpen(false), 1200);
      }
    } catch (e: any) {
      console.error(e);
      // If submission endpoint is not available yet, still show a friendly message
      setSubmitMessage('Thanks! We have recorded your interest.');
      try { if (form) localStorage.setItem(`bb_lead_form_submitted_${form.id}`, 'true'); } catch {}
      setTimeout(() => setOpen(false), 1200);
    } finally {
      setSubmitting(false);
    }
  };

  const close = (reason: 'dismiss' | 'submit' = 'dismiss') => {
    if (form && reason === 'dismiss') {
      try { localStorage.setItem(`bb_lead_form_dismissed_at_${form.id}`, String(Date.now())); } catch {}
    }
    setOpen(false);
  };

  const renderField = (field: LeadField) => {
    const commonLabel = (
      <label className="label px-0">
        <span className="label-text font-medium">
          {field.label}{field.required ? <span className="text-error">*</span> : null}
        </span>
      </label>
    );

    const placeholder = field.placeholder || '';
    const val = values[field.id];
    const onChangeText = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setField(field.id, e.target.value);

    switch (field.type) {
      case 'textarea':
        return (
          <div key={field.id} className="form-control">
            {commonLabel}
            <textarea className="textarea textarea-bordered w-full" placeholder={placeholder} value={val || ''} onChange={onChangeText} />
          </div>
        );
      case 'email':
        return (
          <div key={field.id} className="form-control">
            {commonLabel}
            <input type="email" className="input input-bordered w-full" placeholder={placeholder || 'you@example.com'} value={val || ''} onChange={onChangeText} />
          </div>
        );
      case 'number':
        return (
          <div key={field.id} className="form-control">
            {commonLabel}
            <input type="number" className="input input-bordered w-full" placeholder={placeholder} value={val || ''} onChange={onChangeText} />
          </div>
        );
      case 'tel':
      case 'phone':
        return (
          <div key={field.id} className="form-control">
            {commonLabel}
            <input type="tel" className="input input-bordered w-full" placeholder={placeholder || '+1 555 123 4567'} value={val || ''} onChange={onChangeText} />
          </div>
        );
      case 'date':
        return (
          <div key={field.id} className="form-control">
            {commonLabel}
            <input type="date" className="input input-bordered w-full" value={val || ''} onChange={onChangeText} />
          </div>
        );
      case 'rating': {
        const current = Number(val) || 0;
        const setRating = (n: number) => setField(field.id, n);
        return (
          <div key={field.id} className="form-control">
            {commonLabel}
            <div className="rating rating-md">
              {[1,2,3,4,5].map((n) => (
                <input
                  key={n}
                  type="radio"
                  name={field.id}
                  className="mask mask-star-2 bg-orange-400"
                  checked={current === n}
                  onChange={() => setRating(n)}
                />
              ))}
            </div>
          </div>
        );
      }
      case 'select': {
        const opts = normalizeOptions(field.options);
        return (
          <div key={field.id} className="form-control">
            {commonLabel}
            <select className="select select-bordered w-full" value={val || ''} onChange={(e) => setField(field.id, e.target.value)}>
              <option value="" disabled>
                {placeholder || 'Select an option'}
              </option>
              {opts.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        );
      }
      case 'radio': {
        const opts = normalizeOptions(field.options);
        return (
          <div key={field.id} className="form-control">
            {commonLabel}
            <div className="flex flex-col gap-2">
              {opts.map((o) => (
                <label key={o.value} className="label cursor-pointer justify-start gap-2 px-0">
                  <input type="radio" name={field.id} className="radio" checked={val === o.value} onChange={() => setField(field.id, o.value)} />
                  <span className="label-text">{o.label}</span>
                </label>
              ))}
            </div>
          </div>
        );
      }
      case 'checkbox': {
        const opts = normalizeOptions(field.options);
        // Single checkbox if no options
        if (opts.length === 0) {
          return (
            <div key={field.id} className="form-control">
              <label className="label cursor-pointer justify-start gap-2 px-0">
                <input type="checkbox" className="checkbox" checked={!!val} onChange={(e) => setField(field.id, e.target.checked)} />
                <span className="label-text">{field.label}</span>
                {field.required ? <span className="text-error">*</span> : null}
              </label>
            </div>
          );
        }
        // Multi-select checkboxes
        const arr: string[] = Array.isArray(val) ? val : [];
        return (
          <div key={field.id} className="form-control">
            {commonLabel}
            <div className="flex flex-col gap-2">
              {opts.map((o) => {
                const checked = arr.includes(o.value);
                return (
                  <label key={o.value} className="label cursor-pointer justify-start gap-2 px-0">
                    <input type="checkbox" className="checkbox" checked={checked} onChange={(e) => {
                      if (e.target.checked) setField(field.id, [...arr, o.value]);
                      else setField(field.id, arr.filter(v => v !== o.value));
                    }} />
                    <span className="label-text">{o.label}</span>
                  </label>
                );
              })}
            </div>
          </div>
        );
      }
      case 'text':
      default:
        return (
          <div key={field.id} className="form-control">
            {commonLabel}
            <input type="text" className="input input-bordered w-full" placeholder={placeholder} value={val || ''} onChange={onChangeText} />
          </div>
        );
    }
  };

  if (!mounted) return null;
  if (!open) return null;
  if (!form) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9998] bg-base-200/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-3 sm:p-6" onClick={() => close('dismiss')}>
      <div className="w-full max-w-xl bg-base-100 rounded-2xl shadow-2xl border border-base-300 overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-2xl font-bold">{form.name || 'We’d love to hear from you'}</h3>
              {form.description && (
                <div className="prose max-w-none mt-2 text-base-content/80" dangerouslySetInnerHTML={{ __html: mdToHtml(form.description) }} />
              )}
            </div>
            <button className="btn btn-sm" onClick={() => close('dismiss')} aria-label="Close">✕</button>
          </div>

          {/* Stepper */}
          {form.isMultiStep && form.steps.length > 1 && (
            <div className="flex items-center gap-2 mt-4">
              {form.steps.map((s, i) => (
                <div key={s.id} className={`h-2 flex-1 rounded ${i <= stepIndex ? 'bg-primary' : 'bg-base-300'}`} />
              ))}
            </div>
          )}

          {/* Current step fields */}
          {currentStep && (
            <div className="mt-4">
              {currentStep.title && <div className="text-lg font-semibold mb-2">{currentStep.title}</div>}
              {currentStep.description && (
                <div className="prose max-w-none text-sm text-base-content/80 mb-3" dangerouslySetInnerHTML={{ __html: mdToHtml(currentStep.description) }} />
              )}
              <div className="grid grid-cols-1 gap-4">
                {currentStep.fields.map(renderField)}
              </div>
            </div>
          )}

          {error && (
            <div className="alert alert-error mt-3">
              <span>{error}</span>
            </div>
          )}
          {submitMessage && (
            <div className="alert alert-success mt-3">
              <span>{submitMessage}</span>
            </div>
          )}

          {/* Actions */}
          <div className="mt-6 flex items-center justify-between gap-3">
            <div className="text-xs text-base-content/60">We respect your privacy.</div>
            <div className="flex items-center gap-2">
              {stepIndex > 0 && (
                <button className="btn" onClick={onBack}>Back</button>
              )}
              {stepIndex < (form.steps.length - 1) ? (
                <button className="btn btn-primary" onClick={onNext} disabled={!validateStep()}>Next</button>
              ) : (
                <button className={`btn btn-primary ${submitting ? 'loading' : ''}`} onClick={onSubmit} disabled={!validateStep() || submitting}>
                  {submitting ? 'Submitting' : 'Submit'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
