export function getCurrentHijriYear(): string {
  try {
    const momentHijri = require('moment-hijri');
    return momentHijri().format('iYYYY');
  } catch {
    return '1447';
  }
}

export function getCurrentGregorianYear(): number {
  return new Date().getFullYear();
}
