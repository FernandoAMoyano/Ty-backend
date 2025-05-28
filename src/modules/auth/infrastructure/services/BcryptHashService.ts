import * as bcrypt from 'bcrypt';
import { HashService } from '../../application/services/HashService';

export class BcryptHashService implements HashService {
  private readonly saltRounds = 12;

  async hash(plainText: string): Promise<string> {
    return bcrypt.hash(plainText, this.saltRounds);
  }

  async compare(plainText: string, hashedText: string): Promise<boolean> {
    return bcrypt.compare(plainText, hashedText);
  }
}
