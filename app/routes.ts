import type { RouteConfig } from "@react-router/dev/routes";

export default [
  {
    path: "/",
    file: "routes/_index.tsx",
  },
  {
    path: "/login",
    file: "routes/login.tsx",
  },
  {
    path: "/register",
    file: "routes/register.tsx",
  },
  {
    path: "/home",
    file: "routes/home.tsx",
  },
  {
    path: "/users/:username",
    file: "routes/users.$username.tsx",
  },
  {
    path: "/settings",
    file: "routes/settings.tsx",
  },
  {
    path: "/api/tweets",
    file: "routes/api.tweets.api.tsx",
  },
  {
    path: "/api/users/:username",
    file: "routes/api.users.$username.api.tsx",
  },
  {
    path: "/api/users/:username/follow",
    file: "routes/api.users.$username.follow.api.tsx",
  },
  {
    path: "/api/tweets/:tweetId/like",
    file: "routes/api.tweets.$tweetId.like.api.tsx",
  },
  {
    path: "/api/auth/login",
    file: "routes/api.auth.login.tsx",
  },
  {
    path: "/api/auth/register",
    file: "routes/api.auth.register.tsx",
  },
  {
    path: "/api/auth/verify-email/:token",
    file: "routes/api.auth.verify-email.$token.api.tsx",
  },
  {
    path: "/api/upload/avatar",
    file: "routes/api.upload.avatar.api.tsx",
  },
  {
    path: "/api/search",
    file: "routes/api.search.api.tsx",
  },
  {
    path: "/search",
    file: "routes/search.tsx",
  },
] satisfies RouteConfig;