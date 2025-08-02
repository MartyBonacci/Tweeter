import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import userEvent from "@testing-library/user-event";
import TweetForm from "../TweetForm";
import { vi } from "vitest";

// Mock the fetcher
vi.mock("react-router", async () => {
  const actual = await vi.importActual("react-router");
  return {
    ...actual,
    useFetcher: () => ({
      submit: vi.fn(),
      state: "idle",
      data: null,
    }),
  };
});

describe("TweetForm", () => {
  const mockUser = {
    id: "123",
    username: "testuser",
    name: "Test User",
    avatar: "https://example.com/avatar.jpg",
  };

  const mockOnSuccess = vi.fn();

  const renderTweetForm = (props = {}) => {
    return render(
      <TweetForm user={mockUser} onSuccess={mockOnSuccess} {...props} />
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("renders the form components correctly", () => {
      renderTweetForm();
      
      expect(screen.getByRole("textbox")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("What's happening?")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /tweet/i })).toBeInTheDocument();
      expect(screen.getByText(/characters remaining/i)).toBeInTheDocument();
    });

    it("displays user avatar when provided", () => {
      renderTweetForm();
      
      expect(screen.getByAltText("Test User")).toBeInTheDocument();
    });

    it("displays user initials when no avatar provided", () => {
      const userWithoutAvatar = { ...mockUser, avatar: undefined };
      renderTweetForm({ user: userWithoutAvatar });
      
      expect(screen.getByText("T")).toBeInTheDocument();
    });
  });

  describe("Character Counter", () => {
    it("updates character count as user types", async () => {
      const user = userEvent.setup();
      renderTweetForm();
      
      const textarea = screen.getByRole("textbox");
      await user.type(textarea, "Hello World");
      
      expect(screen.getByText("269")).toBeInTheDocument(); // 280 - 11 = 269
    });

    it("shows warning color when approaching limit", async () => {
      const user = userEvent.setup();
      renderTweetForm();
      
      const textarea = screen.getByRole("textbox");
      const longText = "a".repeat(260); // 20 chars remaining
      await user.type(textarea, longText);
      
      expect(screen.getByText("20")).toHaveClass("text-orange-600");
    });

    it("shows error color when very close to limit", async () => {
      const user = userEvent.setup();
      renderTweetForm();
      
      const textarea = screen.getByRole("textbox");
      const longText = "a".repeat(270); // 10 chars remaining
      await user.type(textarea, longText);
      
      expect(screen.getByText("10")).toHaveClass("text-red-600");
    });

    it("prevents typing beyond 280 characters", async () => {
      const user = userEvent.setup();
      renderTweetForm();
      
      const textarea = screen.getByRole("textbox");
      const veryLongText = "a".repeat(300);
      await user.type(textarea, veryLongText);
      
      expect(textarea).toHaveValue("a".repeat(280));
    });
  });

  describe("Form Validation", () => {
    it("shows error for empty tweet", async () => {
      const user = userEvent.setup();
      renderTweetForm();
      
      const submitButton = screen.getByRole("button", { name: /tweet/i });
      await user.click(submitButton);
      
      expect(screen.getByText(/tweet content is required/i)).toBeInTheDocument();
    });

    it("clears error when user starts typing", async () => {
      const user = userEvent.setup();
      renderTweetForm();
      
      const submitButton = screen.getByRole("button", { name: /tweet/i });
      await user.click(submitButton);
      
      expect(screen.getByText(/tweet content is required/i)).toBeInTheDocument();
      
      const textarea = screen.getByRole("textbox");
      await user.type(textarea, "Hello");
      
      expect(screen.queryByText(/tweet content is required/i)).not.toBeInTheDocument();
    });
  });

  describe("Form Submission", () => {
    it("disables submit button when empty", () => {
      renderTweetForm();
      
      const submitButton = screen.getByRole("button", { name: /tweet/i });
      expect(submitButton).toBeDisabled();
    });

    it("enables submit button when content provided", async () => {
      const user = userEvent.setup();
      renderTweetForm();
      
      const textarea = screen.getByRole("textbox");
      await user.type(textarea, "Hello World");
      
      const submitButton = screen.getByRole("button", { name: /tweet/i });
      expect(submitButton).not.toBeDisabled();
    });

    it("shows loading state during submission", async () => {
      const user = userEvent.setup();
      const mockFetcher = {
        submit: vi.fn(),
        state: "submitting",
        data: null,
      };
      
      vi.mocked(useFetcher).mockReturnValue(mockFetcher);
      
      renderTweetForm();
      
      const textarea = screen.getByRole("textbox");
      await user.type(textarea, "Hello World");
      
      expect(screen.getByText(/posting/i)).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("has proper ARIA attributes", () => {
      renderTweetForm();
      
      const textarea = screen.getByRole("textbox");
      expect(textarea).toHaveAttribute("maxLength", "280");
    });
  });

  describe("Auto-focus", () => {
    it("auto-focuses textarea when autoFocus prop is true", () => {
      renderTweetForm({ autoFocus: true });
      
      const textarea = screen.getByRole("textbox");
      expect(textarea).toHaveFocus();
    });

    it("does not auto-focus when autoFocus prop is false", () => {
      renderTweetForm({ autoFocus: false });
      
      const textarea = screen.getByRole("textbox");
      expect(textarea).not.toHaveFocus();
    });
  });
});