// src/features/proyectos/components/NuevoProyectoForm.tsx

import React, { useState } from 'react';
import type { ProjectType } from '../types/proyectosTypes';

interface NuevoProyectoFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const BOLIVIAN_CITIES = [
  'La Paz',
  'El Alto',
  'Cochabamba',
  'Santa Cruz de la Sierra',
  'Oruro',
  'Potosí',
  'Sucre',
  'Tarija',
  'Trinidad',
  'Cobija',
  'Riberalta',
];

const PROJECT_TYPES: { value: ProjectType; label: string; icon: string }[] = [
  { value: 'casa', label: 'Casa', icon: 'home' },
  { value: 'edificio', label: 'Edificio', icon: 'apartment' },
  { value: 'remodelacion', label: 'Remodelación', icon: 'home_repair_service' },
  { value: 'comercial', label: 'Comercial', icon: 'store' },
  { value: 'otro', label: 'Otro', icon: 'construction' },
];

interface FormState {
  title: string;
  type: ProjectType;
  description: string;
  city: string;
  budget_min: string;
  budget_max: string;
  needs_maestro: boolean;
  needs_materials: boolean;
}

interface FormErrors {
  title?: string;
  description?: string;
  city?: string;
  budget_min?: string;
  budget_max?: string;
}

const INITIAL_STATE: FormState = {
  title: '',
  type: 'casa',
  description: '',
  city: '',
  budget_min: '',
  budget_max: '',
  needs_maestro: false,
  needs_materials: false,
};

