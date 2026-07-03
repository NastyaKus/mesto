type FieldProps = {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  defaultValue?: string;
  required?: boolean;
  errors?: string[];
};

// Поле ввода с подписью и выводом ошибок валидации.
export function Field({
  label,
  name,
  type = "text",
  placeholder,
  defaultValue,
  required,
  errors,
}: FieldProps) {
  return (
    <label className="mb-3 block">
      <span className="mb-1 block text-sm font-medium text-muted">{label}</span>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        defaultValue={defaultValue}
        required={required}
        className="input"
      />
      {errors?.map((e) => (
        <span key={e} className="mt-1 block text-xs text-red-500">
          {e}
        </span>
      ))}
    </label>
  );
}
