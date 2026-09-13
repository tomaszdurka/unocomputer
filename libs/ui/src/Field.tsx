// Form field primitives. `fieldClasses` is exported on its own because forms often need
// it on elements this file does not wrap - a <select>, a third-party control - and
// duplicating the string in every form is how they drift apart.

export const fieldClasses =
  'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm ' +
  'placeholder:text-gray-400 focus:border-gray-500 focus:outline-none ' +
  'disabled:cursor-not-allowed disabled:opacity-50 ' +
  'dark:border-neutral-700 dark:bg-neutral-900 dark:placeholder:text-neutral-500 ' +
  'dark:focus:border-neutral-400';

export function Input({
  className = '',
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`${fieldClasses} ${className}`} {...props} />;
}

export function Textarea({
  className = '',
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`${fieldClasses} ${className}`} {...props} />;
}

export function Label({
  className = '',
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={`mb-1 block text-sm font-medium ${className}`} {...props} />;
}
