export class User {
  public id!: string;
  
  //public userName!: string;
  public password!: string;
  public confirmPassword!: string;
  public email!: string;
  public role!: string;  // Ou utiliser un enum si les rôles sont définis
  
  public firstName!: string;
  public lastName!: string;
  
  public org_name?: string;  // Optionnel
  public bio?: string;       // Optionnel
  public ville? : string;
  public address?: string;   // Optionnel
  
  public phone!: string;
  
  public created_at: Date = new Date();  // Utilise la date actuelle par défaut
  public updated_at: Date = new Date();
}
