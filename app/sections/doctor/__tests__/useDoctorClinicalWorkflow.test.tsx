import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useDoctorClinicalWorkflow } from "../hooks/useDoctorClinicalWorkflow";

describe("useDoctorClinicalWorkflow", () => {
  it("prevents adding the same drug more than once", () => {
    const { result } = renderHook(() => useDoctorClinicalWorkflow());

    act(() => {
      result.current.updateClinicalDrugForm({
        name: "Paracetamol",
        doseValue: "500",
        amount: "10",
      });
    });

    act(() => {
      result.current.addClinicalDrug();
    });

    act(() => {
      result.current.updateClinicalDrugForm({
        name: " paracetamol ",
        doseValue: "500",
        amount: "10",
      });
    });

    act(() => {
      result.current.addClinicalDrug();
    });

    expect(result.current.rxRows).toHaveLength(1);
    expect(result.current.drugDraftFeedback).toBe(
      "This drug is already added to the prescription."
    );
  });
});
