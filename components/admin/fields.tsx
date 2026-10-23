"use client";

import { useId } from "react";
import { WarningCircleIcon } from "@phosphor-icons/react";

type FieldProps = {
  label: string;
  name: string;
  error?: string;
  help?: React.ReactNode;
  required?: boolean;
  className?: string;
  children: (props: { id: string; name: string; "aria-invalid"?: boolean; "aria-describedby"?: string }) => React.ReactNode;
};

/** Label above, control, help text, error below. Wires ids and aria attributes. */
export function Field({ label, name, error, help, required, className, children }: FieldProps) {
  const id = useId();
  const helpId = `${id}-help`;
  const errorId = `${id}-error`;
  const describedBy = [help ? helpId : null, error ? errorId : null].filter(Boolean).join(" ") || undefined;
  return (
    <div className={`grid content-start gap-1.5 ${className ?? ""}`}>
      <label htmlFor={id} className="a-label">
        {label}
        {required && <span className="ml-1 text-smoke">(required)</span>}
      </label>
      {children({ id, name, "aria-invalid": error ? true : undefined, "aria-describedby": describedBy })}
      {help && (
        <p id={helpId} className="a-help">
          {help}
        </p>
      )}
      {error && (
        <p id={errorId} className="flex items-center gap-1.5 text-xs text-[#ff9aa6]">
          <WarningCircleIcon size={14} aria-hidden className="shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}

type InputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "name"> & {
  label: string;
  name: string;
  error?: string;
  help?: React.ReactNode;
  wrapperClassName?: string;
};

export function TextField({ label, name, error, help, required, wrapperClassName, ...rest }: InputProps) {
  return (
    <Field label={label} name={name} error={error} help={help} required={required} className={wrapperClassName}>
      {(p) => <input {...p} {...rest} required={required} className={`a-input ${rest.className ?? ""}`} />}
    </Field>
  );
}

type AreaProps = Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "name"> & {
  label: string;
  name: string;
  error?: string;
  help?: React.ReactNode;
  wrapperClassName?: string;
};

export function TextAreaField({ label, name, error, help, required, wrapperClassName, ...rest }: AreaProps) {
  return (
    <Field label={label} name={name} error={error} help={help} required={required} className={wrapperClassName}>
      {(p) => <textarea {...p} {...rest} required={required} className={`a-input resize-y ${rest.className ?? ""}`} />}
    </Field>
  );
}

type SelectProps = Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "name"> & {
  label: string;
  name: string;
  error?: string;
  help?: React.ReactNode;
  options: { value: string; label: string }[];
  wrapperClassName?: string;
};

export function SelectField({ label, name, error, help, options, required, wrapperClassName, ...rest }: SelectProps) {
  return (
    <Field label={label} name={name} error={error} help={help} required={required} className={wrapperClassName}>
      {(p) => (
        <select {...p} {...rest} required={required} className="a-input">
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      )}
    </Field>
  );
}

/** Accessible switch built on a real checkbox, so it submits with the form. */
export function Toggle({
  label,
  name,
  defaultChecked,
  checked,
  onChange,
  help,
  disabled,
}: {
  label: string;
  name: string;
  defaultChecked?: boolean;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  help?: string;
  disabled?: boolean;
}) {
  const id = useId();
  return (
    <div className="flex items-start gap-3">
      <span className="relative mt-0.5 inline-flex shrink-0">
        <input
          id={id}
          type="checkbox"
          name={name}
          defaultChecked={defaultChecked}
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange?.(e.target.checked)}
          aria-describedby={help ? `${id}-help` : undefined}
          className="peer absolute inset-0 z-10 cursor-pointer opacity-0 disabled:cursor-not-allowed"
        />
        <span className="h-5 w-9 border border-line bg-night transition-colors peer-checked:border-violet peer-checked:bg-violet peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-violet peer-disabled:opacity-50" />
        <span className="pointer-events-none absolute top-1 left-1 size-3 bg-smoke transition-[translate,background-color] duration-200 peer-checked:translate-x-4 peer-checked:bg-night" />
      </span>
      <span className="grid gap-0.5">
        <label htmlFor={id} className="a-label cursor-pointer">
          {label}
        </label>
        {help && (
          <span id={`${id}-help`} className="a-help">
            {help}
          </span>
        )}
      </span>
    </div>
  );
}

export function FormSection({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-5 border-t border-line pt-6 first:border-t-0 first:pt-0 lg:grid-cols-[14rem_1fr] lg:gap-10">
      <div>
        <h2 className="text-sm font-semibold">{title}</h2>
        {description && <p className="a-help mt-1 max-w-[30ch]">{description}</p>}
      </div>
      <div className="grid gap-5">{children}</div>
    </section>
  );
}

export function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="flex items-center gap-2 border border-[#5c2a33] bg-[#1d0f13] px-3 py-2 text-sm text-[#ff9aa6]">
      <WarningCircleIcon size={16} aria-hidden className="shrink-0" />
      {message}
    </p>
  );
}
