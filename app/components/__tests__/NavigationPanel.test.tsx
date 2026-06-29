import React from "react";
import { render, screen } from "@testing-library/react";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
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
  getCurrentUser: vi.fn().mockResolvedValue({
    role: "assistant",
    active_role: "assistant",
    permissions: [],
    roles: ["assistant"],
    name: "Test User",
  }),
  setActiveRole: vi.fn(),
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
  const renderWithQueryClient = (node: React.ReactElement) => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    return render(<QueryClientProvider client={queryClient}>{node}</QueryClientProvider>);
  };

  beforeEach(() => {
    mockedUsePathname.mockReturnValue("/");
  });

  // The panel renders nav links twice (desktop rail + mobile bottom bar), so
  // queries can match more than one element; assert against all matches.
  const hasCurrent = (label: string) =>
    screen.getAllByLabelText(label).some((el) => el.getAttribute("aria-current") === "page");

  it("shows only assistant-accessible navigation items for assistants", () => {
    mockedUsePathname.mockReturnValue("/assistant");

    renderWithQueryClient(<NavigationPanel sessionRole="assistant" userName="Alex Support" />);

    expect(hasCurrent("Assistant Panel")).toBe(true);
    expect(screen.getAllByLabelText("Patient Management").length).toBeGreaterThan(0);
    expect(screen.queryAllByLabelText("Doctor Page")).toHaveLength(0);
    expect(screen.queryAllByLabelText("Manage Staff Access")).toHaveLength(0);
    expect(screen.getByText("AS")).toBeInTheDocument();
  });

  it("shows the full navigation set for owners", () => {
    mockedUsePathname.mockReturnValue("/create-user");

    renderWithQueryClient(<NavigationPanel sessionRole="owner" userName="Olivia Owner" />);

    expect(screen.queryAllByLabelText("Doctor Page")).toHaveLength(0);
    expect(screen.queryAllByLabelText("Assistant Panel")).toHaveLength(0);
    expect(hasCurrent("Create User")).toBe(true);
  });

  it("shows assistant navigation for doctors with explicit assistant coverage permissions", () => {
    mockedUsePathname.mockReturnValue("/assistant");

    renderWithQueryClient(
      <NavigationPanel
        sessionRole="doctor"
        sessionPermissions={["patient.write", "appointment.create", "prescription.dispense"]}
        userName="Dr. Cover"
      />
    );

    expect(screen.getAllByLabelText("Doctor Page").length).toBeGreaterThan(0);
    expect(hasCurrent("Assistant Panel")).toBe(true);
  });
});
