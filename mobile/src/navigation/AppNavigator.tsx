import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, DeviceEventEmitter } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import {
  navigationRef, registerQuickActions, listenForQuickActions, consumeInitialQuickAction,
} from '../utils/quickActions';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator, DrawerContentScrollView } from '@react-navigation/drawer';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import LoadingScreen from '../components/common/LoadingScreen';
import SplashScreen from '../screens/SplashScreen';
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
import ContractTemplateScreen from '../screens/contracts/ContractTemplateScreen';

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
import TemplatesScreen from '../screens/templates/TemplatesScreen';
import FuelRecordsScreen from '../screens/fuel/FuelRecordsScreen';
import MaintenanceListScreen from '../screens/maintenance/MaintenanceListScreen';
import StaffAccountsScreen from '../screens/staff/StaffAccountsScreen';
import UsersScreen from '../screens/users/UsersScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';
import ProfileScreen from '../screens/settings/ProfileScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const Drawer = createDrawerNavigator();

const HeaderRight = ({ navigation }: any) => {
  const { user } = useAuth();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginRight: 4 }}>
      <TouchableOpacity
        onPress={() => {
          navigation.navigate('Dashboard');
          DeviceEventEmitter.emit('openReminders');
        }}
        style={{
          width: 32, height: 32, borderRadius: 16,
          backgroundColor: 'rgba(255,255,255,0.15)',
          justifyContent: 'center', alignItems: 'center',
        }}
      >
        <Icon name="bell-outline" size={17} color="#FFFFFF" />
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => navigation.navigate('Settings')}
        style={{
          width: 32, height: 32, borderRadius: 16,
          backgroundColor: 'rgba(255,255,255,0.25)',
          justifyContent: 'center', alignItems: 'center',
        }}
      >
        <Text style={{ color: '#FFFFFF', fontFamily: fonts.bold, fontSize: 13 }}>
          {(user?.name || 'U')[0].toUpperCase()}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

// ☰ opens the drawer; only shown on root screens (others keep the back arrow)
const MenuButton = ({ navigation }: any) => (
  <TouchableOpacity
    onPress={() => navigation.getParent('MainDrawer')?.openDrawer?.() ?? navigation.getParent()?.openDrawer?.()}
    style={{ marginRight: 6, padding: 4 }}
  >
    <Icon name="menu" size={23} color="#FFFFFF" />
  </TouchableOpacity>
);

const screenOptions = ({ navigation }: any) => ({
  headerStyle: { backgroundColor: '#2D1259' },
  headerTintColor: '#FFFFFF',
  headerTitleStyle: { fontFamily: fonts.bold, fontSize: 18, color: '#FFFFFF' },
  headerShadowVisible: false,
  headerLeft: navigation.canGoBack() ? undefined : () => <MenuButton navigation={navigation} />,
  headerRight: () => <HeaderRight navigation={navigation} />,
});

