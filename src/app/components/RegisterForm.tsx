import { Form, useActionData, useNavigation } from "@remix-run/react";
import { Button, Label, TextInput, Alert } from "flowbite-react";
import { useState } from "react";

interface RegisterFormErrors {
  error?: string;
  errors?: Array<{ path: string; message: string }>;
}

export default function RegisterForm() {
  const actionData = useActionData<RegisterFormErrors>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const passwordsMatch = password === confirmPassword;
  const showPasswordMismatch = confirmPassword.length > 0 && !passwordsMatch;

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white rounded-lg shadow-md p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          Create Your Account
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
              placeholder="Choose a username"
              required
              minLength={3}
              maxLength={30}
              pattern="[a-zA-Z0-9_-]+"
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
            <p className="mt-1 text-sm text-gray-500">
              3-30 characters, letters, numbers, underscores, and hyphens only
            </p>
          </div>

          <div>
            <Label htmlFor="email" value="Email" />
            <TextInput
              id="email"
              name="email"
              type="email"
              placeholder="your@email.com"
              required
              disabled={isSubmitting}
              color={
                actionData?.errors?.find((e) => e.path === "email")
                  ? "failure"
                  : undefined
              }
              helperText={
                actionData?.errors?.find((e) => e.path === "email")?.message
              }
            />
          </div>

          <div>
            <Label htmlFor="password" value="Password" />
            <TextInput
              id="password"
              name="password"
              type="password"
              placeholder="Create a password"
              required
              minLength={8}
              disabled={isSubmitting}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              color={
                actionData?.errors?.find((e) => e.path === "password")
                  ? "failure"
                  : undefined
              }
              helperText={
                actionData?.errors?.find((e) => e.path === "password")?.message
              }
            />
            <p className="mt-1 text-sm text-gray-500">
              At least 8 characters
            </p>
          </div>

          <div>
            <Label htmlFor="confirmPassword" value="Confirm Password" />
            <TextInput
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="Re-enter your password"
              required
              minLength={8}
              disabled={isSubmitting}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              color={
                showPasswordMismatch ||
                actionData?.errors?.find((e) => e.path === "confirmPassword")
                  ? "failure"
                  : undefined
              }
              helperText={
                showPasswordMismatch
                  ? "Passwords do not match"
                  : actionData?.errors?.find((e) => e.path === "confirmPassword")
                      ?.message
              }
            />
          </div>

          <Button
            type="submit"
            color="blue"
            className="w-full mt-6"
            disabled={isSubmitting || (confirmPassword.length > 0 && !passwordsMatch)}
            isProcessing={isSubmitting}
          >
            {isSubmitting ? "Creating Account..." : "Sign Up"}
          </Button>
        </Form>

        <p className="mt-4 text-center text-sm text-gray-600">
          Already have an account?{" "}
          <a href="/login" className="text-blue-600 hover:underline">
            Log in
          </a>
        </p>
      </div>
    </div>
  );
}
