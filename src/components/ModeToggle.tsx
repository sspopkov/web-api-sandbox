type ModeToggleProps<T extends string> = {
  value: T;
  options: { label: string; value: T }[];
  onChange: (value: T) => void;
};

export function ModeToggle<T extends string>({ value, options, onChange }: ModeToggleProps<T>) {
  return (
    <div className="segmented">
      {options.map((option) => (
        <button
          className={option.value === value ? 'selected' : ''}
          key={option.value}
          onClick={() => onChange(option.value)}
          type="button"
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
