import React, { useId } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export function Input({ label, error, hint, className = '', id, ...rest }: InputProps) {
  const generatedId = useId();
  const inputId = id || generatedId;

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-[#26332E]">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`w-full min-h-[44px] rounded-[12px] border bg-white px-3.5 py-2.5 text-sm text-[#26332E] placeholder:text-[#78847D] transition-colors focus:outline-none focus:ring-2 focus:ring-[#173F35]/20 ${
          error
            ? 'border-[#C94D4D] focus:border-[#C94D4D]'
            : 'border-[#E4E7E1] focus:border-[#173F35]'
        } ${className}`}
        {...rest}
      />
      {error && <p className="text-xs font-medium text-[#C94D4D]">{error}</p>}
      {!error && hint && <p className="text-xs text-[#78847D]">{hint}</p>}
    </div>
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export function Select({ label, error, className = '', id, children, ...rest }: SelectProps) {
  const generatedId = useId();
  const selectId = id || generatedId;

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label htmlFor={selectId} className="text-sm font-medium text-[#26332E]">
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={`w-full min-h-[44px] rounded-[12px] border bg-white px-3.5 py-2.5 text-sm text-[#26332E] transition-colors focus:outline-none focus:ring-2 focus:ring-[#173F35]/20 ${
          error
            ? 'border-[#C94D4D] focus:border-[#C94D4D]'
            : 'border-[#E4E7E1] focus:border-[#173F35]'
        } ${className}`}
        {...rest}
      >
        {children}
      </select>
      {error && <p className="text-xs font-medium text-[#C94D4D]">{error}</p>}
    </div>
  );
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function Textarea({ label, error, className = '', id, ...rest }: TextareaProps) {
  const generatedId = useId();
  const textareaId = id || generatedId;

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label htmlFor={textareaId} className="text-sm font-medium text-[#26332E]">
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        className={`w-full rounded-[12px] border bg-white px-3.5 py-2.5 text-sm text-[#26332E] placeholder:text-[#78847D] transition-colors focus:outline-none focus:ring-2 focus:ring-[#173F35]/20 ${
          error
            ? 'border-[#C94D4D] focus:border-[#C94D4D]'
            : 'border-[#E4E7E1] focus:border-[#173F35]'
        } ${className}`}
        {...rest}
      />
      {error && <p className="text-xs font-medium text-[#C94D4D]">{error}</p>}
    </div>
  );
}
