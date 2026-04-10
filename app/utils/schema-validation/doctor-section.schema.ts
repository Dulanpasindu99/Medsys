export type DoctorRole = "owner" | "doctor" | "assistant";

export type DoctorLoginInput = {
  email: string;
  password: string;
};

export type DiseaseSuggestionQuery = {
  terms: string;
};

export function validateDoctorLoginInput(input: DoctorLoginInput) {
  const email = input.email.trim().toLowerCase();
  const password = input.password.trim();

  if (!email) {
    return { ok: false as const, error: "Email is required." };
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false as const, error: "Enter a valid email address." };
  }

  if (!password) {
    return { ok: false as const, error: "Password is required." };
  }

  if (password.length < 8) {
    return { ok: false as const, error: "Password must have at least 8 characters." };
  }

  return {
    ok: true as const,
    value: { email, password },
  };
}

export function validateDiseaseSuggestionQuery(input: DiseaseSuggestionQuery) {
  const terms = input.terms.trim();
  if (terms.length < 2) {
    return { ok: false as const, error: "Enter at least 2 characters." };
  }

  if (terms.length > 100) {
    return { ok: false as const, error: "Search term is too long." };
  }

  return {
    ok: true as const,
    value: { terms },
  };
}
