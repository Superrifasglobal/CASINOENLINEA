import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
    // `withAuth` augments your `Request` with the user's token.
    function middleware(req) {
        // console.log("Middleware Token:", req.nextauth.token)

        // Strict Admin Check
        // @ts-ignore
        if (req.nextauth.token?.role !== "ADMIN") {
            return NextResponse.redirect(new URL("/", req.url))
        }
    },
    {
        callbacks: {
            authorized: ({ token }) => {
                // Only trigger the middleware function if the user is authenticated at all
                // If this returns false, it redirects to login automatically
                return !!token
            },
        },
        pages: {
            signIn: '/auth/signin',
        },
    }
)

export const config = {
    // Protect all routes starting with /admin
    matcher: ["/admin/:path*"],
}
