import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextFetchEvent, NextRequest, NextResponse } from "next/server";

const isProtectedRoute = createRouteMatcher([
  "/my-listings(.*)",
  "/list-property(.*)",
]);

const clerkHandler = clerkMiddleware(async (auth, request) => {
  if (isProtectedRoute(request)) {
    const { userId } = await auth();
    if (!userId) {
      // Keep authentication inside the branded Apna Ghar experience instead of
      // sending users to Clerk's hosted accounts.dev page.
      const signInUrl = new URL("/sign-in", request.url);
      signInUrl.searchParams.set("redirect_url", request.url);
      return NextResponse.redirect(signInUrl);
    }
  }
});

/**
 * Allow CI and local builds to compile without Clerk credentials.
 * In production, fail closed on protected pages when Clerk is misconfigured.
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

  // Cloudflare's build installs OpenNext at the repository root, which can resolve
  // a second Next.js type version. The runtime request/event are still the objects
  // provided by Next.js middleware; bridge the duplicate compile-time declarations.
  return clerkHandler(request as any, event as any);
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/(.*)",
  ],
};
