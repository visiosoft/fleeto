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
  CircularProgress,
  alpha,
  Chip,
  Stack
} from '@mui/material';
import {
  Assessment as AssessmentIcon,
  DirectionsCar as VehicleIcon,
  People as DriverIcon,
  LocalGasStation as FuelIcon,
  Build as MaintenanceIcon,
  MonetizationOn as CostIcon,
  Gavel as ContractIcon,
  Download as DownloadIcon,
  Print as PrintIcon,
  PictureAsPdf as PdfIcon,
  TableChart as TableIcon,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  Timeline as TimelineIcon,
  TrendingUp as TrendingUpIcon,
  ArrowForward as ArrowForwardIcon,
  InsertDriveFile as FileIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import moment from 'moment';

interface ReportCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  onGenerate?: () => void;
  linkTo?: string;
  badge?: string;
}

const ReportCard: React.FC<ReportCardProps> = ({ title, description, icon, color, onGenerate, linkTo, badge }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  
  const handleClick = () => {
    if (linkTo) {
      navigate(linkTo);
    } else if (onGenerate) {
      onGenerate();
    }
  };
  
  return (
    <Card 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        cursor: linkTo || onGenerate ? 'pointer' : 'default',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        backgroundColor: '#FFFFFF',
        border: '1px solid #E5E7EB',
        borderRadius: '16px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        overflow: 'hidden',
        position: 'relative',
        '&:hover': (linkTo || onGenerate) ? {
          transform: 'translateY(-8px)',
          boxShadow: '0 12px 24px rgba(0, 0, 0, 0.12)',
          borderColor: color,
        } : {},
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: `linear-gradient(90deg, ${color}, ${alpha(color, 0.6)})`,
          opacity: 0,
          transition: 'opacity 0.3s ease',
        },
        '&:hover::before': {
          opacity: 1,
        }
      }}
      onClick={linkTo ? handleClick : undefined}
    >
      <CardContent sx={{ flexGrow: 1, p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
          <Box
            sx={{
              width: 56,
              height: 56,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '14px',
              background: `linear-gradient(135deg, ${alpha(color, 0.1)}, ${alpha(color, 0.05)})`,
              border: `1px solid ${alpha(color, 0.2)}`,
              transition: 'all 0.3s ease',
            }}
          >
            {React.cloneElement(icon as React.ReactElement, { 
              sx: { 
                color: color,
                fontSize: 28
              } 
            })}
          </Box>
          {badge && (
            <Chip 
              label={badge} 
              size="small" 
              sx={{ 
                bgcolor: alpha(color, 0.1),
                color: color,
                fontWeight: 600,
                fontSize: '11px',
                height: '24px',
              }} 
            />
          )}
        </Box>
        
        <Typography 
          variant="h6" 
          component="h2"
          sx={{
            fontWeight: 700,
            fontSize: '18px',
            color: '#111827',
            mb: 1,
            lineHeight: 1.3,
          }}
        >
          {title}
        </Typography>
        
        <Typography 
          variant="body2" 
          sx={{
            color: '#6B7280',
            fontSize: '14px',
            lineHeight: 1.6,
          }}
        >
          {description}
        </Typography>
      </CardContent>
      
      <Divider />
      
      <CardActions sx={{ p: 2, pt: 1.5 }}>
        {linkTo ? (
          <Button 
            fullWidth
            size="medium"
            endIcon={<ArrowForwardIcon />}
            sx={{ 
              color: color,
              fontWeight: 600,
              fontSize: '14px',
              textTransform: 'none',
              '&:hover': {
                bgcolor: alpha(color, 0.08),
              }
            }}
          >
            View Report
          </Button>
        ) : (
          <Button 
            fullWidth
            size="medium"
            startIcon={<DownloadIcon />}
            onClick={onGenerate}
            sx={{ 
              color: color,
              fontWeight: 600,
              fontSize: '14px',
              textTransform: 'none',
              '&:hover': {
                bgcolor: alpha(color, 0.08),
              }
            }}
          >
            Generate Report
          </Button>
        )}
      </CardActions>
    </Card>
  );
};

