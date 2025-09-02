export interface JwtPayload {
  sub: number;
  email: string;
  roles: { id: number; name: string }[];
  iat?: number;
  exp?: number;
}