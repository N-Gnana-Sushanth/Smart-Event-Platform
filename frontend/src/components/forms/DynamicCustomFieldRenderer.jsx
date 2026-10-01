import React from 'react';

export function DynamicCustomFieldRenderer({ fields = [], values = {}, onChange }) {
  if (!fields || fields.length === 0) return null;

  const handleFieldChange = (fieldName, val) => {
    onChange({
      ...values,
      [fieldName]: val,
    });
  };

  return (
    <div className="space-y-4 pt-4 border-t border-slate-100">
      <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
        Additional Event Questions
      </div>

      {fields.map(field => {
        let options = [];
        try {
          if (field.optionsJson) options = JSON.parse(field.optionsJson);
        } catch (e) {}

        const val = values[field.fieldName] || '';

        return (
          <div key={field.id} className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">
              {field.label} {field.isRequired && <span className="text-rose-500">*</span>}
            </label>

            {field.fieldType === 'DROPDOWN' ? (
              <select
                value={val}
                onChange={e => handleFieldChange(field.fieldName, e.target.value)}
                required={field.isRequired}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              >
                <option value="">Select an option</option>
                {options.map((opt, i) => (
                  <option key={i} value={opt}>{opt}</option>
                ))}
              </select>
            ) : field.fieldType === 'RADIO' ? (
              <div className="flex flex-wrap gap-4 pt-1">
                {options.map((opt, i) => (
                  <label key={i} className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name={field.fieldName}
                      value={opt}
                      checked={val === opt}
                      onChange={() => handleFieldChange(field.fieldName, opt)}
                      required={field.isRequired}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
            ) : field.fieldType === 'CHECKBOX' ? (
              <div className="flex flex-wrap gap-4 pt-1">
                {options.map((opt, i) => {
                  const currentArr = Array.isArray(val) ? val : [];
                  const isChecked = currentArr.includes(opt);
                  return (
                    <label key={i} className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={e => {
                          if (e.target.checked) {
                            handleFieldChange(field.fieldName, [...currentArr, opt]);
                          } else {
                            handleFieldChange(field.fieldName, currentArr.filter(x => x !== opt));
                          }
                        }}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span>{opt}</span>
                    </label>
                  );
                })}
              </div>
            ) : (
              <input
                type={field.fieldType === 'NUMBER' ? 'number' : field.fieldType === 'EMAIL' ? 'email' : 'text'}
                value={val}
                onChange={e => handleFieldChange(field.fieldName, e.target.value)}
                required={field.isRequired}
                placeholder={`Enter ${field.label.toLowerCase()}`}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
