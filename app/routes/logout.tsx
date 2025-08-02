import { destroyUserSession } from "~/lib/session.server";

export async function action({ request }: { request: Request }) {
  return destroyUserSession(request);
}

export async function loader() {
  throw new Response(null, { status: 302, headers: { Location: "/login" } });
}