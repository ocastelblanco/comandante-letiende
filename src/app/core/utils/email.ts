/**
 * Normaliza un correo para usarlo como ID de documento en `/users`:
 * sin espacios alrededor y en minúsculas, igual que el correo que devuelve
 * Google al iniciar sesión (con el que `AuthService` busca el documento).
 */
export function normalizeEmail(s: string): string {
  return s.trim().toLowerCase();
}

// Exige un dominio con al menos un punto y una terminación de 2+ letras
// (`.com`, `.co`...). `Validators.email` de Angular acepta `usuario@gmail`,
// y un correo así deja al usuario sin poder ingresar.
const EMAIL_PATTERN = /^[a-z0-9._%+-]+@[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}$/;

export function isValidEmail(s: string): boolean {
  return EMAIL_PATTERN.test(normalizeEmail(s));
}
