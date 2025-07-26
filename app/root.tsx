import type { LinksFunction, LoaderFunctionArgs } from "react-router";
import { Links, Meta, Outlet, Scripts, useLoaderData } from "react-router";
import styles from "./tailwind.css?url";
import { optionalAuth } from "./lib/middleware";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: styles },
];

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await optionalAuth(request);
  return { user };
}

export default function App() {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="data:image/x-icon;base64,AA" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
        <title>Tweeter</title>
      </head>
      <body>
        <Outlet />
        <Scripts />
      </body>
    </html>
  );
}