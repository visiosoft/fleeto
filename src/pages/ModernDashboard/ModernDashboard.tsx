import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../components/modern/DashboardLayout';
import { KPICard } from '../../components/modern/KPICard';
import { ChartCard } from '../../components/modern/ChartCard';
import { AlertsPanel } from '../../components/modern/AlertsPanel';
import { QuickActions } from '../../components/modern/QuickActions';
import { ResponsiveLine } from '@nivo/line';
import { ResponsivePie } from '@nivo/pie';
import { ResponsiveBar } from '@nivo/bar';
import { useDashboardData } from '../../hooks/useDashboardData';
import { API_ENDPOINTS } from '../../config/environment';
import axios from 'axios';
import {
  DirectionsCar as VehicleIcon,
  CheckCircle as ActiveIcon,
  MonetizationOn as IncomeIcon,
  Receipt as ExpenseIcon,
  TrendingUp as ProfitIcon,
  Warning as FineIcon,
  Add as AddIcon,
  Article as DocumentIcon,
  Person as PersonIcon,
  LocalGasStation as GasIcon,
} from '@mui/icons-material';

export const ModernDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { data, isLoading } = useDashboardData();
  
  const [kpiData, setKpiData] = useState({
    totalVehicles: 0,
    activeVehicles: 0,
    monthlyIncome: 0,
    monthlyExpenses: 0,
    monthlyProfit: 0,
    pendingFines: 0,
    finesAmount: 'AED 0',
  });

  const [vehicleExpenses, setVehicleExpenses] = useState<any[]>([]);
  const [vehicleContracts, setVehicleContracts] = useState<any[]>([]);
  const [yearlyIncomeExpense, setYearlyIncomeExpense] = useState<any[]>([]);

  // Fetch vehicle expenses for pie chart (current month only)
  useEffect(() => {
    const fetchVehicleExpenses = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(API_ENDPOINTS.costs.all, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.data && response.data.vehicles) {
          // Get current month and year
          const now = new Date();
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

          // Group expenses by vehicle for current month
          const vehicleMap = new Map();
          
          response.data.vehicles.forEach((vehicle: any) => {
            let vehicleTotal = 0;
            vehicle.details?.forEach((expense: any) => {
              const expenseDate = new Date(expense.date);
              if (expenseDate >= startOfMonth && expenseDate <= endOfMonth) {
                vehicleTotal += expense.amount;
              }
            });
            if (vehicleTotal > 0) {
              vehicleMap.set(vehicle.vehicleName, vehicleTotal);
            }
          });

          const vehicleData = Array.from(vehicleMap.entries()).map(([name, total]) => ({
            id: name,
            label: name,
            value: total
          }));

          setVehicleExpenses(vehicleData);
        }
      } catch (error) {
        console.error('Error fetching vehicle expenses:', error);
      }
    };

    fetchVehicleExpenses();
  }, []);

  // Fetch active contracts and show each contract separately
  useEffect(() => {
    const fetchVehicleUtilization = async () => {
      try {
        const token = localStorage.getItem('token');
        
        // Fetch contracts
        const response = await axios.get(API_ENDPOINTS.contracts, {
          headers: { Authorization: `Bearer ${token}` }
        });

        console.log('Contracts Response:', response.data);

        // Get all contracts (directly an array)
        const contracts = Array.isArray(response.data) 
          ? response.data 
          : [];

        // Filter for active contracts and create data for each
        const activeContracts = contracts.filter((contract: any) => 
          contract.status === 'Active' && contract.value
        );

        console.log('Active contracts:', activeContracts);

        // Create a unique entry for each contract
        const contractData = activeContracts.map((contract: any, index: number) => {
          // Use company name if available, otherwise use contract ID
          const displayName = contract.companyName 
            ? `${contract.companyName.substring(0, 30)}${contract.companyName.length > 30 ? '...' : ''}`
            : `Contract ${index + 1}`;
          
          return {
            vehicle: displayName,
            income: contract.value
          };
        });

        console.log('Chart Data:', contractData);

        setVehicleContracts(contractData.length > 0 ? contractData : []);
      } catch (error) {
        console.error('Error fetching contracts:', error);
      }
    };

    fetchVehicleUtilization();
  }, []);

  // Fetch yearly income and expense data for the last 12 months
  useEffect(() => {
    const fetchYearlyData = async () => {
      try {
        const token = localStorage.getItem('token');
        
        // Fetch all expenses and contracts
        const [expensesRes, contractsRes] = await Promise.all([
          axios.get(API_ENDPOINTS.costs.all, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get(API_ENDPOINTS.contracts, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        // Generate last 12 months
        interface MonthData {
          month: string;
          year: number;
          monthIndex: number;
          income: number;
          expenses: number;
        }
        
        const months: MonthData[] = [];
        const now = new Date();
        for (let i = 11; i >= 0; i--) {
          const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
          months.push({
            month: date.toLocaleString('default', { month: 'short' }),
            year: date.getFullYear(),
            monthIndex: date.getMonth(),
            income: 0,
            expenses: 0
          });
        }

        // Calculate monthly expenses
        if (expensesRes.data?.vehicles) {
          expensesRes.data.vehicles.forEach((vehicle: any) => {
            vehicle.details?.forEach((expense: any) => {
              const expenseDate = new Date(expense.date);
              const monthData = months.find(m => 
                m.monthIndex === expenseDate.getMonth() && 
                m.year === expenseDate.getFullYear()
              );
              if (monthData) {
                monthData.expenses += expense.amount || 0;
              }
            });
          });
        }

        // Calculate monthly income from active contracts
        if (contractsRes.data && Array.isArray(contractsRes.data)) {
          contractsRes.data.forEach((contract: any) => {
            if (contract.status === 'Active' && contract.value) {
              const startDate = new Date(contract.startDate);
              const endDate = contract.endDate ? new Date(contract.endDate) : now;
              
              months.forEach(monthData => {
                const monthStart = new Date(monthData.year, monthData.monthIndex, 1);
                const monthEnd = new Date(monthData.year, monthData.monthIndex + 1, 0);
                
                // If contract was active during this month
                if (startDate <= monthEnd && endDate >= monthStart) {
                  monthData.income += contract.value || 0;
                }
              });
            }
          });
        }

        setYearlyIncomeExpense(months);
      } catch (error) {
        console.error('Error fetching yearly data:', error);
      }
    };

    fetchYearlyData();
  }, []);

  // Fetch RTA fines data
  useEffect(() => {
    const fetchFinesData = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(API_ENDPOINTS.rtaFines.total, {
          headers: { Authorization: `Bearer ${token}` }
        });

        console.log('RTA Fines Response (ModernDashboard):', response.data);

        if (response.data?.status === 'success' && response.data.data) {
          const totalAmount = response.data.data.total_amount || 'AED 0';
          
          // Extract just the amount from string like "Pay all AED 2,000"
          const match = totalAmount.match(/AED\s*([\d,]+)/);
          const numericAmount = match ? parseInt(match[1].replace(/,/g, '')) : 0;
          const formattedAmount = match ? `AED ${match[1]}` : 'AED 0';
          
          setKpiData(prev => ({
            ...prev,
            pendingFines: numericAmount,
            finesAmount: formattedAmount
          }));
        }
      } catch (error) {
        console.error('Error fetching fines data:', error);
      }
    };

    fetchFinesData();
  }, []);

  useEffect(() => {
    if (data) {
      const income = data.contractStats?.totalValue || 0;
      const expenses = data.costData?.monthlyCost || 0;
      const profit = income - expenses;

      setKpiData({
        totalVehicles: data.activeVehicles || 0,
        activeVehicles: data.activeVehicles || 0,
        monthlyIncome: income,
        monthlyExpenses: expenses,
        monthlyProfit: profit,
        pendingFines: kpiData.pendingFines, // Keep existing fines data
        finesAmount: kpiData.finesAmount,
      });
    }
  }, [data]);

  const quickActions = [
    {
      id: 'add-vehicle',
      label: 'Add Vehicle',
      icon: <VehicleIcon className="w-5 h-5" />,
      onClick: () => navigate('/vehicles/add'),
      variant: 'primary' as const,
    },
    {
      id: 'add-expense',
      label: 'Add Expense',
      icon: <ExpenseIcon className="w-5 h-5" />,
      onClick: () => navigate('/cost-management'),
      variant: 'secondary' as const,
    },
    {
      id: 'create-contract',
      label: 'Create Contract',
      icon: <DocumentIcon className="w-5 h-5" />,
      onClick: () => navigate('/contracts/add'),
      variant: 'secondary' as const,
    },
    {
      id: 'add-driver',
      label: 'Add Driver',
      icon: <PersonIcon className="w-5 h-5" />,
      onClick: () => navigate('/drivers/add'),
      variant: 'secondary' as const,
    },
  ];

  const alerts = [
    {
      id: '1',
      type: 'warning' as const,
      title: 'Vehicles with Expiring Registration',
      description: '3 vehicles have registration expiring within 30 days',
      action: () => navigate('/vehicles'),
      actionLabel: 'View Vehicles',
    },
    {
      id: '2',
      type: 'info' as const,
      title: 'Maintenance Due',
      description: '5 vehicles are due for scheduled maintenance',
      action: () => navigate('/vehicles'),
      actionLabel: 'View Details',
    },
  ];

  // Income vs Expense Line Chart Data - Last 12 months
  const incomeExpenseData = yearlyIncomeExpense.length > 0 ? [
    {
      id: 'Income',
      color: '#22C55E',
      data: yearlyIncomeExpense.map(m => ({ x: m.month, y: m.income })),
    },
    {
      id: 'Expenses',
      color: '#EF4444',
      data: yearlyIncomeExpense.map(m => ({ x: m.month, y: m.expenses })),
    },
  ] : [
    {
      id: 'Income',
      color: '#22C55E',
      data: [{ x: 'Loading', y: 0 }],
    },
    {
      id: 'Expenses',
      color: '#EF4444',
      data: [{ x: 'Loading', y: 0 }],
    },
  ];

  // Expense Breakdown Pie Chart Data (by Vehicle)
  const expenseBreakdownData = vehicleExpenses.length > 0 ? vehicleExpenses : [
    { id: 'Loading', label: 'Loading...', value: 1 },
  ];

  // Vehicle Utilization Bar Chart Data (Real Contract Data)
  const vehicleUtilizationData = vehicleContracts.length > 0 ? vehicleContracts : [
    { vehicle: 'Loading...', income: 0 },
  ];

  if (isLoading) {
    return (
      <DashboardLayout title="Dashboard">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-600"></div>
            <p className="mt-4 text-gray-500">Loading dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Dashboard">
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-6">
        <KPICard
          label="Active Vehicles"
          value={kpiData.activeVehicles}
          icon={<ActiveIcon className="w-6 h-6" />}
          trend={{ value: 5, direction: 'up' }}
          onClick={() => navigate('/vehicles')}
        />
        <KPICard
          label="Monthly Income"
          value={`AED ${kpiData.monthlyIncome.toLocaleString()}`}
          icon={<IncomeIcon className="w-6 h-6" />}
          trend={{ value: 8, direction: 'up' }}
          onClick={() => navigate('/contracts')}
        />
        <KPICard
          label="Monthly Expenses"
          value={`AED ${kpiData.monthlyExpenses.toLocaleString()}`}
          icon={<ExpenseIcon className="w-6 h-6" />}
          trend={{ value: 3, direction: 'down' }}
          onClick={() => navigate('/cost-management')}
        />
        <KPICard
          label="Monthly Profit"
          value={`AED ${kpiData.monthlyProfit.toLocaleString()}`}
          icon={<ProfitIcon className="w-6 h-6" />}
          trend={{ value: 12, direction: 'up' }}
        />
        <KPICard
          label="Pending Fines"
          value={kpiData.finesAmount}
          icon={<FineIcon className="w-6 h-6" />}
          onClick={() => navigate('/rta-fines')}
          valueColor="#EF4444"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Income vs Expense Line Chart - 2 columns */}
        <div className="lg:col-span-2">
          <ChartCard title="Income vs Expense" subtitle="Monthly trend comparison">
            <div className="h-80">
              <ResponsiveLine
                data={incomeExpenseData}
                margin={{ top: 20, right: 20, bottom: 50, left: 60 }}
                xScale={{ type: 'point' }}
                yScale={{ type: 'linear', min: 0, max: 'auto' }}
                axisBottom={{
                  tickSize: 5,
                  tickPadding: 5,
                  tickRotation: 0,
                }}
                axisLeft={{
                  tickSize: 5,
                  tickPadding: 5,
                  tickRotation: 0,
                  format: (value) => `${value / 1000}k`,
                }}
                colors={{ datum: 'color' }}
                pointSize={8}
                pointColor={{ theme: 'background' }}
                pointBorderWidth={2}
                pointBorderColor={{ from: 'serieColor' }}
                useMesh={true}
                enableSlices="x"
                legends={[
                  {
                    anchor: 'bottom',
                    direction: 'row',
                    justify: false,
                    translateX: 0,
                    translateY: 45,
                    itemsSpacing: 40,
                    itemDirection: 'left-to-right',
                    itemWidth: 80,
                    itemHeight: 20,
                    symbolSize: 12,
                    symbolShape: 'circle',
                  },
                ]}
              />
            </div>
          </ChartCard>
        </div>

        {/* Expense Breakdown Pie Chart - 1 column */}
        <div>
          <ChartCard title="Expense Breakdown" subtitle="Per vehicle (this month)">
            <div className="h-80">
              <ResponsivePie
                data={expenseBreakdownData}
                margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                innerRadius={0.6}
                padAngle={0.7}
                cornerRadius={3}
                activeOuterRadiusOffset={8}
                colors={{ scheme: 'nivo' }}
                borderWidth={1}
                borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
                arcLinkLabelsTextColor="#6B7280"
                arcLinkLabelsThickness={2}
                arcLinkLabelsColor={{ from: 'color' }}
                arcLabelsTextColor="#ffffff"
                valueFormat={(value) => `AED ${value.toLocaleString()}`}
              />
            </div>
          </ChartCard>
        </div>
      </div>

      {/* Vehicle Utilization Bar Chart - Full Width */}
      <div className="grid grid-cols-1 mb-6">
        <ChartCard title="Contract Income" subtitle="Expected income per vehicle">
          <div className="h-80">
            <ResponsiveBar
              data={vehicleUtilizationData}
              keys={['income']}
              indexBy="vehicle"
              margin={{ top: 20, right: 20, bottom: 50, left: 60 }}
              padding={0.3}
              colors="#3B82F6"
              axisBottom={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: 0,
              }}
              axisLeft={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: 0,
                format: (value) => `${value / 1000}k`,
              }}
              labelTextColor="#ffffff"
              valueFormat={(value) => `${value / 1000}k`}
            />
          </div>
        </ChartCard>
      </div>

      {/* Alerts and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Alerts Panel - 2 columns */}
        <div className="lg:col-span-2">
          <AlertsPanel alerts={alerts} />
        </div>

        {/* Quick Actions - 1 column */}
        <div>
          <QuickActions actions={quickActions} />
        </div>
      </div>
    </DashboardLayout>
  );
};
