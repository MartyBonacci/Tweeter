import { Form, useActionData, useNavigation } from "@remix-run/react";
import { Button, Label, TextInput, Alert } from "flowbite-react";

interface LoginFormErrors {
  error?: string;
  errors?: Array<{ path: string; message: string }>;
}

export default function LoginForm() {
  const actionData = useActionData<LoginFormErrors>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white rounded-lg shadow-md p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          Welcome Back
        </h2>

        {actionData?.error && (
          <Alert color="failure" className="mb-4">
            {actionData.error}
          </Alert>
        )}

        <Form method="post" className="space-y-4">
          <div>
            <Label htmlFor="username" value="Username" />
            <TextInput
              id="username"
              name="username"
              type="text"
              placeholder="Enter your username"
              required
              disabled={isSubmitting}
              color={
                actionData?.errors?.find((e) => e.path === "username")
                  ? "failure"
                  : undefined
              }
              helperText={
                actionData?.errors?.find((e) => e.path === "username")?.message
              }
            />
          </div>

          <div>
            <Label htmlFor="password" value="Password" />
            <TextInput
              id="password"
              name="password"
              type="password"
              placeholder="Enter your password"
              required
              disabled={isSubmitting}
              color={
                actionData?.errors?.find((e) => e.path === "password")
                  ? "failure"
                  : undefined
              }
              helperText={
                actionData?.errors?.find((e) => e.path === "password")?.message
              }
            />
          </div>

          <Button
            type="submit"
            className="w-full mt-6"
            disabled={isSubmitting}
            isProcessing={isSubmitting}
          >
            {isSubmitting ? "Logging In..." : "Log In"}
          </Button>
        </Form>

        <p className="mt-4 text-center text-sm text-gray-600">
          Don't have an account?{" "}
          <a href="/register" className="text-blue-600 hover:underline">
            Sign up
          </a>
        </p>
      </div>
    </div>
  );
}