const DashboardStack = () => (
  <Stack.Navigator screenOptions={screenOptions}>
    <Stack.Screen name="DashboardHome" component={DashboardScreen} options={{ title: 'FleetOZ' }} />
    <Stack.Screen name="Vehicles" component={VehicleListScreen} />
    <Stack.Screen name="VehicleDetail" component={VehicleDetailScreen} options={{ title: 'Vehicle Details' }} />
    <Stack.Screen name="VehicleForm" component={VehicleFormScreen} options={({ route }: any) => ({ title: route.params?.vehicle ? 'Edit Vehicle' : 'Add Vehicle' })} />
    <Stack.Screen name="Drivers" component={DriverListScreen} />
    <Stack.Screen name="DriverDetail" component={DriverDetailScreen} options={{ title: 'Driver Details' }} />
    <Stack.Screen name="DriverForm" component={DriverFormScreen} options={({ route }: any) => ({ title: route.params?.driver ? 'Edit Driver' : 'Add Driver' })} />
    <Stack.Screen name="Contracts" component={ContractListScreen} />
    <Stack.Screen name="ContractDetail" component={ContractDetailScreen} options={{ title: 'Contract Details' }} />
    <Stack.Screen name="ContractTemplate" component={ContractTemplateScreen} options={{ title: 'Contract Agreement' }} />
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
    <Stack.Screen name="Letterheads" component={LetterheadsScreen} options={{ title: 'Letters' }} />
    <Stack.Screen name="Templates" component={TemplatesScreen} options={{ title: 'Templates' }} />
    <Stack.Screen name="FuelRecords" component={FuelRecordsScreen} options={{ title: 'Fuel Records' }} />
    <Stack.Screen name="Maintenance" component={MaintenanceListScreen} options={{ title: 'Maintenance' }} />
    <Stack.Screen name="StaffAccounts" component={StaffAccountsScreen} options={{ title: 'Staff Accounts' }} />
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

const ExpensesStack = () => (
  <Stack.Navigator screenOptions={screenOptions}>
    <Stack.Screen name="CostsList" component={CostListScreen} options={{ title: 'Expenses' }} />
    <Stack.Screen name="CostDetail" component={CostDetailScreen} options={{ title: 'Cost Details' }} />
    <Stack.Screen name="CostForm" component={CostFormScreen} options={({ route }: any) => ({ title: route.params?.cost ? 'Edit Cost' : 'Add Cost' })} />
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
    <Stack.Screen name="SettingsTemplates" component={TemplatesScreen} options={{ title: 'Templates' }} />
    <Stack.Screen name="SettingsNotes" component={NotesScreen} options={{ title: 'General Notes' }} />
    <Stack.Screen name="SettingsFuelRecords" component={FuelRecordsScreen} options={{ title: 'Fuel Records' }} />
    <Stack.Screen name="SettingsMaintenance" component={MaintenanceListScreen} options={{ title: 'Maintenance' }} />
    <Stack.Screen name="SettingsStaffAccounts" component={StaffAccountsScreen} options={{ title: 'Staff Accounts' }} />
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
          Expenses: 'cash-multiple',
          Reports: 'chart-bar',
          Settings: 'cog-outline',
        };
        return <Icon name={icons[route.name] || 'circle'} size={size} color={color} />;
      },
    })}
  >
    <Tab.Screen name="Dashboard" component={DashboardStack} />
    <Tab.Screen name="Expenses" component={ExpensesStack} />
    <Tab.Screen name="Reports" component={ReportsStack} />
    <Tab.Screen name="Settings" component={SettingsStack} />
  </Tab.Navigator>
);

// Left drawer: full navigation menu, opened from the ☰ button or an edge swipe
const drawerItems: Array<{ label: string; icon: string; screen: string; params?: any }> = [
  { label: 'Dashboard', icon: 'home-outline', screen: 'DashboardHome' },
  { label: 'Vehicles', icon: 'car-outline', screen: 'Vehicles' },
  { label: 'Drivers', icon: 'account-group-outline', screen: 'Drivers' },
  { label: 'Contracts', icon: 'file-document-outline', screen: 'Contracts' },
  { label: 'Invoices', icon: 'currency-usd', screen: 'Invoices' },
  { label: 'Expenses', icon: 'cash-multiple', screen: 'Costs' },
  { label: 'Maintenance', icon: 'wrench-outline', screen: 'Maintenance' },
  { label: 'RTA Fines', icon: 'car-emergency', screen: 'RTAFines' },
  { label: 'Staff Accounts', icon: 'account-cash-outline', screen: 'StaffAccounts' },
  { label: 'Letters', icon: 'email-edit-outline', screen: 'Letterheads' },
  { label: 'Templates', icon: 'message-text-outline', screen: 'Templates' },
  { label: 'Payroll', icon: 'cash-register', screen: 'Payroll' },
  { label: 'Receipts', icon: 'receipt', screen: 'Receipts' },
  { label: 'Notes', icon: 'note-text-outline', screen: 'Notes' },
];

