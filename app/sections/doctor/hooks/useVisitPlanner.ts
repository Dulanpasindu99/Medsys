import { useState } from "react";

export type VisitOption = "TwoWeeks" | "ThreeWeeks";

const formatDate = (date: Date) =>
  date.toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });

function getNextVisitDate(option: VisitOption) {
  const today = new Date();
  const daysToAdd = option === "TwoWeeks" ? 14 : 21;
  today.setDate(today.getDate() + daysToAdd);
  return formatDate(today);
}

export function useVisitPlanner() {
  const [nextVisitOption, setNextVisitOption] = useState<VisitOption>("TwoWeeks");
  const [nextVisitDate, setNextVisitDate] = useState(() => getNextVisitDate("TwoWeeks"));

  const handleNextVisitSelect = (option: VisitOption) => {
    setNextVisitOption(option);
    setNextVisitDate(getNextVisitDate(option));
  };

  return {
    nextVisitOption,
    nextVisitDate,
    setNextVisitDate,
    handleNextVisitSelect,
  };
}
