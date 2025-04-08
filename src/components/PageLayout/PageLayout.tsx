import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Button,
  IconButton,
  Tooltip,
  useTheme,
} from '@mui/material';
import {
  Add as AddIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';

interface PageLayoutProps {
  title: string;
  children: React.ReactNode;
  onAdd?: () => void;
  onRefresh?: () => void;
  onFilter?: () => void;
  addButtonText?: string;
  showAddButton?: boolean;
  showRefreshButton?: boolean;
  showFilterButton?: boolean;
}

const PageLayout: React.FC<PageLayoutProps> = ({
  title,
  children,
  onAdd,
  onRefresh,
  onFilter,
  addButtonText = 'Add New',
  showAddButton = true,
  showRefreshButton = true,
  showFilterButton = true,
}) => {
  const theme = useTheme();

  return (
    <Box sx={{ width: '100%' }}>
      <Paper 
        elevation={0} 
        sx={{ 
          p: 3, 
          mb: 3,
          background: theme.palette.background.paper,
          borderRadius: 2,
          border: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6}>
            <Typography variant="h5" component="h1" sx={{ fontWeight: 600 }}>
              {title}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
              {showFilterButton && (
                <Tooltip title="Filter">
                  <IconButton onClick={onFilter} color="primary">
                    <FilterIcon />
                  </IconButton>
                </Tooltip>
              )}
              {showRefreshButton && (
                <Tooltip title="Refresh">
                  <IconButton onClick={onRefresh} color="primary">
                    <RefreshIcon />
                  </IconButton>
                </Tooltip>
              )}
              {showAddButton && (
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={onAdd}
                  sx={{
                    borderRadius: 2,
                    textTransform: 'none',
                    px: 3,
                    py: 1,
                    boxShadow: 'none',
                    '&:hover': {
                      boxShadow: 'none',
                    },
                  }}
                >
                  {addButtonText}
                </Button>
              )}
            </Box>
          </Grid>
        </Grid>
      </Paper>
      <Paper 
        elevation={0}
        sx={{ 
          p: 3,
          background: theme.palette.background.paper,
          borderRadius: 2,
          border: `1px solid ${theme.palette.divider}`,
        }}
      >
        {children}
      </Paper>
    </Box>
  );
};

export default PageLayout; 