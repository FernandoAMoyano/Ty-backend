export interface StylistSummaryDto {
  id: string;
  name: string;
  email: string;
  isOffering: boolean;
  customPrice?: number;
  effectivePrice: number;
}
