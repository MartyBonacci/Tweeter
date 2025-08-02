import { type RouteConfig, index, route, layout } from "@react-router/dev/routes";

export default [
  index("routes/_index.tsx"),
  
  // Authentication routes
  route("register", "routes/register.tsx"),
  route("login", "routes/login.tsx"),
  route("logout", "routes/logout.tsx"),
  
  // Protected routes with layout
  layout("routes/_layout.tsx", [
    route("timeline", "routes/timeline.tsx"),
    route("settings", "routes/settings.tsx"),
  ]),
  
  // Tweet routes
  route("tweets", "routes/tweets.tsx"),
] satisfies RouteConfig;