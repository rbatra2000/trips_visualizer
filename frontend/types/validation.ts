export interface ValidationError {
  line: number;
  column: number;
  length: number;
  message: string;
  severity: 'error' | 'warning';
}

export interface ParseResult<T> {
  data: T[];
  errors: ValidationError[];
}
