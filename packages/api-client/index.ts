export interface ApiClientOptions { baseUrl: string; getAccessToken?: () => Promise<string | null> }
export class ApiClient {
  constructor(private readonly options: ApiClientOptions) {}
  async get<T>(path: string): Promise<T> {
    const token = await this.options.getAccessToken?.();
    const response = await fetch(new URL(path.replace(/^\//, ''), this.options.baseUrl.endsWith('/') ? this.options.baseUrl : this.options.baseUrl + '/'), {
      headers: { Accept: 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) },
    });
    if (!response.ok) throw new Error('API request failed with status ' + response.status);
    return response.json() as Promise<T>;
  }
}