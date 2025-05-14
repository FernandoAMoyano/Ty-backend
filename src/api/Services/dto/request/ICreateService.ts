export interface ICreateServiceDto {
  categoryId: string;
  name: string;
  description: string;
  duration: number;
  durationVariation?: number;
  price: number;
  stylistIds?: string[];
}
