"use client";

import FormControl from "@mui/material/FormControl";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import type { SelectChangeEvent } from "@mui/material/Select";
import type { SxProps, Theme } from "@mui/material/styles";
import { appMuiSelectSx } from "./muiFieldStyles";

export type AppSelectOption = {
  value: string | number;
  label: React.ReactNode;
  disabled?: boolean;
};

type AppSelectFieldProps = {
  value: string | number;
  onValueChange: (value: string) => void;
  options: AppSelectOption[];
  disabled?: boolean;
  displayEmpty?: boolean;
  ariaLabel?: string;
  sx?: SxProps<Theme>;
  renderValue?: (value: string) => React.ReactNode;
};

export function AppSelectField({
  value,
  onValueChange,
  options,
  disabled = false,
  displayEmpty = false,
  ariaLabel,
  sx,
  renderValue,
}: AppSelectFieldProps) {
  return (
    <FormControl fullWidth size="small">
      <Select
        value={String(value)}
        displayEmpty={displayEmpty}
        disabled={disabled}
        onChange={(event: SelectChangeEvent<string>) => onValueChange(event.target.value)}
        inputProps={ariaLabel ? { "aria-label": ariaLabel } : undefined}
        renderValue={renderValue}
        sx={{ ...appMuiSelectSx, ...sx }}
        MenuProps={{
          MenuListProps: {
            sx: {
              py: 0.5,
            },
          },
          PaperProps: {
            sx: {
              mt: 1,
              borderRadius: "1rem",
              boxShadow: "0 18px 50px rgba(15,23,42,0.14)",
              overflow: "hidden",
              "& .MuiMenuItem-root": {
                minHeight: 40,
                alignItems: "center",
                px: 1.75,
                py: 1,
                fontSize: "0.9rem",
                fontWeight: 500,
              },
              "& .MuiMenuItem-root.Mui-selected": {
                backgroundColor: "rgba(226, 232, 240, 0.85)",
              },
              "& .MuiMenuItem-root.Mui-selected:hover": {
                backgroundColor: "rgba(226, 232, 240, 1)",
              },
            },
          },
        }}
      >
        {options.map((option) => (
          <MenuItem key={String(option.value)} value={String(option.value)} disabled={option.disabled}>
            {option.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
