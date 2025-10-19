export type ChartMeta = {
  full: boolean;
  effectiveLimit: number;
  wasClamped: boolean;
};

export type ChartGenerationResponse = {
  status: 'ok' | 'error';
  datasource?: string;
  viz_type?: string;
  explore_url?: string;
  form_data_key?: string;
  embed_url?: string;
  meta?: ChartMeta;
  errorText?: string;
};

export const mockChartGenerationResponse: ChartGenerationResponse = {
  status: 'ok',
  datasource: '123456__query',
  viz_type: 'bar',
  explore_url:
    'https://superset.example.com/explore/?form_data_key=abc123def456&datasource_id=123456&datasource_type=query',
  form_data_key: 'abc123def456',
  embed_url:
    'https://superset.do.zeelu.me/superset/explore/p/2948j2G8YEo/?standalone=1',
  meta: {
    full: false,
    effectiveLimit: 1000,
    wasClamped: false,
  },
};


