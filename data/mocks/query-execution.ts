export type QueryColumn = {
  name: string;
  type: string;
};

export type QueryRow = Record<string, string | number | boolean | null>;

export type QueryMeta = {
  full: boolean;
  effectiveLimit: number;
  wasClamped: boolean;
};

export type QueryExecutionResponse = {
  status: 'ok' | 'error';
  meta: QueryMeta;
  query_id: number;
  columns: QueryColumn[];
  data: QueryRow[];
};

export const mockQueryExecutionResponse: QueryExecutionResponse = {
  status: 'ok',
  meta: {
    full: false,
    effectiveLimit: 1000,
    wasClamped: false,
  },
  query_id: 123456,
  columns: [
    { name: 'id', type: 'INTEGER' },
    { name: 'name', type: 'VARCHAR' },
    { name: 'created_at', type: 'TIMESTAMP' },
  ],
  data: [
    { id: 1, name: 'Alice Johnson', created_at: '2024-01-15T10:30:00Z' },
    { id: 2, name: 'Bob Smith', created_at: '2024-01-16T14:22:00Z' },
    { id: 3, name: 'Carol Davis', created_at: '2024-01-17T09:15:00Z' },
  ],
};