const DrawerContent = (props: any) => {
  const { user, companies, selectedCompanyId, logout } = useAuth();
  const company = companies.find((c: any) => (c as any).id === selectedCompanyId || c._id === selectedCompanyId) || companies[0];

  const go = (screen: string) => {
    props.navigation.closeDrawer();
    props.navigation.navigate('Tabs', { screen: 'Dashboard', params: { screen } });
  };

  return (
    <DrawerContentScrollView {...props} contentContainerStyle={{ paddingTop: 0 }}>
      {/* Brand header */}
      <View style={{ backgroundColor: '#2D1259', padding: 20, paddingTop: 40, marginBottom: 8 }}>
        <View style={{
          width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.2)',
          justifyContent: 'center', alignItems: 'center', marginBottom: 10,
        }}>
          <Text style={{ color: '#FFFFFF', fontFamily: fonts.bold, fontSize: 17 }}>
            {(user?.name || 'U')[0].toUpperCase()}
          </Text>
        </View>
        <Text style={{ color: '#FFFFFF', fontFamily: fonts.bold, fontSize: 16 }} numberOfLines={1}>
          {company?.name || 'My Fleet'}
        </Text>
        <Text style={{ color: 'rgba(255,255,255,0.7)', fontFamily: fonts.regular, fontSize: 12, marginTop: 2 }} numberOfLines={1}>
          {user?.name || ''}
        </Text>
      </View>

      {drawerItems.map((item) => (
        <TouchableOpacity
          key={item.label}
          onPress={() => go(item.screen)}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 13, paddingHorizontal: 20 }}
        >
          <Icon name={item.icon as any} size={20} color="#5B2BC9" />
          <Text style={{ fontSize: 14, fontFamily: fonts.medium, color: '#14081F' }}>{item.label}</Text>
        </TouchableOpacity>
      ))}

      <View style={{ height: 1, backgroundColor: 'rgba(20,8,31,0.08)', marginVertical: 8, marginHorizontal: 20 }} />

      <TouchableOpacity
        onPress={() => { props.navigation.closeDrawer(); props.navigation.navigate('Tabs', { screen: 'Settings' }); }}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 13, paddingHorizontal: 20 }}
      >
        <Icon name="cog-outline" size={20} color="#5B2BC9" />
        <Text style={{ fontSize: 14, fontFamily: fonts.medium, color: '#14081F' }}>Settings</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => logout()}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 13, paddingHorizontal: 20, marginBottom: 20 }}
      >
        <Icon name="logout" size={20} color="#ef4444" />
        <Text style={{ fontSize: 14, fontFamily: fonts.medium, color: '#ef4444' }}>Sign Out</Text>
      </TouchableOpacity>
    </DrawerContentScrollView>
  );
};

const MainDrawer = () => (
  <Drawer.Navigator
    id={'MainDrawer' as any}
    drawerContent={(props) => <DrawerContent {...props} />}
    screenOptions={{ headerShown: false, drawerStyle: { width: 285, backgroundColor: '#FBF8F2' } }}
  >
    <Drawer.Screen name="Tabs" component={MainTabs} />
  </Drawer.Navigator>
);

const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
  </Stack.Navigator>
);

const AppNavigator: React.FC = () => {
  const { isAuthenticated, isLoading, companies, selectedCompanyId } = useAuth();

  useEffect(() => {
    registerQuickActions();
    const unsubscribe = listenForQuickActions();
    consumeInitialQuickAction();
    return unsubscribe;
  }, []);

  if (isLoading) return <SplashScreen message="Signing you in" />;

  return (
    <NavigationContainer ref={navigationRef}>
      {!isAuthenticated ? (
        <AuthStack />
      ) : companies.length > 0 && !selectedCompanyId ? (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="CompanySelect" component={CompanySelectScreen} />
        </Stack.Navigator>
      ) : (
        <MainDrawer />
      )}
    </NavigationContainer>
  );
};

export default AppNavigator;
