import React from "react";
import { render, screen } from "@testing-library/react";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { usePathname } from "next/navigation";
import NavigationPanel from "../NavigationPanel";

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(),
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

vi.mock("../../lib/api-client", () => ({
  logoutUser: vi.fn(),
}));

const mockedUsePathname = vi.mocked(usePathname);

beforeAll(() => {
  class ResizeObserverMock {
    observe() {}
    disconnect() {}
    unobserve() {}
  }

  vi.stubGlobal("ResizeObserver", ResizeObserverMock);
});

describe("NavigationPanel", () => {
  beforeEach(() => {
    mockedUsePathname.mockReturnValue("/");
  });

  it("shows only assistant-accessible navigation items for assistants", () => {
    mockedUsePathname.mockReturnValue("/assistant");

    render(<NavigationPanel sessionRole="assistant" userName="Alex Support" />);

    expect(screen.getByLabelText("Assistant Panel")).toHaveAttribute("aria-current", "page");
    expect(screen.getByLabelText("Patient Management")).toBeInTheDocument();
    expect(screen.queryByLabelText("Doctor Page")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Manage Staff Access")).not.toBeInTheDocument();
    expect(screen.getByText("AS")).toBeInTheDocument();
  });

  it("shows the full navigation set for owners", () => {
    mockedUsePathname.mockReturnValue("/owner");

    render(<NavigationPanel sessionRole="owner" userName="Olivia Owner" />);

    expect(screen.getByLabelText("Doctor Page")).toBeInTheDocument();
    expect(screen.getByLabelText("Assistant Panel")).toBeInTheDocument();
    expect(screen.getByLabelText("Manage Staff Access")).toHaveAttribute("aria-current", "page");
  });

  it("shows assistant navigation for doctors with explicit assistant coverage permissions", () => {
    mockedUsePathname.mockReturnValue("/assistant");

    render(
      <NavigationPanel
        sessionRole="doctor"
        sessionPermissions={["patient.write", "appointment.create", "prescription.dispense"]}
        userName="Dr. Cover"
      />
    );

    expect(screen.getByLabelText("Doctor Page")).toBeInTheDocument();
    expect(screen.getByLabelText("Assistant Panel")).toHaveAttribute("aria-current", "page");
  });
});
