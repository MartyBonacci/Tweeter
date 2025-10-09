import { Form, useActionData, useNavigation } from "@remix-run/react";
import { Button, Label, TextInput, Textarea, Alert } from "flowbite-react";
import { useState } from "react";

interface ProfileFormErrors {
  error?: string;
  errors?: Array<{ path: string; message: string }>;
}

export default function ProfileForm() {
  const actionData = useActionData<ProfileFormErrors>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const [bioLength, setBioLength] = useState(0);

  const handleBioChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setBioLength(e.target.value.length);
  };

  const bioColorClass =
    bioLength > 141
      ? "text-red-600"
      : bioLength > 120
      ? "text-yellow-600"
      : "text-gray-500";

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          Create Your Profile
        </h2>

        {actionData?.error && (
          <Alert color="failure" className="mb-4">
            {actionData.error}
          </Alert>
        )}

        <Form method="post" className="space-y-4">
          <div>
            <Label htmlFor="displayName" value="Display Name" />
            <TextInput
              id="displayName"
              name="displayName"
              type="text"
              placeholder="Your name"
              required
              maxLength={100}
              disabled={isSubmitting}
              color={
                actionData?.errors?.find((e) => e.path === "displayName")
                  ? "failure"
                  : undefined
              }
              helperText={
                actionData?.errors?.find((e) => e.path === "displayName")
                  ?.message
              }
            />
            <p className="mt-1 text-sm text-gray-500">
              This is how your name will appear on your profile
            </p>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <Label htmlFor="bio" value="Bio" />
              <span className={`text-sm font-medium ${bioColorClass}`}>
                {bioLength} / 141
              </span>
            </div>
            <Textarea
              id="bio"
              name="bio"
              placeholder="Tell us about yourself..."
              rows={4}
              maxLength={141}
              disabled={isSubmitting}
              onChange={handleBioChange}
              color={
                actionData?.errors?.find((e) => e.path === "bio")
                  ? "failure"
                  : undefined
              }
              helperText={
                actionData?.errors?.find((e) => e.path === "bio")?.message
              }
            />
            <p className="mt-1 text-sm text-gray-500">
              Write a short bio about yourself (max 141 characters - it's a Tweeter thing!)
            </p>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting || bioLength > 141}
            isProcessing={isSubmitting}
          >
            {isSubmitting ? "Creating Profile..." : "Create Profile"}
          </Button>
        </Form>
      </div>
    </div>
  );
}
