import { v4 as uuidv4, validate } from 'uuid';

export const generateUuid = (): string => uuidv4();

export const isValidUuid = (uuid: string): boolean => validate(uuid);
