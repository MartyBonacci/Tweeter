import { getUserSession } from "~/lib/session.server";

export async function loader({ request }: { request: Request }) {
  const user = await getUserSession(request);
  
  if (user) {
    // Redirect authenticated users to timeline
    throw new Response(null, {
      status: 302,
      headers: { Location: "/timeline" }
    });
  } else {
    // Redirect unauthenticated users to login
    throw new Response(null, {
      status: 302,
      headers: { Location: "/login" }
    });
  }
}

export default function Home() {
  return null; // This won't render due to the redirect
}