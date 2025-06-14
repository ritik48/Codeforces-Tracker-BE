import jwt from "jsonwebtoken";

const TOKEN_EXPIRY = process.env.JWT_EXPIRY || "10d";
const TOKEN_SECRET = process.env.TOKEN_SECRET || "samplesecret";

export const generateToken = (_id: string) => {
  const token = jwt.sign({ _id }, TOKEN_SECRET, {
    expiresIn: TOKEN_EXPIRY,
  } as jwt.SignOptions);
  return token;
};

export const verifyToken = (token: string) => {
  return jwt.verify(token, TOKEN_SECRET) as { _id: string };
};
