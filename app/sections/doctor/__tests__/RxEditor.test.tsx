import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { RxEditor } from "../components/RxEditor";

describe("RxEditor", () => {
  it("closes the drug suggestion menu after a suggestion is selected", async () => {
    const user = userEvent.setup();
    const onDrugFormChange = vi.fn();

    render(
      <RxEditor
        rxRows={[]}
        clinicalDrugForm={{
          name: "Amo",
          doseValue: "500",
          doseUnit: "mg",
          frequencyCode: "TDS",
          amount: "12",
          source: "Clinical",
        }}
        filteredDrugSuggestions={["Amoxicillin"]}
        onOpenClinical={vi.fn()}
        onOpenNotes={vi.fn()}
        onDrugFormChange={onDrugFormChange}
        onAddClinicalDrug={vi.fn()}
        onDrugFormKeyDown={vi.fn()}
        onUpdateRxRow={vi.fn()}
        onRemoveRxRow={vi.fn()}
        onDemoFill={vi.fn()}
        onClear={vi.fn()}
      />
    );

    await user.click(screen.getByRole("textbox", { name: /drug name/i }));

    expect(screen.getByRole("button", { name: /amoxicillin/i })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /amoxicillin/i }));

    expect(onDrugFormChange).toHaveBeenCalledWith({ name: "Amoxicillin" });
    expect(screen.queryByRole("button", { name: /amoxicillin/i })).not.toBeInTheDocument();
  });

  it("renders structured medical controls for dose units, frequency, and source", () => {
    render(
      <RxEditor
        rxRows={[]}
        clinicalDrugForm={{
          name: "",
          doseValue: "",
          doseUnit: "ml",
          frequencyCode: "Q6H",
          amount: "",
          source: "Outside",
        }}
        filteredDrugSuggestions={[]}
        onOpenClinical={vi.fn()}
        onOpenNotes={vi.fn()}
        onDrugFormChange={vi.fn()}
        onAddClinicalDrug={vi.fn()}
        onDrugFormKeyDown={vi.fn()}
        onUpdateRxRow={vi.fn()}
        onRemoveRxRow={vi.fn()}
        onDemoFill={vi.fn()}
        onClear={vi.fn()}
      />
    );

    const comboboxes = screen.getAllByRole("combobox");
    expect(comboboxes[0]).toHaveTextContent(/mL/i);
    expect(comboboxes[1]).toHaveTextContent(/Q6H/i);
    expect(screen.getByRole("button", { name: /outside/i })).toBeInTheDocument();
    expect(screen.queryByText(/use standard medical frequency abbreviations/i)).not.toBeInTheDocument();
  });

  it("submits the prescription row from the add button when required fields are present", async () => {
    const user = userEvent.setup();
    const onAddClinicalDrug = vi.fn();

    render(
      <RxEditor
        rxRows={[]}
        clinicalDrugForm={{
          name: "Amoxicillin",
          doseValue: "500",
          doseUnit: "mg",
          frequencyCode: "TDS",
          amount: "12",
          source: "Clinical",
        }}
        filteredDrugSuggestions={[]}
        onOpenClinical={vi.fn()}
        onOpenNotes={vi.fn()}
        onDrugFormChange={vi.fn()}
        onAddClinicalDrug={onAddClinicalDrug}
        onDrugFormKeyDown={vi.fn()}
        onUpdateRxRow={vi.fn()}
        onRemoveRxRow={vi.fn()}
        onDemoFill={vi.fn()}
        onClear={vi.fn()}
      />
    );

    await user.click(screen.getByRole("button", { name: /add drug/i }));

    expect(onAddClinicalDrug).toHaveBeenCalledTimes(1);
  });
});
