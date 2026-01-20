import { NextAuthOptions } from "next-auth"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import EmailProvider from "next-auth/providers/email"
import { prisma } from "./prisma"

// Define the specific admin email(s) strict check
const ADMIN_EMAILS = ['tu-correo-admin@dominio.com', 'NEXJMR07@GMAIL.COM']; // Added your email from history as well just in case

export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(prisma),
    session: {
        strategy: "jwt", // Required for Middleware to work effectively on Edge
    },
    providers: [
        EmailProvider({
            server: process.env.EMAIL_SERVER,
            from: process.env.EMAIL_FROM,
        }),
        // can add Google, GitHub etc here
    ],
    callbacks: {
        async jwt({ token, user, trigger, session }) {
            // 1. Initial sign in: Check if user is in the admin whitelist
            // If user is signing in (user object is present)
            if (user) {
                // Default role is usually calculated by Prisma default, but we enforce Admin check here too
                if (user.email && ADMIN_EMAILS.includes(user.email)) {
                    token.role = "ADMIN"

                    // Optional: Update the DB if it's not consistent (self-healing)
                    // await prisma.user.update({ where: { id: user.id }, data: { role: 'ADMIN' } })
                } else {
                    // @ts-ignore
                    token.role = user.role || "USER"
                }
            }
            return token
        },
        async session({ session, token }) {
            // Pass the role from the token to the session client-side
            if (session.user) {
                // @ts-ignore
                session.user.role = token.role || "USER";
                // @ts-ignore
                session.user.id = token.sub;
            }
            return session
        },
    },
    pages: {
        signIn: '/auth/signin',
        // error: '/auth/error', 
    }
}
