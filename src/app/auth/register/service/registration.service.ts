import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../../../models/user.model';
import { environment } from '../../../../environments/environment.development';


@Injectable({
  providedIn: 'root'
})
export class RegistrationService {
  private apiUrl =  environment.apiUrl+"/api/auth/signup";

  constructor(private http: HttpClient) { }

  register(user: User): Observable<any> {
    return this.http.post<any>(this.apiUrl, {
      //name: `${user.firstName} ${user.lastName}`,
      firstName : user.firstName,
      lastName : user.lastName,
      email: user.email,
      password: user.password,
      role: user.role,
      phone: user.phone,
      org_name : user.org_name,
      bio : user.bio,
      adresse : user.address,
      create_date : user.created_at,
      updated_date : user.updated_at
    });
  }
 
}
