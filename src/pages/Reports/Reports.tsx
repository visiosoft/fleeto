import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Card,
  CardContent,
  CardActions,
  Button,
  IconButton,
  Tooltip,
  useTheme,
  Divider,
  Tabs,
  Tab,
  CircularProgress
} from '@mui/material';
import {
  Assessment as AssessmentIcon,
  DirectionsCar as VehicleIcon,
  People as DriverIcon,
  LocalGasStation as FuelIcon,
  Build as MaintenanceIcon,
  MonetizationOn as CostIcon,
  Description as ContractIcon,
  Download as DownloadIcon,
  Print as PrintIcon,
  PictureAsPdf as PdfIcon,
  TableChart as TableIcon,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  Timeline as TimelineIcon
} from '@mui/icons-material';
import moment from 'moment';

interface ReportCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  onGenerate: () => void;
}

const ReportCard: React.FC<ReportCardProps> = ({ title, description, icon, color, onGenerate }) => {
  const theme = useTheme();
  
  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            bgcolor: color + '15', 
            p: 1, 
            borderRadius: 2,
            mr: 2
          }}>
            {React.cloneElement(icon as React.ReactElement, { sx: { color: color } })}
          </Box>
          <Typography variant="h6" component="h2">
            {title}
          </Typography>
        </Box>
        <Typography variant="body2" color="textSecondary">
          {description}
        </Typography>
      </CardContent>
      <CardActions>
        <Button 
          size="small" 
          startIcon={<DownloadIcon />}
          onClick={onGenerate}
          sx={{ color: color }}
        >
          Generate Report
        </Button>
      </CardActions>
    </Card>
  );
};

const Reports: React.FC = () => {
  const theme = useTheme();
  const [selectedTab, setSelectedTab] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
  };

  const handleGenerateReport = async (reportType: string) => {
    setIsGenerating(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log(`Generating ${reportType} report...`);
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const reportCategories = [
    {
      title: 'Vehicle Reports',
      reports: [
        {
          title: 'Vehicle Utilization Report',
          description: 'Track vehicle usage, availability, and efficiency metrics',
          icon: <VehicleIcon />,
          color: theme.palette.primary.main
        },
        {
          title: 'Maintenance Schedule Report',
          description: 'View upcoming and past maintenance schedules',
          icon: <MaintenanceIcon />,
          color: theme.palette.warning.main
        },
        {
          title: 'Vehicle Performance Report',
          description: 'Analyze vehicle performance and reliability metrics',
          icon: <TimelineIcon />,
          color: theme.palette.info.main
        }
      ]
    },
    {
      title: 'Financial Reports',
      reports: [
        {
          title: 'Cost Analysis Report',
          description: 'Detailed breakdown of operational costs',
          icon: <CostIcon />,
          color: theme.palette.success.main
        },
        {
          title: 'Fuel Consumption Report',
          description: 'Track fuel usage and efficiency metrics',
          icon: <FuelIcon />,
          color: theme.palette.error.main
        },
        {
          title: 'Contract Financial Report',
          description: 'Financial overview of all active contracts',
          icon: <ContractIcon />,
          color: theme.palette.secondary.main
        }
      ]
    },
    {
      title: 'Driver Reports',
      reports: [
        {
          title: 'Driver Performance Report',
          description: 'Evaluate driver performance and safety metrics',
          icon: <DriverIcon />,
          color: theme.palette.primary.main
        },
        {
          title: 'Driver Schedule Report',
          description: 'View driver assignments and schedules',
          icon: <TimelineIcon />,
          color: theme.palette.warning.main
        },
        {
          title: 'Driver Compliance Report',
          description: 'Track driver compliance with regulations',
          icon: <AssessmentIcon />,
          color: theme.palette.info.main
        }
      ]
    }
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4">Reports</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Export as PDF">
            <IconButton>
              <PdfIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Export as Excel">
            <IconButton>
              <TableIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Print Report">
            <IconButton>
              <PrintIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={selectedTab}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="scrollable"
          scrollButtons="auto"
        >
          {reportCategories.map((category, index) => (
            <Tab key={index} label={category.title} />
          ))}
        </Tabs>
      </Paper>

      <Grid container spacing={3}>
        {reportCategories[selectedTab].reports.map((report, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <ReportCard
              title={report.title}
              description={report.description}
              icon={report.icon}
              color={report.color}
              onGenerate={() => handleGenerateReport(report.title)}
            />
          </Grid>
        ))}
      </Grid>

      {isGenerating && (
        <Box sx={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          bgcolor: 'rgba(0,0,0,0.5)',
          zIndex: 9999
        }}>
          <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <CircularProgress />
            <Typography sx={{ mt: 2 }}>Generating Report...</Typography>
          </Paper>
        </Box>
      )}
    </Box>
  );
};

export default Reports; 