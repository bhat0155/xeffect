// src/config/passport.ts
import passport from "passport";
import { Strategy as GoogleStrategy, Profile } from "passport-google-oauth20";
import { prisma } from "./prisma";

export type PassportUser = { userId: string };

function getPrimaryEmail(profile: Profile): string | null {
  return profile.emails?.[0]?.value ?? null;
}

export function configurePassport() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error(
      "Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET in environment variables"
    );
  }

  passport.use(
    new GoogleStrategy(
      {
        clientID: clientId,
        clientSecret,
        callbackURL: process.env.GOOGLE_CALLBACK_URL || "/auth/google/callback"
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const googleId = profile.id;
          const email = getPrimaryEmail(profile);
          const name = profile.displayName ?? "Unknown";

          if (!email) return done(new Error("No email found in Google profile"));

          // 1) Try googleId
          let user = await prisma.user.findUnique({ where: { googleId } });

          // 2) Else try email (account linking)
          if (!user) {
            const existingByEmail = await prisma.user.findUnique({
              where: { email },
            });

            if (existingByEmail) {
              user = await prisma.user.update({
                where: { id: existingByEmail.id },
                data: { googleId, name },
              });
            } else {
              user = await prisma.user.create({
                data: { googleId, email, name },
              });
            }
          }

          const passportUser: PassportUser = { userId: user.id };
          return done(null, passportUser);
        } catch (err) {
          return done(err as Error);
        }
      }
    )
  );

  passport.serializeUser((user, done) => done(null, user));
  passport.deserializeUser((user: PassportUser, done) => done(null, user));
}