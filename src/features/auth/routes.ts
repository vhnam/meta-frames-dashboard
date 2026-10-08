import { createRoute, redirect } from "@tanstack/vue-router";
import { h, type VNode } from "vue";
import { rootRoute } from "#/layouts/rootRoute";
import AuthLayout from "./AuthLayout.vue";
import LoginPage from "./pages/LoginPage.vue";
import RecoverPage from "./pages/RecoverPage.vue";
import RegisterPage from "./pages/RegisterPage.vue";
import ResetPasswordPage from "./pages/ResetPasswordPage.vue";
import { currentUser, safeRedirect } from "./session";

const text = (x: unknown) => (typeof x === "string" && x ? x : undefined);

/** Login, register and recovery are for visitors: a signed-in user goes on to the app. */
async function guestOnly({ search }: { search: { redirect?: string } }) {
  const user = await currentUser().catch(() => null);
  if (user) throw redirect({ href: safeRedirect(search.redirect) });
}

const authRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/auth",
  component: AuthLayout,
});

const authIndexRoute = createRoute({
  getParentRoute: () => authRoute,
  path: "/",
  beforeLoad: () => {
    throw redirect({ to: "/auth/login" });
  },
});

function LoginRoute(): VNode {
  return h(LoginPage, loginRoute.useSearch().value);
}

const loginRoute = createRoute({
  getParentRoute: () => authRoute,
  path: "login",
  validateSearch: (s: Record<string, unknown>): { redirect?: string; error?: string } => ({
    redirect: text(s.redirect),
    error: text(s.error),
  }),
  beforeLoad: guestOnly,
  component: LoginRoute,
});

function RegisterRoute(): VNode {
  return h(RegisterPage, { redirect: registerRoute.useSearch().value.redirect });
}

const registerRoute = createRoute({
  getParentRoute: () => authRoute,
  path: "register",
  validateSearch: (s: Record<string, unknown>): { redirect?: string } => ({
    redirect: text(s.redirect),
  }),
  beforeLoad: guestOnly,
  component: RegisterRoute,
});

const recoverRoute = createRoute({
  getParentRoute: () => authRoute,
  path: "recover",
  beforeLoad: () => guestOnly({ search: {} }),
  component: RecoverPage,
});

function ResetPasswordRoute(): VNode {
  return h(ResetPasswordPage, { token: resetPasswordRoute.useSearch().value.token });
}

const resetPasswordRoute = createRoute({
  getParentRoute: () => authRoute,
  path: "recover/end",
  validateSearch: (s: Record<string, unknown>): { token?: string } => ({ token: text(s.token) }),
  component: ResetPasswordRoute,
});

// The API sends the browser to `{APP_URL}/login?error=...` (Google) and
// `{APP_URL}/recover/end?token=...` (recovery email): forward both, query and all.
const legacyLoginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  beforeLoad: ({ location }) => {
    throw redirect({ href: `/auth/login${location.searchStr}` });
  },
});

const legacyResetRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/recover/end",
  beforeLoad: ({ location }) => {
    throw redirect({ href: `/auth/recover/end${location.searchStr}` });
  },
});

export const authRoutes = [
  authRoute.addChildren([
    authIndexRoute,
    loginRoute,
    registerRoute,
    recoverRoute,
    resetPasswordRoute,
  ]),
  legacyLoginRoute,
  legacyResetRoute,
];
