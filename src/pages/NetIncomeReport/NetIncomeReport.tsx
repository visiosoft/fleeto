import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Grid,
    Paper,
    Card,
    CardContent,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    SelectChangeEvent,
    alpha,
    CircularProgress,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
} from '@mui/material';
import {
    TrendingUp as TrendingUpIcon,
    TrendingDown as TrendingDownIcon,
    AttachMoney as MoneyIcon,
    CalendarToday as CalendarIcon,
} from '@mui/icons-material';
import { ResponsiveLine } from '@nivo/line';
import { ResponsiveBar } from '@nivo/bar';
import moment from 'moment';
import axios from 'axios';
import { API_ENDPOINTS } from '../../config/environment';

interface Vehicle {
    _id: string;
    licensePlate: string;
    make: string;
    model: string;
}

interface MonthlyNetIncome {
    month: string;
    year: number;
    income: number;
    expenses: number;
    netIncome: number;
    profitMargin: number;
}

const NetIncomeReport: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [selectedVehicles, setSelectedVehicles] = useState<string[]>([]);
    const [selectedYear, setSelectedYear] = useState(moment().format('YYYY'));
    const [monthlyData, setMonthlyData] = useState<MonthlyNetIncome[]>([]);
    const [totalIncome, setTotalIncome] = useState(0);
    const [totalExpenses, setTotalExpenses] = useState(0);
    const [totalNetIncome, setTotalNetIncome] = useState(0);
    const [averageMargin, setAverageMargin] = useState(0);

    // Fetch vehicles
    useEffect(() => {
        const fetchVehicles = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get(API_ENDPOINTS.vehicles, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (response.data) {
                    setVehicles(response.data);
                }
            } catch (error) {
                console.error('Error fetching vehicles:', error);
            }
        };
        fetchVehicles();
    }, []);

    useEffect(() => {
        fetchNetIncomeData();
    }, [selectedYear, selectedVehicles]);

    const fetchNetIncomeData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');

            // Fetch expenses and contracts
            const [expensesRes, contractsRes] = await Promise.all([
                axios.get(API_ENDPOINTS.costs.all, {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                axios.get(API_ENDPOINTS.contracts, {
                    headers: { Authorization: `Bearer ${token}` }
                })
            ]);

            console.log('Expenses Response:', expensesRes.data);
            console.log('Contracts Response:', contractsRes.data);

            // Generate months for selected year (up to current month if current year)
            const months: MonthlyNetIncome[] = [];
            const currentYear = moment().year();
            const currentMonth = moment().month(); // 0-based (0 = January)
            const selectedYearNum = parseInt(selectedYear);

            // Determine how many months to show
            const monthsToShow = selectedYearNum === currentYear ? currentMonth + 1 : 12;

            for (let i = 0; i < monthsToShow; i++) {
                const date = moment(`${selectedYear}-${i + 1}-01`, 'YYYY-M-DD');
                months.push({
                    month: date.format('MMM'),
                    year: selectedYearNum,
                    income: 0,
                    expenses: 0,
                    netIncome: 0,
                    profitMargin: 0,
                });
            }

            // Calculate monthly expenses (filter by selected vehicles if any)
            if (expensesRes.data?.vehicles) {
                expensesRes.data.vehicles.forEach((vehicle: any) => {
                    // Skip if vehicle filter is active and this vehicle is not selected
                    if (selectedVehicles.length > 0 && !selectedVehicles.includes(vehicle.vehicleId)) {
                        return;
                    }

                    vehicle.details?.forEach((expense: any) => {
                        const expenseDate = moment(expense.date);
                        if (expenseDate.year() === parseInt(selectedYear)) {
                            const monthIndex = expenseDate.month();
                            months[monthIndex].expenses += expense.amount || 0;
                        }
                    });
                });
            }

            console.log('Expenses by month:', months.map(m => ({ month: m.month, expenses: m.expenses })));

            // Calculate monthly income from active contracts
            const contractsData = contractsRes.data?.data || contractsRes.data;
            if (Array.isArray(contractsData)) {
                console.log('Processing contracts:', contractsData.length);

                contractsData.forEach((contract: any) => {
                    // Skip if vehicle filter is active and this contract's vehicle is not selected
                    if (selectedVehicles.length > 0 && !selectedVehicles.includes(contract.vehicleId)) {
                        return;
                    }

                    if (contract.status === 'Active' && contract.value) {
                        const startDate = moment(contract.startDate);
                        const endDate = contract.endDate ? moment(contract.endDate) : moment();

                        console.log(`Contract: ${contract._id}, Value: ${contract.value}, Start: ${startDate.format('YYYY-MM-DD')}, End: ${endDate.format('YYYY-MM-DD')}`);

                        // For each month, check if contract is active and add the contract value
                        months.forEach((monthData, index) => {
                            const monthStart = moment(`${selectedYear}-${index + 1}-01`, 'YYYY-M-DD').startOf('month');
                            const monthEnd = monthStart.clone().endOf('month');

                            // If contract was active during this month, add the full contract value
                            if (startDate.isSameOrBefore(monthEnd) && endDate.isSameOrAfter(monthStart)) {
                                monthData.income += contract.value;
                                console.log(`  Added ${contract.value} to ${monthData.month}`);
                            }
                        });
                    }
                });
            }

            console.log('Income by month:', months.map(m => ({ month: m.month, income: m.income })));

            // Calculate net income and profit margin for each month
            months.forEach(monthData => {
                monthData.netIncome = monthData.income - monthData.expenses;
                monthData.profitMargin = monthData.income > 0
                    ? (monthData.netIncome / monthData.income) * 100
                    : 0;
            });

            // Calculate totals
            const yearTotalIncome = months.reduce((sum, m) => sum + m.income, 0);
            const yearTotalExpenses = months.reduce((sum, m) => sum + m.expenses, 0);
            const yearTotalNetIncome = yearTotalIncome - yearTotalExpenses;
            const yearAverageMargin = yearTotalIncome > 0
                ? (yearTotalNetIncome / yearTotalIncome) * 100
                : 0;

            setMonthlyData(months);
            setTotalIncome(yearTotalIncome);
            setTotalExpenses(yearTotalExpenses);
            setTotalNetIncome(yearTotalNetIncome);
            setAverageMargin(yearAverageMargin);

        } catch (error) {
            console.error('Error fetching net income data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleYearChange = (event: SelectChangeEvent) => {
        setSelectedYear(event.target.value);
    };

    const handleVehicleChange = (event: SelectChangeEvent<string[]>) => {
        setSelectedVehicles(event.target.value as string[]);
    };

    // Generate last 5 years for dropdown
    const yearOptions = Array.from({ length: 5 }, (_, i) => {
        const year = moment().subtract(i, 'years').format('YYYY');
        return { value: year, label: year };
    });

    // Prepare chart data
    const lineChartData = [
        {
            id: 'Income',
            color: '#10B981',
            data: monthlyData.map(m => ({ x: m.month, y: m.income })),
        },
        {
            id: 'Expenses',
            color: '#EF4444',
            data: monthlyData.map(m => ({ x: m.month, y: m.expenses })),
        },
        {
            id: 'Net Income',
            color: '#8B5CF6',
            data: monthlyData.map(m => ({ x: m.month, y: m.netIncome })),
        },
    ];

    const barChartData = monthlyData.map(m => ({
        month: m.month,
        Income: m.income,
        Expenses: m.expenses,
        'Net Income': m.netIncome,
    }));

    return (
        <Box sx={{ width: '100%' }}>
            {/* Filters */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} md={3}>
                    <FormControl fullWidth>
                        <InputLabel>Select Year</InputLabel>
                        <Select
                            value={selectedYear}
                            label="Select Year"
                            onChange={handleYearChange}
                            sx={{
                                borderRadius: 2,
                                '& .MuiOutlinedInput-notchedOutline': {
                                    borderColor: '#e5e7eb',
                                },
                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                    borderColor: '#7c3aed',
                                },
                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                    borderColor: '#7c3aed',
                                    borderWidth: 2,
                                },
                            }}
                        >
                            {yearOptions.map((option) => (
                                <MenuItem key={option.value} value={option.value}>
                                    {option.label}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Grid>
                <Grid item xs={12} md={9}>
                    <FormControl fullWidth>
                        <InputLabel>Filter Vehicles (Optional)</InputLabel>
                        <Select
                            multiple
                            value={selectedVehicles}
                            label="Filter Vehicles (Optional)"
                            onChange={handleVehicleChange}
                            renderValue={(selected) => (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                    {selected.length === 0 ? (
                                        <Typography variant="body2" color="text.secondary">All Vehicles</Typography>
                                    ) : (
                                        selected.map((value) => {
                                            const vehicle = vehicles.find(v => v._id === value);
                                            return (
                                                <Chip
                                                    key={value}
                                                    label={vehicle?.licensePlate || value}
                                                    size="small"
                                                    sx={{ bgcolor: alpha('#667eea', 0.1), color: '#667eea' }}
                                                />
                                            );
                                        })
                                    )}
                                </Box>
                            )}
                            sx={{
                                borderRadius: 2,
                                '& .MuiOutlinedInput-notchedOutline': {
                                    borderColor: '#e5e7eb',
                                },
                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                    borderColor: '#7c3aed',
                                },
                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                    borderColor: '#7c3aed',
                                    borderWidth: 2,
                                },
                            }}
                        >
                            {vehicles.map((vehicle) => (
                                <MenuItem key={vehicle._id} value={vehicle._id}>
                                    {vehicle.licensePlate} - {vehicle.make} {vehicle.model}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Grid>
            </Grid>

            {loading ? (
                <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                    <CircularProgress sx={{ color: '#667eea' }} size={60} />
                </Box>
            ) : (
                <>
                    {/* Summary Cards */}
                    <Grid container spacing={3} sx={{ mb: 4 }}>
                        <Grid item xs={12} md={3}>
                            <Card
                                sx={{
                                    height: '100%',
                                    backgroundColor: '#FFFFFF',
                                    border: '1px solid #E5E7EB',
                                    borderRadius: '12px',
                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                    transition: 'all 0.2s ease',
                                    '&:hover': {
                                        transform: 'translateY(-4px)',
                                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                                    },
                                }}
                            >
                                <CardContent sx={{ p: 3 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                        <Box
                                            sx={{
                                                backgroundColor: alpha('#10B981', 0.1),
                                                borderRadius: '8px',
                                                p: 1,
                                                mr: 2,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                            }}
                                        >
                                            <TrendingUpIcon sx={{ color: '#10B981', fontSize: 24 }} />
                                        </Box>
                                        <Typography variant="h6" sx={{ fontSize: '14px', fontWeight: 600, color: '#374151' }}>
                                            Total Income
                                        </Typography>
                                    </Box>
                                    <Typography variant="h4" sx={{ mb: 2, fontSize: '28px', fontWeight: 700, color: '#111827' }}>
                                        {totalIncome.toLocaleString('en-AE', { style: 'currency', currency: 'AED' })}
                                    </Typography>
                                    <Box sx={{ height: 6, borderRadius: 9999, backgroundColor: alpha('#10B981', 0.2), overflow: 'hidden' }}>
                                        <Box sx={{ height: '100%', width: '100%', backgroundColor: '#10B981', borderRadius: 9999 }} />
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>

                        <Grid item xs={12} md={3}>
                            <Card
                                sx={{
                                    height: '100%',
                                    backgroundColor: '#FFFFFF',
                                    border: '1px solid #E5E7EB',
                                    borderRadius: '12px',
                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                    transition: 'all 0.2s ease',
                                    '&:hover': {
                                        transform: 'translateY(-4px)',
                                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                                    },
                                }}
                            >
                                <CardContent sx={{ p: 3 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                        <Box
                                            sx={{
                                                backgroundColor: alpha('#EF4444', 0.1),
                                                borderRadius: '8px',
                                                p: 1,
                                                mr: 2,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                            }}
                                        >
                                            <TrendingDownIcon sx={{ color: '#EF4444', fontSize: 24 }} />
                                        </Box>
                                        <Typography variant="h6" sx={{ fontSize: '14px', fontWeight: 600, color: '#374151' }}>
                                            Total Expenses
                                        </Typography>
                                    </Box>
                                    <Typography variant="h4" sx={{ mb: 2, fontSize: '28px', fontWeight: 700, color: '#111827' }}>
                                        {totalExpenses.toLocaleString('en-AE', { style: 'currency', currency: 'AED' })}
                                    </Typography>
                                    <Box sx={{ height: 6, borderRadius: 9999, backgroundColor: alpha('#EF4444', 0.2), overflow: 'hidden' }}>
                                        <Box sx={{ height: '100%', width: '85%', backgroundColor: '#EF4444', borderRadius: 9999 }} />
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>

                        <Grid item xs={12} md={3}>
                            <Card
                                sx={{
                                    height: '100%',
                                    backgroundColor: '#FFFFFF',
                                    border: '1px solid #E5E7EB',
                                    borderRadius: '12px',
                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                    transition: 'all 0.2s ease',
                                    '&:hover': {
                                        transform: 'translateY(-4px)',
                                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                                    },
                                }}
                            >
                                <CardContent sx={{ p: 3 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                        <Box
                                            sx={{
                                                backgroundColor: totalNetIncome >= 0 ? alpha('#8B5CF6', 0.1) : alpha('#F59E0B', 0.1),
                                                borderRadius: '8px',
                                                p: 1,
                                                mr: 2,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                            }}
                                        >
                                            <MoneyIcon sx={{ color: totalNetIncome >= 0 ? '#8B5CF6' : '#F59E0B', fontSize: 24 }} />
                                        </Box>
                                        <Typography variant="h6" sx={{ fontSize: '14px', fontWeight: 600, color: '#374151' }}>
                                            Net Income
                                        </Typography>
                                    </Box>
                                    <Typography
                                        variant="h4"
                                        sx={{
                                            mb: 2,
                                            fontSize: '28px',
                                            fontWeight: 700,
                                            color: totalNetIncome >= 0 ? '#111827' : '#F59E0B'
                                        }}
                                    >
                                        {totalNetIncome.toLocaleString('en-AE', { style: 'currency', currency: 'AED' })}
                                    </Typography>
                                    <Box
                                        sx={{
                                            height: 6,
                                            borderRadius: 9999,
                                            backgroundColor: totalNetIncome >= 0 ? alpha('#8B5CF6', 0.2) : alpha('#F59E0B', 0.2),
                                            overflow: 'hidden'
                                        }}
                                    >
                                        <Box
                                            sx={{
                                                height: '100%',
                                                width: '70%',
                                                backgroundColor: totalNetIncome >= 0 ? '#8B5CF6' : '#F59E0B',
                                                borderRadius: 9999
                                            }}
                                        />
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>

                        <Grid item xs={12} md={3}>
                            <Card
                                sx={{
                                    height: '100%',
                                    backgroundColor: '#FFFFFF',
                                    border: '1px solid #E5E7EB',
                                    borderRadius: '12px',
                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                    transition: 'all 0.2s ease',
                                    '&:hover': {
                                        transform: 'translateY(-4px)',
                                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                                    },
                                }}
                            >
                                <CardContent sx={{ p: 3 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                        <Box
                                            sx={{
                                                backgroundColor: alpha('#3B82F6', 0.1),
                                                borderRadius: '8px',
                                                p: 1,
                                                mr: 2,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                            }}
                                        >
                                            <CalendarIcon sx={{ color: '#3B82F6', fontSize: 24 }} />
                                        </Box>
                                        <Typography variant="h6" sx={{ fontSize: '14px', fontWeight: 600, color: '#374151' }}>
                                            Profit Margin
                                        </Typography>
                                    </Box>
                                    <Typography variant="h4" sx={{ mb: 2, fontSize: '28px', fontWeight: 700, color: '#111827' }}>
                                        {averageMargin.toFixed(1)}%
                                    </Typography>
                                    <Box sx={{ height: 6, borderRadius: 9999, backgroundColor: alpha('#3B82F6', 0.2), overflow: 'hidden' }}>
                                        <Box
                                            sx={{
                                                height: '100%',
                                                width: `${Math.min(Math.abs(averageMargin), 100)}%`,
                                                backgroundColor: '#3B82F6',
                                                borderRadius: 9999
                                            }}
                                        />
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>

                    {/* Charts */}
                    <Grid container spacing={3}>
                        {/* Line Chart */}
                        <Grid item xs={12}>
                            <Paper
                                sx={{
                                    p: 4,
                                    borderRadius: '16px',
                                    border: '1px solid #E5E7EB',
                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                    height: 500,
                                }}
                            >
                                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                                    Income vs Expenses Trend - {selectedYear}
                                </Typography>
                                <Box sx={{ height: 400 }}>
                                    <ResponsiveLine
                                        data={lineChartData}
                                        margin={{ top: 20, right: 120, bottom: 60, left: 80 }}
                                        xScale={{ type: 'point' }}
                                        yScale={{ type: 'linear', min: 'auto', max: 'auto' }}
                                        curve="monotoneX"
                                        axisBottom={{
                                            tickSize: 5,
                                            tickPadding: 10,
                                            tickRotation: 0,
                                            legend: 'Month',
                                            legendOffset: 45,
                                            legendPosition: 'middle',
                                        }}
                                        axisLeft={{
                                            tickSize: 5,
                                            tickPadding: 10,
                                            tickRotation: 0,
                                            legend: 'Amount (AED)',
                                            legendOffset: -60,
                                            legendPosition: 'middle',
                                            format: (value) => `${(value / 1000).toFixed(0)}k`,
                                        }}
                                        colors={{ datum: 'color' }}
                                        pointSize={10}
                                        pointColor={{ theme: 'background' }}
                                        pointBorderWidth={2}
                                        pointBorderColor={{ from: 'serieColor' }}
                                        pointLabelYOffset={-12}
                                        enableArea={true}
                                        areaOpacity={0.1}
                                        useMesh={true}
                                        enableSlices="x"
                                        legends={[
                                            {
                                                anchor: 'bottom-right',
                                                direction: 'column',
                                                justify: false,
                                                translateX: 100,
                                                translateY: 0,
                                                itemsSpacing: 0,
                                                itemDirection: 'left-to-right',
                                                itemWidth: 80,
                                                itemHeight: 20,
                                                symbolSize: 12,
                                                symbolShape: 'circle',
                                            },
                                        ]}
                                    />
                                </Box>
                            </Paper>
                        </Grid>

                        {/* Bar Chart */}
                        <Grid item xs={12}>
                            <Paper
                                sx={{
                                    p: 4,
                                    borderRadius: '16px',
                                    border: '1px solid #E5E7EB',
                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                    height: 500,
                                }}
                            >
                                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                                    Monthly Net Income Comparison - {selectedYear}
                                </Typography>
                                <Box sx={{ height: 400 }}>
                                    <ResponsiveBar
                                        data={barChartData}
                                        keys={['Income', 'Expenses', 'Net Income']}
                                        indexBy="month"
                                        margin={{ top: 20, right: 130, bottom: 60, left: 80 }}
                                        padding={0.3}
                                        groupMode="grouped"
                                        valueScale={{ type: 'linear' }}
                                        colors={['#10B981', '#EF4444', '#8B5CF6']}
                                        borderRadius={8}
                                        axisBottom={{
                                            tickSize: 5,
                                            tickPadding: 10,
                                            tickRotation: 0,
                                            legend: 'Month',
                                            legendPosition: 'middle',
                                            legendOffset: 45,
                                        }}
                                        axisLeft={{
                                            tickSize: 5,
                                            tickPadding: 10,
                                            tickRotation: 0,
                                            legend: 'Amount (AED)',
                                            legendPosition: 'middle',
                                            legendOffset: -60,
                                            format: (value) => `${(value / 1000).toFixed(0)}k`,
                                        }}
                                        labelSkipWidth={12}
                                        labelSkipHeight={12}
                                        labelTextColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
                                        legends={[
                                            {
                                                dataFrom: 'keys',
                                                anchor: 'bottom-right',
                                                direction: 'column',
                                                justify: false,
                                                translateX: 120,
                                                translateY: 0,
                                                itemsSpacing: 2,
                                                itemWidth: 100,
                                                itemHeight: 20,
                                                itemDirection: 'left-to-right',
                                                symbolSize: 20,
                                                symbolShape: 'square',
                                            },
                                        ]}
                                        animate={true}
                                    />
                                </Box>
                            </Paper>
                        </Grid>

                        {/* Monthly Data Table */}
                        <Grid item xs={12}>
                            <Paper
                                sx={{
                                    p: 4,
                                    borderRadius: '16px',
                                    border: '1px solid #E5E7EB',
                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                }}
                            >
                                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                                    Monthly Breakdown - {selectedYear}
                                </Typography>
                                <TableContainer>
                                    <Table>
                                        <TableHead>
                                            <TableRow sx={{ bgcolor: alpha('#667eea', 0.05) }}>
                                                <TableCell sx={{ fontWeight: 700, fontSize: '14px', color: '#374151' }}>Month</TableCell>
                                                <TableCell align="right" sx={{ fontWeight: 700, fontSize: '14px', color: '#374151' }}>Income</TableCell>
                                                <TableCell align="right" sx={{ fontWeight: 700, fontSize: '14px', color: '#374151' }}>Expenses</TableCell>
                                                <TableCell align="right" sx={{ fontWeight: 700, fontSize: '14px', color: '#374151' }}>Net Income</TableCell>
                                                <TableCell align="right" sx={{ fontWeight: 700, fontSize: '14px', color: '#374151' }}>Profit Margin</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {monthlyData.map((data, index) => (
                                                <TableRow
                                                    key={index}
                                                    sx={{
                                                        '&:hover': { bgcolor: alpha('#667eea', 0.02) },
                                                        transition: 'background-color 0.2s'
                                                    }}
                                                >
                                                    <TableCell sx={{ fontWeight: 600, color: '#1F2937' }}>
                                                        {data.month} {data.year}
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        <Typography variant="body2" sx={{ color: '#10B981', fontWeight: 600 }}>
                                                            {data.income.toLocaleString('en-AE', { style: 'currency', currency: 'AED' })}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        <Typography variant="body2" sx={{ color: '#EF4444', fontWeight: 600 }}>
                                                            {data.expenses.toLocaleString('en-AE', { style: 'currency', currency: 'AED' })}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        <Chip
                                                            label={data.netIncome.toLocaleString('en-AE', { style: 'currency', currency: 'AED' })}
                                                            sx={{
                                                                bgcolor: data.netIncome >= 0 ? alpha('#8B5CF6', 0.1) : alpha('#F59E0B', 0.1),
                                                                color: data.netIncome >= 0 ? '#7C3AED' : '#F59E0B',
                                                                fontWeight: 700,
                                                                minWidth: '120px',
                                                            }}
                                                        />
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        <Chip
                                                            label={`${data.profitMargin.toFixed(1)}%`}
                                                            sx={{
                                                                bgcolor: data.profitMargin >= 0 ? alpha('#3B82F6', 0.1) : alpha('#EF4444', 0.1),
                                                                color: data.profitMargin >= 0 ? '#2563EB' : '#DC2626',
                                                                fontWeight: 700,
                                                            }}
                                                        />
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            {/* Total Row */}
                                            <TableRow sx={{ bgcolor: alpha('#667eea', 0.08), borderTop: '2px solid #E5E7EB' }}>
                                                <TableCell sx={{ fontWeight: 700, fontSize: '15px', color: '#111827' }}>
                                                    Total
                                                </TableCell>
                                                <TableCell align="right">
                                                    <Typography variant="body1" sx={{ color: '#10B981', fontWeight: 700, fontSize: '15px' }}>
                                                        {totalIncome.toLocaleString('en-AE', { style: 'currency', currency: 'AED' })}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell align="right">
                                                    <Typography variant="body1" sx={{ color: '#EF4444', fontWeight: 700, fontSize: '15px' }}>
                                                        {totalExpenses.toLocaleString('en-AE', { style: 'currency', currency: 'AED' })}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell align="right">
                                                    <Typography variant="body1" sx={{ fontWeight: 700, fontSize: '15px' }}>
                                                        {totalNetIncome.toLocaleString('en-AE', { style: 'currency', currency: 'AED' })}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell align="right">
                                                    <Typography variant="body1" sx={{ color: '#2563EB', fontWeight: 700, fontSize: '15px' }}>
                                                        {averageMargin.toFixed(1)}%
                                                    </Typography>
                                                </TableCell>
                                            </TableRow>
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Paper>
                        </Grid>
                    </Grid>
                </>
            )}
        </Box>
    );
};

export default NetIncomeReport;
