import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DitherScan, levelSpec } from "@/components/ui/dither-scan";

describe("23rd.dev Dither Scan integration", () => {
  it("keeps exact evidence accessible when canvas initialization is unavailable", () => {
    const { container } = render(
      <DitherScan src="/manual-regions/example.webp" alt="Exact manual evidence" />,
    );

    expect(screen.getByRole("img", { name: "Exact manual evidence" })).toBeVisible();
    expect(container.querySelector("canvas")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Exact manual evidence" })).not.toHaveAttribute(
      "aria-busy",
      "true",
    );
  });

  it("progressively resolves from coarse monochrome cells to the source image", () => {
    expect(levelSpec(0, 4, 6)).toEqual({ cell: 6, tones: 2, color: 0 });
    expect(levelSpec(4, 4, 6)).toEqual({ cell: 1, tones: 12, color: 1 });
  });
});
