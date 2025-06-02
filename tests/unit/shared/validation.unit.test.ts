import { isValidEmail, isValidPassword, isValidPhone } from '../../../src/shared/utils/validation';

describe('Validation Utils Unit Tests', () => {
  describe('isValidEmail', () => {
    it('should return true for valid emails', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@domain.com',
        'user123@domain123.com',
      ];

      validEmails.forEach((email) => {
        expect(isValidEmail(email)).toBe(true);
      });
    });

    it('should return false for invalid emails', () => {
      const invalidEmails = [
        'invalid-email',
        '@domain.com',
        'user@',
        'user@domain',
        'user..name@domain.com',
        '',
      ];

      invalidEmails.forEach((email) => {
        expect(isValidEmail(email)).toBe(false);
      });
    });
  });

  describe('isValidPassword', () => {
    it('should return true for valid passwords', () => {
      const validPasswords = ['Password123!', 'MySecure1Pass', 'Complex9Password', 'Test123Pass'];

      validPasswords.forEach((password) => {
        expect(isValidPassword(password)).toBe(true);
      });
    });

    it('should return false for invalid passwords', () => {
      const invalidPasswords = [
        'short1A', // Too short
        'nouppercase1', // No uppercase
        'NOLOWERCASE1', // No lowercase
        'NoNumbers!', // No numbers
        'password', // Too simple
        '', // Empty
      ];

      invalidPasswords.forEach((password) => {
        expect(isValidPassword(password)).toBe(false);
      });
    });
  });

  describe('isValidPhone', () => {
    it('should return true for valid phone numbers', () => {
      const validPhones = ['+1234567890', '+123456789012345', '1234567890', '+598123456789'];

      validPhones.forEach((phone) => {
        expect(isValidPhone(phone)).toBe(true);
      });
    });

    it('should return false for invalid phone numbers', () => {
      const invalidPhones = [
        'abc123',
        '123-456-7890',
        'phone',
        '+',
        '',
        '01234567890123456789', // Too long
      ];

      invalidPhones.forEach((phone) => {
        expect(isValidPhone(phone)).toBe(false);
      });
    });
  });
});
