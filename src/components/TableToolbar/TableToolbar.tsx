import React from 'react';
import {
  Box,
  TextField,
  InputAdornment,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  SelectChangeEvent,
  Stack,
  Paper,
} from '@mui/material';
import {
  Search as SearchIcon,
  Sort as SortIcon,
} from '@mui/icons-material';

export interface SortOption {
  value: string;
  label: string;
}

interface TableToolbarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  sortValue: string;
  onSortChange: (value: string) => void;
  sortOptions: SortOption[];
  sortLabel?: string;
}

const TableToolbar: React.FC<TableToolbarProps> = ({
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search...',
  sortValue,
  onSortChange,
  sortOptions,
  sortLabel = 'Sort By',
}) => {
  const handleSortChange = (event: SelectChangeEvent) => {
    onSortChange(event.target.value);
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        mb: 3,
        border: '1px solid #E5E7EB',
        borderRadius: '12px',
        backgroundColor: '#FFFFFF',
      }}
    >
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        alignItems={{ xs: 'stretch', sm: 'center' }}
      >
        {/* Search Field */}
        <TextField
          fullWidth
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: '#6B7280' }} />
              </InputAdornment>
            ),
          }}
          sx={{
            flex: 1,
            '& .MuiOutlinedInput-root': {
              backgroundColor: '#F9FAFB',
              '&:hover': {
                backgroundColor: '#F3F4F6',
              },
              '&.Mui-focused': {
                backgroundColor: '#FFFFFF',
              },
            },
          }}
        />

        {/* Sort Dropdown */}
        <FormControl
          sx={{
            minWidth: { xs: '100%', sm: 200 },
            '& .MuiOutlinedInput-root': {
              backgroundColor: '#F9FAFB',
              '&:hover': {
                backgroundColor: '#F3F4F6',
              },
              '&.Mui-focused': {
                backgroundColor: '#FFFFFF',
              },
            },
          }}
        >
          <InputLabel id="sort-select-label">{sortLabel}</InputLabel>
          <Select
            labelId="sort-select-label"
            value={sortValue}
            label={sortLabel}
            onChange={handleSortChange}
            startAdornment={
              <InputAdornment position="start">
                <SortIcon sx={{ color: '#6B7280', ml: -0.5 }} />
              </InputAdornment>
            }
          >
            {sortOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>
    </Paper>
  );
};

export default TableToolbar;