export function NuevoProyectoForm({ onSuccess, onCancel }: NuevoProyectoFormProps) {
  const [form, setForm] = useState<FormState>(INITIAL_STATE);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  function validate(): FormErrors {
    const errs: FormErrors = {};
    if (!form.title.trim()) errs.title = 'El título es requerido.';
    if (form.description.trim().length < 20)
      errs.description = 'La descripción debe tener al menos 20 caracteres.';
    if (!form.city) errs.city = 'Selecciona una ciudad.';
    const min = Number(form.budget_min);
    const max = Number(form.budget_max);
    if (!form.budget_min || isNaN(min) || min <= 0)
      errs.budget_min = 'Ingresa un presupuesto mínimo válido.';
    if (!form.budget_max || isNaN(max) || max <= 0)
      errs.budget_max = 'Ingresa un presupuesto máximo válido.';
    else if (!errs.budget_min && max < min)
      errs.budget_max = 'El máximo debe ser mayor o igual al mínimo.';
    return errs;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      onSuccess();
    }, 500);
  }

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (key in errors) setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 pt-6 pb-4 border-b border-outline-variant">
        <h1 className="font-headline text-xl text-on-surface">Nuevo proyecto</h1>
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center justify-center w-9 h-9 rounded-full text-on-surface-variant hover:bg-surface-container transition-colors"
          aria-label="Cerrar"
        >
          <span className="material-symbols-outlined text-lg">close</span>
        </button>
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex-1 overflow-y-auto px-4 py-5 flex flex-col gap-5"
        noValidate
      >
        <div className="flex flex-col gap-1.5">
          <label htmlFor="proj-title" className="text-sm font-label text-on-surface">
            Título del proyecto
          </label>
          <input
            id="proj-title"
            type="text"
            value={form.title}
            onChange={(e) => setField('title', e.target.value)}
            placeholder="Ej: Casa familiar 3 dormitorios"
            className="rounded-lg border border-outline-variant bg-surface-container px-3 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary"
          />
          {errors.title && (
            <p className="text-xs text-on-error-container">{errors.title}</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-label text-on-surface">Tipo de proyecto</span>
          <div className="flex gap-2 flex-wrap">
            {PROJECT_TYPES.map(({ value, label, icon }) => {
              const active = form.type === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setField('type', value)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-label border transition-colors ${
                    active
                      ? 'bg-primary text-on-primary border-primary'
                      : 'bg-surface-container text-on-surface-variant border-outline-variant'
                  }`}
                >
                  <span className="material-symbols-outlined text-sm leading-none">{icon}</span>
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="proj-desc" className="text-sm font-label text-on-surface">
            Descripción
          </label>
          <textarea
            id="proj-desc"
            rows={4}
            value={form.description}
            onChange={(e) => setField('description', e.target.value)}
            placeholder="Describe el proyecto con detalles relevantes (mínimo 20 caracteres)"
            className="rounded-lg border border-outline-variant bg-surface-container px-3 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          />
          {errors.description && (
            <p className="text-xs text-on-error-container">{errors.description}</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="proj-city" className="text-sm font-label text-on-surface">
            Ciudad
          </label>
          <select
            id="proj-city"
            value={form.city}
            onChange={(e) => setField('city', e.target.value)}
            className="rounded-lg border border-outline-variant bg-surface-container px-3 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Selecciona una ciudad</option>
            {BOLIVIAN_CITIES.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
          {errors.city && (
            <p className="text-xs text-on-error-container">{errors.city}</p>
          )}
        </div>

        <div className="flex gap-3">
          <div className="flex-1 flex flex-col gap-1.5">
            <label htmlFor="proj-budget-min" className="text-sm font-label text-on-surface">
              Presupuesto mínimo
            </label>
            <div className="flex rounded-lg border border-outline-variant bg-surface-container overflow-hidden focus-within:ring-2 focus-within:ring-primary">
              <span className="flex items-center px-3 text-sm font-label text-on-surface-variant border-r border-outline-variant bg-surface-container">
                Bs
              </span>
              <input
                id="proj-budget-min"
                type="number"
                min={0}
                value={form.budget_min}
                onChange={(e) => setField('budget_min', e.target.value)}
                placeholder="0"
                className="flex-1 px-3 py-2.5 text-sm text-on-surface bg-transparent focus:outline-none"
              />
            </div>
            {errors.budget_min && (
              <p className="text-xs text-on-error-container">{errors.budget_min}</p>
            )}
          </div>

          <div className="flex-1 flex flex-col gap-1.5">
            <label htmlFor="proj-budget-max" className="text-sm font-label text-on-surface">
              Presupuesto máximo
            </label>
            <div className="flex rounded-lg border border-outline-variant bg-surface-container overflow-hidden focus-within:ring-2 focus-within:ring-primary">
              <span className="flex items-center px-3 text-sm font-label text-on-surface-variant border-r border-outline-variant bg-surface-container">
                Bs
              </span>
              <input
                id="proj-budget-max"
                type="number"
                min={0}
                value={form.budget_max}
                onChange={(e) => setField('budget_max', e.target.value)}
                placeholder="0"
                className="flex-1 px-3 py-2.5 text-sm text-on-surface bg-transparent focus:outline-none"
              />
            </div>
            {errors.budget_max && (
              <p className="text-xs text-on-error-container">{errors.budget_max}</p>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <span className="text-sm font-label text-on-surface">Necesidades del proyecto</span>
          <label className="flex items-center justify-between gap-3 cursor-pointer">
            <div className="flex items-center gap-2 text-on-surface">
              <span className="material-symbols-outlined text-lg text-on-surface-variant">engineering</span>
              <span className="text-sm">Necesita maestro</span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={form.needs_maestro}
              onClick={() => setField('needs_maestro', !form.needs_maestro)}
              className={`relative w-11 h-6 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary ${
                form.needs_maestro ? 'bg-primary' : 'bg-surface-container border border-outline-variant'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                  form.needs_maestro ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </label>

          <label className="flex items-center justify-between gap-3 cursor-pointer">
            <div className="flex items-center gap-2 text-on-surface">
              <span className="material-symbols-outlined text-lg text-on-surface-variant">inventory_2</span>
              <span className="text-sm">Necesita materiales</span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={form.needs_materials}
              onClick={() => setField('needs_materials', !form.needs_materials)}
              className={`relative w-11 h-6 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary ${
                form.needs_materials ? 'bg-primary' : 'bg-surface-container border border-outline-variant'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                  form.needs_materials ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </label>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-2 w-full rounded-xl bg-primary text-on-primary font-label font-semibold py-3 text-sm transition-opacity disabled:opacity-60"
        >
          {isSubmitting ? 'Publicando...' : 'Publicar proyecto'}
        </button>
      </form>
    </div>
  );
}
