import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import LoadingScreen from '../components/common/LoadingScreen';
import { colors, fonts } from '../config/theme';

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import CompanySelectScreen from '../screens/auth/CompanySelectScreen';

// Dashboard
import DashboardScreen from '../screens/dashboard/DashboardScreen';

// Vehicles
import VehicleListScreen from '../screens/vehicles/VehicleListScreen';
import VehicleDetailScreen from '../screens/vehicles/VehicleDetailScreen';
import VehicleFormScreen from '../screens/vehicles/VehicleFormScreen';

// Drivers
import DriverListScreen from '../screens/drivers/DriverListScreen';
import DriverDetailScreen from '../screens/drivers/DriverDetailScreen';
import DriverFormScreen from '../screens/drivers/DriverFormScreen';

// Contracts
import ContractListScreen from '../screens/contracts/ContractListScreen';
import ContractDetailScreen from '../screens/contracts/ContractDetailScreen';
import ContractFormScreen from '../screens/contracts/ContractFormScreen';

// Invoices
import InvoiceListScreen from '../screens/invoices/InvoiceListScreen';
import InvoiceDetailScreen from '../screens/invoices/InvoiceDetailScreen';
import InvoiceFormScreen from '../screens/invoices/InvoiceFormScreen';

// Costs
import CostListScreen from '../screens/costs/CostListScreen';
import CostDetailScreen from '../screens/costs/CostDetailScreen';
import CostFormScreen from '../screens/costs/CostFormScreen';

// Payroll
import PayrollScreen from '../screens/payroll/PayrollScreen';
import PayrollDetailScreen from '../screens/payroll/PayrollDetailScreen';
import PayrollFormScreen from '../screens/payroll/PayrollFormScreen';

// Receipts
import ReceiptListScreen from '../screens/receipts/ReceiptListScreen';
import ReceiptDetailScreen from '../screens/receipts/ReceiptDetailScreen';
import ReceiptFormScreen from '../screens/receipts/ReceiptFormScreen';

// Reports
import ReportsScreen from '../screens/reports/ReportsScreen';
import MonthlyReportScreen from '../screens/reports/MonthlyReportScreen';

// Other
import RTAFinesScreen from '../screens/fines/RTAFinesScreen';
import NotesScreen from '../screens/notes/NotesScreen';
import LetterheadsScreen from '../screens/letterheads/LetterheadsScreen';
import FuelRecordsScreen from '../screens/fuel/FuelRecordsScreen';
import MaintenanceListScreen from '../screens/maintenance/MaintenanceListScreen';
import UsersScreen from '../screens/users/UsersScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';
import ProfileScreen from '../screens/settings/ProfileScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const screenOptions = {
  headerStyle: { backgroundColor: colors.surface },
  headerTintColor: colors.text,
  headerTitleStyle: { fontFamily: fonts.bold, fontSize: 18 },
  headerShadowVisible: false,
};

const DashboardStack = () => (
  <Stack.Navigator screenOptions={screenOptions}>
    <Stack.Screen name="DashboardHome" component={DashboardScreen} options={{ title: 'Efficient Fleet Manager' }} />
    <Stack.Screen name="Vehicles" component={VehicleListScreen} />
    <Stack.Screen name="VehicleDetail" component={VehicleDetailScreen} options={{ title: 'Vehicle Details' }} />
    <Stack.Screen name="VehicleForm" component={VehicleFormScreen} options={({ route }: any) => ({ title: route.params?.vehicle ? 'Edit Vehicle' : 'Add Vehicle' })} />
    <Stack.Screen name="Drivers" component={DriverListScreen} />
    <Stack.Screen name="DriverDetail" component={DriverDetailScreen} options={{ title: 'Driver Details' }} />
    <Stack.Screen name="DriverForm" component={DriverFormScreen} options={({ route }: any) => ({ title: route.params?.driver ? 'Edit Driver' : 'Add Driver' })} />
    <Stack.Screen name="Contracts" component={ContractListScreen} />
    <Stack.Screen name="ContractDetail" component={ContractDetailScreen} options={{ title: 'Contract Details' }} />
    <Stack.Screen name="ContractForm" component={ContractFormScreen} options={({ route }: any) => ({ title: route.params?.contract ? 'Edit Contract' : 'Add Contract' })} />
    <Stack.Screen name="Invoices" component={InvoiceListScreen} />
    <Stack.Screen name="InvoiceDetail" component={InvoiceDetailScreen} options={{ title: 'Invoice Details' }} />
    <Stack.Screen name="InvoiceForm" component={InvoiceFormScreen} options={({ route }: any) => ({ title: route.params?.invoice ? 'Edit Invoice' : 'Create Invoice' })} />
    <Stack.Screen name="Costs" component={CostListScreen} options={{ title: 'Cost Management' }} />
    <Stack.Screen name="CostDetail" component={CostDetailScreen} options={{ title: 'Cost Details' }} />
    <Stack.Screen name="CostForm" component={CostFormScreen} options={({ route }: any) => ({ title: route.params?.cost ? 'Edit Cost' : 'Add Cost' })} />
    <Stack.Screen name="Payroll" component={PayrollScreen} options={{ title: 'Driver Payroll' }} />
    <Stack.Screen name="PayrollDetail" component={PayrollDetailScreen} options={{ title: 'Payroll Details' }} />
    <Stack.Screen name="PayrollForm" component={PayrollFormScreen} options={{ title: 'Add Payroll Entry' }} />
    <Stack.Screen name="RTAFines" component={RTAFinesScreen} options={{ title: 'RTA Fines' }} />
    <Stack.Screen name="Notes" component={NotesScreen} options={{ title: 'General Notes' }} />
    <Stack.Screen name="Receipts" component={ReceiptListScreen} />
    <Stack.Screen name="ReceiptDetail" component={ReceiptDetailScreen} options={{ title: 'Receipt Details' }} />
    <Stack.Screen name="ReceiptForm" component={ReceiptFormScreen} options={({ route }: any) => ({ title: route.params?.receipt ? 'Edit Receipt' : 'Add Receipt' })} />
    <Stack.Screen name="Letterheads" component={LetterheadsScreen} options={{ title: 'Letterheads' }} />
    <Stack.Screen name="FuelRecords" component={FuelRecordsScreen} options={{ title: 'Fuel Records' }} />
    <Stack.Screen name="Maintenance" component={MaintenanceListScreen} options={{ title: 'Maintenance' }} />
    <Stack.Screen name="Users" component={UsersScreen} options={{ title: 'User Management' }} />
    <Stack.Screen name="CompanySettings" component={ProfileScreen} options={{ title: 'Company Settings' }} />
  </Stack.Navigator>
);

