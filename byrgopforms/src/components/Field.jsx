export default function Field({
  label,
  required,
  error,
  help,
  htmlFor,
  children,
}) {
  return (
    <div className="field">
      {label && (
        <label className="label" htmlFor={htmlFor}>
          {label}
          {required && <span className="required"> *</span>}
        </label>
      )}
      {children}
      {help && !error && <div className="help">{help}</div>}
      {error && <div className="error-text">{error}</div>}
    </div>
  );
}