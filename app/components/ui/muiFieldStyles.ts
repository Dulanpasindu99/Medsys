export const appMuiSelectSx = {
  borderRadius: "1.25rem",
  backgroundColor: "rgba(255,255,255,0.9)",
  fontSize: "0.875rem",
  fontWeight: 500,
  minHeight: 40,
  height: 40,
  color: "#0f172a",
  boxShadow:
    "inset 0 1px 2px rgba(148,163,184,0.18), 0 8px 20px rgba(255,255,255,0.75)",
  "& .MuiOutlinedInput-notchedOutline": {
    borderColor: "rgba(226,232,240,0.9)",
    borderRadius: "1.25rem",
  },
  "&:hover .MuiOutlinedInput-notchedOutline": {
    borderColor: "rgba(186,230,253,1)",
  },
  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
    borderColor: "#7dd3fc",
    borderWidth: "1px",
  },
  "& .MuiSelect-select": {
    minHeight: "40px",
    display: "flex",
    alignItems: "center",
    boxSizing: "border-box",
    paddingTop: "0 !important",
    paddingBottom: "0 !important",
    paddingLeft: "1rem",
    paddingRight: "2.5rem",
  },
  "& .MuiSvgIcon-root": {
    color: "#64748b",
  },
} as const;

export const appMuiPickerTextFieldProps = {
  fullWidth: true,
  variant: "outlined" as const,
  sx: {
    "& .MuiOutlinedInput-root": {
      minHeight: 40,
      height: 40,
      borderRadius: "1.25rem",
      backgroundColor: "rgba(255,255,255,0.9)",
      fontSize: "0.875rem",
      fontWeight: 500,
      boxShadow:
        "inset 0 1px 2px rgba(148,163,184,0.18), 0 8px 20px rgba(255,255,255,0.75)",
      overflow: "hidden",
    },
    "& .MuiPickersInputBase-root": {
      minHeight: 40,
      height: 40,
      borderRadius: "1.25rem",
      backgroundColor: "rgba(255,255,255,0.9)",
      fontSize: "0.875rem",
      fontWeight: 500,
      boxShadow:
        "inset 0 1px 2px rgba(148,163,184,0.18), 0 8px 20px rgba(255,255,255,0.75)",
      overflow: "hidden",
    },
    "& .MuiPickersOutlinedInput-root": {
      minHeight: 40,
      height: 40,
      borderRadius: "1.25rem",
    },
    "& .MuiOutlinedInput-notchedOutline": {
      borderColor: "rgba(226,232,240,0.9)",
      borderRadius: "5.25rem",
    },
    "& .MuiPickersOutlinedInput-notchedOutline": {
      borderColor: "rgba(226,232,240,0.9)",
      borderRadius: "5.25rem",
    },
    "& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline": {
      borderColor: "rgba(186,230,253,1)",
    },
    "& .MuiPickersOutlinedInput-root:hover .MuiPickersOutlinedInput-notchedOutline": {
      borderColor: "rgba(186,230,253,1)",
    },
    "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
      borderColor: "#7dd3fc",
      borderWidth: "1px",
    },
    "& .MuiPickersOutlinedInput-root.Mui-focused .MuiPickersOutlinedInput-notchedOutline": {
      borderColor: "#7dd3fc",
      borderWidth: "1px",
    },
    "& .MuiInputBase-input": {
      height: "40px",
      boxSizing: "border-box",
      padding: "0 14px",
      color: "#0f172a",
    },
    "& .MuiPickersSectionList-root": {
      height: "40px",
      padding: "0 14px",
      display: "flex",
      alignItems: "center",
      boxSizing: "border-box",
      color: "#0f172a",
    },
    "& .MuiInputAdornment-root": {
      marginRight: "0.125rem",
    },
    "& .MuiInputAdornment-root .MuiIconButton-root": {
      color: "#64748b",
      padding: "8px",
    },
  },
} as const;
