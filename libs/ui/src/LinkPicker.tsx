type LinkPickerProps = {
  label: string;
  options: { id: string; label: string }[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  emptyText: string;
};

// Checkbox multi-select for linking existing records (persons <-> companies).
export function LinkPicker({
  label,
  options,
  selectedIds,
  onToggle,
  emptyText,
}: LinkPickerProps) {
  return (
    <div>
      <span className="mb-1 block text-sm font-medium">{label}</span>
      {options.length === 0 ? (
        <p className="text-sm text-gray-400 dark:text-neutral-500">{emptyText}</p>
      ) : (
        <ul className="max-h-48 space-y-1 overflow-y-auto rounded-lg border border-gray-300 bg-white p-2 dark:border-neutral-700 dark:bg-neutral-900">
          {options.map((option) => (
            <li key={option.id}>
              <label className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-sm hover:bg-gray-50 dark:hover:bg-neutral-800">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(option.id)}
                  onChange={() => onToggle(option.id)}
                  className="accent-gray-900 dark:accent-neutral-100"
                />
                {option.label}
              </label>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
