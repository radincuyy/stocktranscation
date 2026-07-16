import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

/**
 * Nama satuan harus label (Drum, Liter, Pcs), bukan angka murni.
 * Menolak "1", "200", "1.5" agar quantity tidak tertukar dengan satuan.
 */
@ValidatorConstraint({ name: 'isUnitName', async: false })
export class IsUnitNameConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    if (typeof value !== 'string') return false;
    const v = value.trim();
    if (v.length < 1 || v.length > 50) return false;
    // wajib ada minimal satu huruf
    if (!/[A-Za-z\u00C0-\u024F]/.test(v)) return false;
    // tolak string yang murni numerik
    if (/^\d+([.,]\d+)?$/.test(v)) return false;
    return true;
  }

  defaultMessage(): string {
    return 'Unit must be a name (e.g. Drum, Liter), not a number';
  }
}

export function IsUnitName(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsUnitNameConstraint,
    });
  };
}
