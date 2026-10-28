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
 * Allow CI and local builds to run without Clerk credentials.
 * Authentication middleware is enabled automatically when the public key is configured.
 * Protected routes must not be considered secured until Clerk is configured.
 */
export default function middleware(request: NextRequest, event: NextFetchEvent) {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return NextResponse.next();
  }

  return clerkHandler(request, event);
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/(.*)",
  ],
};
