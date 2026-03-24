import dayjs from "dayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { appMuiPickerTextFieldProps } from "../../../components/ui/muiFieldStyles";
import type { VisitOption } from "../hooks/useVisitPlanner";

type VisitPlannerProps = {
  nextVisitOption: VisitOption;
  nextVisitDate: string;
  notes: string;
  onSelectOption: (option: VisitOption) => void;
  onDateChange: (value: string) => void;
  onNotesChange: (value: string) => void;
};

export function VisitPlanner({
  nextVisitOption,
  nextVisitDate,
  notes,
  onSelectOption,
  onDateChange,
  onNotesChange,
}: VisitPlannerProps) {
  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2 xl:gap-6">
      <div className="space-y-3 rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
        <p className="ml-1 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Next Visit Date</p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onSelectOption("TwoWeeks")}
            className={`flex-1 rounded-xl px-3 py-2 text-xs font-semibold uppercase transition ${
              nextVisitOption === "TwoWeeks"
                ? "bg-slate-800 text-white shadow-md"
                : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
            }`}
          >
            2 Weeks
          </button>
          <button
            type="button"
            onClick={() => onSelectOption("ThreeWeeks")}
            className={`flex-1 rounded-xl px-3 py-2 text-xs font-semibold uppercase transition ${
              nextVisitOption === "ThreeWeeks"
                ? "bg-slate-800 text-white shadow-md"
                : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
            }`}
          >
            3 Weeks
          </button>
        </div>
        <div className="relative">
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              value={nextVisitDate ? dayjs(nextVisitDate) : null}
              onChange={(value) => onDateChange(value ? value.format("YYYY-MM-DD") : "")}
              format="DD/MM/YYYY"
              slotProps={{
                textField: {
                  ...appMuiPickerTextFieldProps,
                  sx: {
                    ...appMuiPickerTextFieldProps.sx,
                    "& .MuiOutlinedInput-root": {
                      ...appMuiPickerTextFieldProps.sx["& .MuiOutlinedInput-root"],
                      borderRadius: "0.75rem",
                      backgroundColor: "#ffffff",
                      fontWeight: 700,
                      minHeight: 40,
                      height: 40,
                      boxShadow: "none",
                    },
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderRadius: "0.75rem",
                    },
                    "& .MuiInputBase-input": {
                      ...appMuiPickerTextFieldProps.sx["& .MuiInputBase-input"],
                      textAlign: "center",
                      fontSize: "0.875rem",
                      height: "40px",
                    },
                  },
                },
              }}
            />
          </LocalizationProvider>
        </div>
      </div>

      <div className="space-y-3 rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
        <p className="ml-1 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Doctor&apos;s Notes</p>
        <textarea
          className="h-24 w-full resize-none rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-800 shadow-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-50"
          placeholder="Add clinical notes here..."
          value={notes}
          onChange={(event) => onNotesChange(event.target.value)}
        />
      </div>
    </div>
  );
}
