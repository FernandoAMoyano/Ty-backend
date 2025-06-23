export interface ServiceWithCategoryDto {
  id: string;
  name: string;
  description: string;
  duration: number;
  durationVariation: number;
  price: number;
  formattedPrice: string;
  isActive: boolean;
  categoryName: string;
  createdAt: Date;
  updatedAt: Date;
}
