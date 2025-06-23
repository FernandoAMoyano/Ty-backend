export interface CategoryDto {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  servicesCount?: number;
  createdAt: Date;
  updatedAt: Date;
}
