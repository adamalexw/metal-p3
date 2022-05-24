export interface CoversRequest {
  requests: CoverRequest[];
  cancel?: boolean;
}

export interface CoverRequest {
  id: number;
  folder: string;
}
