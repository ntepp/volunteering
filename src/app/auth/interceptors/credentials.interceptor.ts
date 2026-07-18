import { HttpInterceptorFn } from '@angular/common/http';

/**
 * Attaches withCredentials: true to every outgoing request so the browser
 * automatically sends the httpOnly auth_token cookie to our backends.
 */
export const credentialsInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req.clone({ withCredentials: true }));
};
