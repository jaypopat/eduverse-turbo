export interface ContractResult<T> {
  success: boolean;
  value?: { response: T };
  error?: any;
}
