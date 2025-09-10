export interface AuthResponse {
  access_token: string;
  user: {
    id: number;
    email: string;
    name: string;
    lastname: string;
    roles: { id: number; name: string }[];
  };
  expires_in: number;
}