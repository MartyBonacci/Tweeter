import { useState } from 'react';
import { Form, useActionData, useNavigation } from '@remix-run/react';
import { Button, Label, Textarea, Alert } from 'flowbite-react';

interface TweetFormErrors {
  error?: string;
  errors?: Array<{ path: string; message: string }>;
}

export default function TweetForm() {
  const [content, setContent] = useState('');
  const actionData = useActionData<TweetFormErrors>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';

  const charCount = content.length;
  const isValid = content.trim().length > 0 && charCount <= 141;

  // Determine character counter color
  const counterColor =
    charCount > 141
      ? 'text-red-500'
      : charCount > 120
      ? 'text-yellow-500'
      : 'text-gray-500';

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white rounded-lg shadow-md p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          Compose Tweet
        </h2>

        {actionData?.error && (
          <Alert color="failure" className="mb-4">
            {actionData.error}
          </Alert>
        )}

        <Form method="post" className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-2">
              <Label htmlFor="content" value="What's on your mind?" />
              <span className={`text-sm font-medium ${counterColor}`} aria-live="polite">
                {charCount} / 141
              </span>
            </div>
            <Textarea
              id="content"
              name="content"
              rows={4}
              placeholder="Share your thoughts in 141 characters..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={isSubmitting}
              color={
                actionData?.errors?.find((e) => e.path === 'content') ||
                (charCount > 141 && content.length > 0)
                  ? 'failure'
                  : undefined
              }
              helperText={
                actionData?.errors?.find((e) => e.path === 'content')?.message
              }
              className="resize-none"
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={!isValid || isSubmitting}
            isProcessing={isSubmitting}
          >
            {isSubmitting ? 'Posting...' : 'Post Tweet'}
          </Button>
        </Form>

        <p className="mt-4 text-center text-sm text-gray-600">
          Your tweet will be visible on your profile
        </p>
      </div>
    </div>
  );
}
