import { render, screen } from "@testing-library/react";
import FeedbackPage from "./page";

describe("FeedbackPage", () => {
  it("renders an accessible feedback form", () => {
    render(<FeedbackPage />);
    expect(screen.getByRole("heading", { name: /uma escuta que vira direção/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/e-mail/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/feedback/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /enviar feedback/i })).toBeInTheDocument();
  });
});