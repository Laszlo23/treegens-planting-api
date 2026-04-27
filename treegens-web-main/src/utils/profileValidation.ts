/** Mirrors `mobile/app/profile.tsx` — `validateProfileForm`. */

export type ProfileFormData = {
  name?: string
  phone?: string
  experience?: string
}

export type ProfileValidationResult =
  | {
      valid: true
      normalized: {
        name: string
        phone?: string
        experience?: string
      }
    }
  | {
      valid: false
      error: string
    }

export function validateProfileForm(
  formData: ProfileFormData,
): ProfileValidationResult {
  const name = formData.name?.trim() ?? ''
  if (!name) {
    return {
      valid: false,
      error: 'Please enter your name.',
    }
  }

  const phoneInput = formData.phone?.trim() ?? ''
  let normalizedPhone: string | undefined
  if (phoneInput) {
    const compactPhone = phoneInput.replace(/\s+/g, '')
    if (!/^\+?\d+$/.test(compactPhone)) {
      return {
        valid: false,
        error:
          'Phone number can only contain digits and an optional leading +.',
      }
    }

    const digits = compactPhone.startsWith('+')
      ? compactPhone.slice(1)
      : compactPhone
    if (digits.length < 7 || digits.length > 15) {
      return {
        valid: false,
        error: 'Phone number must be between 7 and 15 digits.',
      }
    }

    normalizedPhone = compactPhone
  }

  return {
    valid: true,
    normalized: {
      name,
      phone: normalizedPhone,
      experience: formData.experience?.trim() || undefined,
    },
  }
}
