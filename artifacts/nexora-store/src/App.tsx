import { type ReactNode, useEffect, useRef } from "react";
import { ClerkProvider, Show, SignIn, SignUp, useAuth, useClerk } from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { shadcn } from "@clerk/themes";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { ErrorBoundary } from "@/components/error-boundary";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { AccountPage, AdminPage, CartPage, CheckoutPage, HomePage, InfoPage, OrderPage, ProductPage, ShopPage } from "@/pages/storefront-pages";
import { Shell } from "@/components/storefront";
import { Redirect, Route, Switch, useLocation, Router as WouterRouter } from "wouter";

const queryClient = new QueryClient();
const clerkPubKey = publishableKeyFromHost(window.location.hostname, import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string) {
  return basePath && path.startsWith(basePath) ? path.slice(basePath.length) || "/" : path;
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: "#f26b4f",
    colorForeground: "#2a211d",
    colorMutedForeground: "#796c66",
    colorDanger: "#ba423a",
    colorBackground: "#fbf5ec",
    colorInput: "#fffaf3",
    colorInputForeground: "#2a211d",
    colorNeutral: "#d8cfc6",
    fontFamily: "DM Sans, sans-serif",
    borderRadius: "0.25rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-[#fbf5ec] rounded-2xl w-[440px] max-w-full overflow-hidden",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "font-display text-[#2a211d]",
    headerSubtitle: "text-[#796c66]",
    socialButtonsBlockButtonText: "text-[#2a211d]",
    formFieldLabel: "text-[#2a211d]",
    footerActionLink: "text-[#e85d3f]",
    footerActionText: "text-[#796c66]",
    dividerText: "text-[#796c66]",
    logoBox: "h-10",
    logoImage: "h-10 w-auto",
    socialButtonsBlockButton: "border-[#d8cfc6] bg-[#fffaf3]",
    formButtonPrimary: "bg-[#f26b4f] text-[#2a211d] hover:bg-[#e85d3f]",
    formFieldInput: "border-[#d8cfc6] bg-[#fffaf3] text-[#2a211d]",
    footerAction: "bg-transparent",
    dividerLine: "bg-[#d8cfc6]",
    alert: "border-[#efc4b8] bg-[#fff0ea]",
    otpCodeFieldInput: "border-[#d8cfc6] bg-[#fffaf3]",
    formFieldRow: "text-[#2a211d]",
    main: "text-[#2a211d]",
  },
};

function SignInPage() {
  return <div className="flex min-h-[100dvh] items-center justify-center bg-[#467f7d] px-4"><SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} /></div>;
}

function SignUpPage() {
  return <div className="flex min-h-[100dvh] items-center justify-center bg-[#467f7d] px-4"><SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} /></div>;
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const client = useQueryClient();
  const previousUserId = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (previousUserId.current !== undefined && previousUserId.current !== userId) client.clear();
      previousUserId.current = userId;
    });
    return unsubscribe;
  }, [addListener, client]);
  return null;
}

function HomeRedirect() {
  const { isSignedIn, isLoaded } = useAuth();
  if (isLoaded && isSignedIn) return <Redirect to="/account" />;
  return <HomePage />;
}

function StoreRoutes() {
  return (
    <RoutedErrorBoundary>
      <Shell>
        <Switch>
          <Route path="/" component={HomeRedirect} />
          <Route path="/shop" component={ShopPage} />
          <Route path="/product/:slug" component={ProductPage} />
          <Route path="/cart" component={CartPage} />
          <Route path="/checkout" component={CheckoutPage} />
          <Route path="/order/:orderId" component={OrderPage} />
          <Route path="/account" component={AccountPage} />
          <Route path="/admin" component={AdminPage} />
          <Route path="/privacy"><InfoPage kind="privacy" /></Route>
          <Route path="/terms"><InfoPage kind="terms" /></Route>
          <Route path="/shipping"><InfoPage kind="shipping" /></Route>
          <Route path="/returns"><InfoPage kind="returns" /></Route>
          <Route path="/cookies"><InfoPage kind="cookies" /></Route>
          <Route path="/contact"><InfoPage kind="contact" /></Route>
          <Route component={NotFound} />
        </Switch>
      </Shell>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function ClerkRoutes() {
  const [, setLocation] = useLocation();
  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        signIn: { start: { title: "Welcome back", subtitle: "Sign in to access your NEXORA account" } },
        signUp: { start: { title: "Create your account", subtitle: "Save your finds and track every order" } },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <ClerkQueryClientCacheInvalidator />
      <Switch>
        <Route path="/sign-in/*?" component={SignInPage} />
        <Route path="/sign-up/*?" component={SignUpPage} />
        <Route component={StoreRoutes} />
      </Switch>
    </ClerkProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={basePath}><ClerkRoutes /></WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;