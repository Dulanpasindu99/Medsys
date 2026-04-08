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
    lineHeight: 1.2,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    paddingTop: "0 !important",
    paddingBottom: "0 !important",
    paddingLeft: "1rem",
    paddingRight: "2.85rem",
  },
  "& .MuiSvgIcon-root": {
    color: "#64748b",
    right: "0.8rem",
    top: "calc(50% - 0.5em)",
    fontSize: "1.15rem",
  },
  "@media (max-width:1279px)": {
    fontSize: "0.8125rem",
    minHeight: 38,
    height: 38,
    "& .MuiSelect-select": {
      minHeight: "38px",
      lineHeight: 1.2,
      paddingLeft: "0.875rem",
      paddingRight: "2.6rem",
    },
    "& .MuiSvgIcon-root": {
      right: "0.72rem",
      fontSize: "1.08rem",
    },
  },
  "@media (max-width:767px)": {
    fontSize: "0.75rem",
    minHeight: 36,
    height: 36,
    "& .MuiSelect-select": {
      minHeight: "36px",
      lineHeight: 1.15,
      paddingLeft: "0.75rem",
      paddingRight: "2.35rem",
    },
    "& .MuiSvgIcon-root": {
      right: "0.65rem",
      fontSize: "1rem",
    },
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
    "@media (max-width:1279px)": {
      "& .MuiOutlinedInput-root": {
        minHeight: 38,
        height: 38,
        fontSize: "0.8125rem",
      },
      "& .MuiPickersInputBase-root": {
        minHeight: 38,
        height: 38,
        fontSize: "0.8125rem",
      },
      "& .MuiPickersOutlinedInput-root": {
        minHeight: 38,
        height: 38,
      },
      "& .MuiInputBase-input": {
        height: "38px",
        padding: "0 12px",
      },
      "& .MuiPickersSectionList-root": {
        minHeight: "38px",
        padding: "0 12px",
      },
      "& .MuiInputAdornment-root .MuiIconButton-root": {
        padding: "6px",
      },
    },
    "@media (max-width:767px)": {
      "& .MuiOutlinedInput-root": {
        minHeight: 36,
        height: 36,
        fontSize: "0.75rem",
      },
      "& .MuiPickersInputBase-root": {
        minHeight: 36,
        height: 36,
        fontSize: "0.75rem",
      },
      "& .MuiPickersOutlinedInput-root": {
        minHeight: 36,
        height: 36,
      },
      "& .MuiInputBase-input": {
        height: "36px",
        padding: "0 10px",
      },
      "& .MuiPickersSectionList-root": {
        minHeight: "36px",
        padding: "0 10px",
      },
      "& .MuiInputAdornment-root .MuiIconButton-root": {
        padding: "5px",
      },
    },
  },
} as const;
