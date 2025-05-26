import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class EnvironmentService {

  public get(key: string, defaultValue?: string): string {
    return (window as any)['env']?.[key] || defaultValue || '';
  }
  
  apiUrl(path: string = ''): string {
    const baseUrl = this.get('API_URL', 'http://localhost:3000/api');
    return baseUrl.replace(/\/$/, '') + '/' + path.replace(/^\//, ''); // clean slashes
  }
}
