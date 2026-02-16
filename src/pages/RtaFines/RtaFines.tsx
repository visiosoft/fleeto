import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert,
  Chip,
  Grid,
  useTheme,
} from '@mui/material';
import {
  Warning as WarningIcon,
  DirectionsCar as CarIcon,
  CalendarToday as CalendarIcon,
  MonetizationOn as MoneyIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { API_ENDPOINTS } from '../../config/environment';

interface RtaFine {
  _id?: string;
  vehicle_info: string;
  date_time: string;
  amount: string;
  source: string;
  black_points: string;
  created_at: {
    $date: string;
  };
}

interface RtaTotal {
  type: string;
  last_updated: {
    $date: string;
  };
  total_amount: string;
}

const RtaFines: React.FC = () => {
  const theme = useTheme();
  const [fines, setFines] = useState<RtaFine[]>([]);
  const [totalFines, setTotalFines] = useState<RtaTotal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchFinesData();
  }, []);

  const fetchFinesData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // Fetch total fines
      const totalResponse = await axios.get(API_ENDPOINTS.rtaFines.total, { headers });
      console.log('RTA Total Fines Response:', totalResponse.data);
      if (totalResponse.data.status === 'success') {
        setTotalFines(totalResponse.data.data);
      }

      // Fetch all fines
      const finesResponse = await axios.get(API_ENDPOINTS.rtaFines.all, { headers });
      console.log('RTA All Fines Response:', finesResponse.data);
      if (finesResponse.data.status === 'success') {
        setFines(finesResponse.data.data.fines);
      }
    } catch (err: any) {
      console.error('Error fetching RTA fines:', err);
      setError(err.response?.data?.message || 'Failed to fetch RTA fines data');
    } finally {
      setLoading(false);
    }
  };

  const extractAmount = (amountString: string): string => {
    // Extract number from strings like "Pay all AED 2,000" or "AED 100"
    const match = amountString.match(/AED\s*([\d,]+)/);
    return match ? match[1] : '0';
  };

  const parseAmount = (amountString: string): number => {
    const numStr = extractAmount(amountString).replace(/,/g, '');
    return parseFloat(numStr) || 0;
  };

  if (loading) {
    return (
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={60} />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Loading RTA fines data...
          </Typography>
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  const totalAmount = totalFines ? parseAmount(totalFines.total_amount) : 0;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        RTA Fines & Violations
      </Typography>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Card
            sx={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E5E7EB',
              borderRadius: '12px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box
                  sx={{
                    backgroundColor: `${theme.palette.error.main}15`,
                    borderRadius: '8px',
                    p: 1,
                    mr: 2,
                  }}
                >
                  <MoneyIcon sx={{ color: theme.palette.error.main }} />
                </Box>
                <Typography variant="h6" sx={{ fontSize: '14px', fontWeight: 600, color: '#374151' }}>
                  Total Fines Amount
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontSize: '28px', fontWeight: 700, color: '#111827', mb: 1 }}>
                AED {totalAmount.toLocaleString()}
              </Typography>
              <Typography variant="body2" sx={{ fontSize: '13px', fontWeight: 500, color: '#6B7280' }}>
                {totalFines?.total_amount || 'No fines'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card
            sx={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E5E7EB',
              borderRadius: '12px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box
                  sx={{
                    backgroundColor: `${theme.palette.warning.main}15`,
                    borderRadius: '8px',
                    p: 1,
                    mr: 2,
                  }}
                >
                  <WarningIcon sx={{ color: theme.palette.warning.main }} />
                </Box>
                <Typography variant="h6" sx={{ fontSize: '14px', fontWeight: 600, color: '#374151' }}>
                  Total Violations
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontSize: '28px', fontWeight: 700, color: '#111827', mb: 1 }}>
                {fines.length}
              </Typography>
              <Typography variant="body2" sx={{ fontSize: '13px', fontWeight: 500, color: '#6B7280' }}>
                Active violations
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card
            sx={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E5E7EB',
              borderRadius: '12px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box
                  sx={{
                    backgroundColor: `${theme.palette.info.main}15`,
                    borderRadius: '8px',
                    p: 1,
                    mr: 2,
                  }}
                >
                  <CalendarIcon sx={{ color: theme.palette.info.main }} />
                </Box>
                <Typography variant="h6" sx={{ fontSize: '14px', fontWeight: 600, color: '#374151' }}>
                  Last Updated
                </Typography>
              </Box>
              <Typography variant="h6" sx={{ fontSize: '16px', fontWeight: 600, color: '#111827', mb: 1 }}>
                {totalFines?.last_updated
                  ? new Date(totalFines.last_updated.$date).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })
                  : 'N/A'}
              </Typography>
              <Typography variant="body2" sx={{ fontSize: '13px', fontWeight: 500, color: '#6B7280' }}>
                {totalFines?.last_updated
                  ? new Date(totalFines.last_updated.$date).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : ''}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Fines Table */}
      <Card
        sx={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #E5E7EB',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        }}
      >
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
            All Fines & Violations
          </Typography>
          
          {fines.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <WarningIcon sx={{ fontSize: 64, color: theme.palette.text.disabled, mb: 2 }} />
              <Typography variant="body1" color="text.secondary">
                No fines found
              </Typography>
            </Box>
          ) : (
            <TableContainer component={Paper} sx={{ borderRadius: '12px', boxShadow: 'none' }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#F9FAFB' }}>
                    <TableCell sx={{ fontWeight: 600, color: '#374151', fontSize: '13px' }}>
                      Vehicle Info
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#374151', fontSize: '13px' }}>
                      Date & Time
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#374151', fontSize: '13px' }}>
                      Amount
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#374151', fontSize: '13px' }}>
                      Source
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#374151', fontSize: '13px' }}>
                      Black Points
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {fines.map((fine, index) => (
                    <TableRow
                      key={fine._id || index}
                      sx={{
                        '&:nth-of-type(even)': { backgroundColor: '#F9FAFB' },
                        '&:hover': { backgroundColor: '#F1F5F9' },
                        transition: 'background-color 0.2s',
                      }}
                    >
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CarIcon sx={{ color: theme.palette.primary.main, fontSize: '20px' }} />
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {fine.vehicle_info}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{fine.date_time}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={fine.amount}
                          color="error"
                          size="small"
                          sx={{ fontWeight: 600, fontSize: '12px' }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontSize: '13px' }}>
                          {fine.source}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {fine.black_points !== '-' ? (
                          <Chip
                            label={fine.black_points}
                            color="warning"
                            size="small"
                            sx={{ fontWeight: 600, fontSize: '12px' }}
                          />
                        ) : (
                          <Typography variant="body2" sx={{ fontSize: '13px', color: '#6B7280' }}>
                            -
                          </Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default RtaFines;
