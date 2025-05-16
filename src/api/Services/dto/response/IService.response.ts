export interface IServiceResponse {
  id: string;
  name: string;
  description: string;
  duration: number;
  price: number;
  category: {
    id: string;
    name: string;
  };
  stylists?: {
    id: string;
    name: string;
  }[];
}
