export interface JwtPayload {
  iss: string; // issuer
  kid: string; // key id
  jti: string; // JWT ID
  sub: string; // subject (visitName)
  iat: number; // issued at
  nbf: number; // not before (windowStart)
  exp: number; // expires (windowEnd)
  gates: string[]; // allowed gates
  max: number; // max uses
}