const FleetStack = () => (
  <Stack.Navigator screenOptions={screenOptions}>
    <Stack.Screen name="VehiclesList" component={VehicleListScreen} options={{ title: 'Vehicles' }} />
    <Stack.Screen name="VehicleDetail" component={VehicleDetailScreen} options={{ title: 'Vehicle Details' }} />
    <Stack.Screen name="VehicleForm" component={VehicleFormScreen} options={({ route }: any) => ({ title: route.params?.vehicle ? 'Edit Vehicle' : 'Add Vehicle' })} />
    <Stack.Screen name="DriversList" component={DriverListScreen} options={{ title: 'Drivers' }} />
    <Stack.Screen name="DriverDetail" component={DriverDetailScreen} options={{ title: 'Driver Details' }} />
    <Stack.Screen name="DriverForm" component={DriverFormScreen} options={({ route }: any) => ({ title: route.params?.driver ? 'Edit Driver' : 'Add Driver' })} />
  </Stack.Navigator>
);

const ReportsStack = () => (
  <Stack.Navigator screenOptions={screenOptions}>
    <Stack.Screen name="ReportsHome" component={ReportsScreen} options={{ title: 'Reports' }} />
    <Stack.Screen name="MonthlyReport" component={MonthlyReportScreen} options={{ title: 'Monthly Report' }} />
    <Stack.Screen name="NetIncomeReport" component={MonthlyReportScreen} options={{ title: 'Net Income' }} />
    <Stack.Screen name="ContractCycleReport" component={MonthlyReportScreen} options={{ title: 'Contract Cycle' }} />
    <Stack.Screen name="VehicleCostReport" component={MonthlyReportScreen} options={{ title: 'Vehicle Costs' }} />
    <Stack.Screen name="DriverReport" component={MonthlyReportScreen} options={{ title: 'Driver Performance' }} />
    <Stack.Screen name="ReportsRTAFines" component={RTAFinesScreen} options={{ title: 'RTA Fines' }} />
  </Stack.Navigator>
);

const SettingsStack = () => (
  <Stack.Navigator screenOptions={screenOptions}>
    <Stack.Screen name="SettingsHome" component={SettingsScreen} options={{ headerShown: false }} />
    <Stack.Screen name="Profile" component={ProfileScreen} />
    <Stack.Screen name="SettingsCompany" component={ProfileScreen} options={{ title: 'Company Settings' }} />
    <Stack.Screen name="SettingsUsers" component={UsersScreen} options={{ title: 'Users' }} />
    <Stack.Screen name="SettingsLetterheads" component={LetterheadsScreen} options={{ title: 'Letterheads' }} />
    <Stack.Screen name="SettingsNotes" component={NotesScreen} options={{ title: 'General Notes' }} />
    <Stack.Screen name="SettingsFuelRecords" component={FuelRecordsScreen} options={{ title: 'Fuel Records' }} />
    <Stack.Screen name="SettingsMaintenance" component={MaintenanceListScreen} options={{ title: 'Maintenance' }} />
  </Stack.Navigator>
);

const MainTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarActiveTintColor: '#5B2BC9',
      tabBarInactiveTintColor: '#756E80',
      tabBarStyle: {
        backgroundColor: '#FBF8F2',
        borderTopWidth: 1,
        borderTopColor: 'rgba(20,8,31,0.08)',
        paddingBottom: 8,
        paddingTop: 8,
        height: 64,
        elevation: 0,
        shadowOpacity: 0,
      },
      tabBarLabelStyle: { fontSize: 10, fontFamily: fonts.semiBold, marginTop: -2 },
      tabBarIcon: ({ color, size }) => {
        const icons: Record<string, string> = {
          Dashboard: 'home-outline',
          Fleet: 'car-outline',
          Reports: 'chart-bar',
          Settings: 'cog-outline',
        };
        return <Icon name={icons[route.name] || 'circle'} size={size} color={color} />;
      },
    })}
  >
    <Tab.Screen name="Dashboard" component={DashboardStack} />
    <Tab.Screen name="Fleet" component={FleetStack} />
    <Tab.Screen name="Reports" component={ReportsStack} />
    <Tab.Screen name="Settings" component={SettingsStack} />
  </Tab.Navigator>
);

const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
  </Stack.Navigator>
);

const AppNavigator: React.FC = () => {
  const { isAuthenticated, isLoading, companies, selectedCompanyId } = useAuth();

  if (isLoading) return <LoadingScreen message="Starting Efficient Fleet Manager..." />;

  return (
    <NavigationContainer>
      {!isAuthenticated ? (
        <AuthStack />
      ) : companies.length > 0 && !selectedCompanyId ? (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="CompanySelect" component={CompanySelectScreen} />
        </Stack.Navigator>
      ) : (
        <MainTabs />
      )}
    </NavigationContainer>
  );
};

export default AppNavigator;
