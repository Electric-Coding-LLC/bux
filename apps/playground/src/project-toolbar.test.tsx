import { describe, expect, it } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { ProjectToolbar } from "./project-toolbar";

describe("ProjectToolbar", () => {
  it("renders the selected adapter target in the export controls", () => {
    const html = renderToStaticMarkup(
      <ProjectToolbar
        adapterTarget="webstir"
        exportReadiness={{
          blockedReasons: [],
          canExport: true,
          label: "Approved for Export",
          status: "approved",
          summary: "Critic pass and export validation are both clear."
        }}
        projectName="demo"
        isDirty={false}
        isBusy={false}
        supportsDirectoryPicker={true}
        notice={null}
        onCreateNew={() => {}}
        onAdapterTargetChange={() => {}}
        onOpen={() => {}}
        onSave={() => {}}
        onSaveAs={() => {}}
        onExport={() => {}}
      />
    );

    expect(html).toContain("Export target");
    expect(html).toContain("Webstir");
    expect(html).toContain("Export Webstir");
    expect(html).toContain("layout spec");
  });
});
