export interface IStylistResponse {
  id: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  services?: {
    id: string;
    name: string;
    price: number;
  }[];
}