const Reports: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
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

  const reportCategories: Array<{
    title: string;
    reports: Array<{
      title: string;
      description: string;
      icon: React.ReactNode;
      color: string;
      linkTo?: string;
      badge?: string;
    }>;
  }> = [
    {
      title: 'Profit & Loss',
      reports: [
        {
          title: 'Monthly Financial Report',
          description: 'Comprehensive analysis of contract revenue, expenses, and profitability by month',
          icon: <TrendingUpIcon />,
          color: theme.palette.success.main,
          linkTo: '/monthly-report',
          badge: 'New'
        }
      ]
    },
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
    <Box sx={{ width: '100%', maxWidth: '100%', p: 3 }}>
      {/* Header Section */}
      <Box sx={{ mb: 5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                color: '#111827',
                mb: 1,
                fontSize: '32px',
              }}
            >
              Reports & Analytics
            </Typography>
            <Typography 
              variant="body1" 
              sx={{ 
                color: '#6B7280',
                fontSize: '15px',
              }}
            >
              Generate comprehensive reports and insights for your fleet operations
            </Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <Tooltip title="Export as PDF">
              <IconButton
                sx={{
                  bgcolor: alpha(theme.palette.error.main, 0.1),
                  color: theme.palette.error.main,
                  '&:hover': {
                    bgcolor: alpha(theme.palette.error.main, 0.2),
                  }
                }}
              >
                <PdfIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Export as Excel">
              <IconButton
                sx={{
                  bgcolor: alpha(theme.palette.success.main, 0.1),
                  color: theme.palette.success.main,
                  '&:hover': {
                    bgcolor: alpha(theme.palette.success.main, 0.2),
                  }
                }}
              >
                <TableIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Print Report">
              <IconButton
                sx={{
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  color: theme.palette.primary.main,
                  '&:hover': {
                    bgcolor: alpha(theme.palette.primary.main, 0.2),
                  }
                }}
              >
                <PrintIcon />
              </IconButton>
            </Tooltip>
          </Stack>
        </Box>
      </Box>

      {/* Tabs Section */}
      <Paper 
        sx={{ 
          mb: 4,
          borderRadius: '16px',
          overflow: 'hidden',
          border: '1px solid #E5E7EB',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        }}
      >
        <Tabs
          value={selectedTab}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            px: 2,
            '& .MuiTab-root': {
              fontWeight: 600,
              fontSize: '15px',
              textTransform: 'none',
              minHeight: '64px',
              px: 3,
            },
            '& .MuiTabs-indicator': {
              height: '3px',
              borderRadius: '3px 3px 0 0',
            }
          }}
        >
          {reportCategories.map((category, index) => (
            <Tab 
              key={index} 
              label={category.title}
              icon={index === 0 ? <TrendingUpIcon sx={{ fontSize: 20 }} /> : undefined}
              iconPosition="start"
            />
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
              onGenerate={report.linkTo ? undefined : () => handleGenerateReport(report.title)}
              linkTo={report.linkTo}
              badge={report.badge}
            />
          </Grid>
        ))}
      </Grid>

      {/* Loading Overlay */}
      {isGenerating && (
        <Box 
          sx={{ 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            bgcolor: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)',
            zIndex: 9999
          }}
        >
          <Paper 
            sx={{ 
              p: 4, 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center',
              borderRadius: '16px',
              minWidth: '280px',
            }}
          >
            <CircularProgress size={48} />
            <Typography sx={{ mt: 3, fontWeight: 600, fontSize: '16px' }}>
              Generating Report...
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Please wait while we prepare your data
            </Typography>
          </Paper>
        </Box>
      )}
    </Box>
  );
};

export default Reports; 