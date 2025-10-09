import { Link } from "@remix-run/react";
import { Navbar, Button } from "flowbite-react";

interface NavigationProps {
  isAuthenticated?: boolean;
  username?: string;
}

export default function Navigation({ isAuthenticated, username }: NavigationProps) {
  return (
    <Navbar fluid rounded className="border-b">
      <Navbar.Brand as={Link} to="/">
        <span className="self-center whitespace-nowrap text-2xl font-bold text-blue-600">
          Tweeter
        </span>
      </Navbar.Brand>

      <div className="flex md:order-2 gap-2">
        {isAuthenticated && username ? (
          <>
            <Button as={Link} to="/compose" color="blue" size="sm">
              Compose
            </Button>
            <Button as={Link} to={`/${username}`} color="light" size="sm">
              My Profile
            </Button>
            <Button as="a" href="/api/auth/logout" color="light" size="sm">
              Logout
            </Button>
          </>
        ) : (
          <>
            <Button as={Link} to="/login" color="light" size="sm">
              Log In
            </Button>
            <Button as={Link} to="/register" size="sm">
              Sign Up
            </Button>
          </>
        )}
      </div>
    </Navbar>
  );
}
