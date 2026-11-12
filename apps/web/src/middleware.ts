import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextFetchEvent, NextRequest, NextResponse } from "next/server";

const isProtectedRoute = createRouteMatcher([
  "/my-listings(.*)",
  "/list-property(.*)",
  "/admin(.*)",
]);
const isAdminRoute = createRouteMatcher(["/admin(.*)"]);

const clerkHandler = clerkMiddleware(async (auth, request) => {
  if (isProtectedRoute(request)) {
    const { userId } = await auth();
    if (!userId) {
      const signInUrl = new URL("/sign-in", request.url);
      signInUrl.searchParams.set("redirect_url", request.url);
      return NextResponse.redirect(signInUrl);
    }

    if (isAdminRoute(request)) {
      const configuredAdmins = (process.env.ADMIN_CLERK_USER_IDS || "")
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);
      const defaultAdmins = [
        "user_3M0Lx42jLgKmbAPvo6kJiLZgccC",
        "user_3LSfCyLdR69L1O1ovcKkenvdrMK",
        "user_3LHtWTA9Vf1Il8C98rCZOut7xiu",
        "user_3LSgkWc0aC8JqvhF9CfR2AYdqCK",
      ];
      const adminIds = Array.from(new Set([...configuredAdmins, ...defaultAdmins]));
      if (!adminIds.includes(userId)) {
        return NextResponse.json(
          { error: "You do not have permission to access the Apna Ghar admin workspace." },
          { status: 403 },
        );
      }
    }
  }
});

/**
 * Fail closed for protected routes when Clerk is misconfigured in production.
 */
export default function middleware(request: NextRequest, event: NextFetchEvent) {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    if (process.env.NODE_ENV === "production" && isProtectedRoute(request)) {
      return NextResponse.json(
        { error: "Authentication is temporarily unavailable. Please try again later." },
        { status: 503 },
      );
    }
    return NextResponse.next();
  }

  // OpenNext can resolve a second Next.js type version; runtime objects remain
  // the request/event instances supplied by Next.js middleware.
  return clerkHandler(request as any, event as any);
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/(.*)",
  ],
};
