type Translate = (source: string, values?: Record<string, string | number>) => string;

/** Localize native constraint messages without changing the constraints or submission flow. */
export function localizeValidation(field: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement, t: Translate) {
  field.setCustomValidity('');
  if (field.validity.valueMissing) field.setCustomValidity(t('Please complete this field.'));
  else if (field.validity.tooShort && 'minLength' in field) field.setCustomValidity(t('Use at least {count} characters.', { count: field.minLength }));
  else if (field.validity.tooLong && 'maxLength' in field) field.setCustomValidity(t('Use no more than {count} characters.', { count: field.maxLength }));
  else if (!field.validity.valid) field.setCustomValidity(t('Please enter a valid value.'));
}
