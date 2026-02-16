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
  Chip,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Fab,
  Tooltip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  MoreVert as MoreVertIcon,
  Refresh as RefreshIcon,
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  RestartAlt as RestartIcon,
  Send as SendIcon,
  WhatsApp as WhatsAppIcon,
  Visibility as ViewIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import WhatsAppService, { WhatsAppExpense, WhatsAppExpenseStats, BotStatus } from '../../services/WhatsAppService';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`whatsapp-tabpanel-${index}`}
      aria-labelledby={`whatsapp-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const WhatsAppExpenses: React.FC = () => {
  const [expenses, setExpenses] = useState<WhatsAppExpense[]>([]);
  const [stats, setStats] = useState<WhatsAppExpenseStats | null>(null);
  const [botStatus, setBotStatus] = useState<BotStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [selectedExpense, setSelectedExpense] = useState<WhatsAppExpense | null>(null);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'view' | 'delete'>('view');
  const [notes, setNotes] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [testMessageDialog, setTestMessageDialog] = useState(false);
  const [testPhone, setTestPhone] = useState('');
  const [testMessage, setTestMessage] = useState('');

  const whatsappService = WhatsAppService.getInstance();

  useEffect(() => {
    loadData();
  }, [tabValue]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [expensesData, statsData, botStatusData] = await Promise.all([
        whatsappService.getExpenses({
          status: tabValue === 0 ? 'all' : tabValue === 1 ? 'pending' : tabValue === 2 ? 'approved' : 'rejected',
          page: 1,
          limit: 100
        }),
        whatsappService.getExpenseStats(),
        whatsappService.getBotStatus()
      ]);

      setExpenses(expensesData.expenses);
      setStats(statsData);
      setBotStatus(botStatusData);
    } catch (err) {
      setError('Failed to load WhatsApp expenses');
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleAction = (expense: WhatsAppExpense, action: 'approve' | 'reject' | 'view' | 'delete') => {
    setSelectedExpense(expense);
    setActionType(action);
    setNotes('');
    setActionDialogOpen(true);
    setAnchorEl(null);
  };

  const handleConfirmAction = async () => {
    if (!selectedExpense) return;

    try {
      if (actionType === 'approve' || actionType === 'reject') {
        await whatsappService.updateExpenseStatus(
          selectedExpense._id,
          actionType === 'approve' ? 'approved' : 'rejected',
          notes
        );
      } else if (actionType === 'delete') {
        await whatsappService.deleteExpense(selectedExpense._id);
      }

      setActionDialogOpen(false);
      loadData();
    } catch (err) {
      setError(`Failed to ${actionType} expense`);
      console.error(`Error ${actionType}ing expense:`, err);
    }
  };

  const handleBotAction = async (action: 'start' | 'stop' | 'restart') => {
    try {
      if (action === 'start') {
        await whatsappService.startBot();
      } else if (action === 'stop') {
        await whatsappService.stopBot();
      } else if (action === 'restart') {
        await whatsappService.restartBot();
      }
      loadData();
    } catch (err) {
      setError(`Failed to ${action} bot`);
      console.error(`Error ${action}ing bot:`, err);
    }
  };

  const handleSendTestMessage = async () => {
    try {
      await whatsappService.sendTestMessage(testPhone, testMessage);
      setTestMessageDialog(false);
      setTestPhone('');
      setTestMessage('');
    } catch (err) {
      setError('Failed to send test message');
      console.error('Error sending test message:', err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'success';
      case 'rejected':
        return 'error';
      case 'pending':
        return 'warning';
      default:
        return 'default';
    }
  };

  const formatCurrency = (amount: number) => {
    return `AED ${amount.toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WhatsAppIcon color="primary" />
          WhatsApp Expenses
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<SendIcon />}
            onClick={() => setTestMessageDialog(true)}
          >
            Send Test
          </Button>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadData}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Bot Status Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Bot Status
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body2" color="textSecondary">
                  Status
                </Typography>
                <Chip
                  label={botStatus?.isRunning ? 'Running' : 'Stopped'}
                  color={botStatus?.isRunning ? 'success' : 'error'}
                  size="small"
                />
              </Box>
            </Grid>
            <Grid item xs={12} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body2" color="textSecondary">
                  Ready
                </Typography>
                <Chip
                  label={botStatus?.isReady ? 'Yes' : 'No'}
                  color={botStatus?.isReady ? 'success' : 'warning'}
                  size="small"
                />
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                <Button
                  size="small"
                  startIcon={<PlayIcon />}
                  onClick={() => handleBotAction('start')}
                  disabled={botStatus?.isRunning}
                >
                  Start
                </Button>
                <Button
                  size="small"
                  startIcon={<StopIcon />}
                  onClick={() => handleBotAction('stop')}
                  disabled={!botStatus?.isRunning}
                >
                  Stop
                </Button>
                <Button
                  size="small"
                  startIcon={<RestartIcon />}
                  onClick={() => handleBotAction('restart')}
                >
                  Restart
                </Button>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      {stats && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6">{stats.total}</Typography>
                <Typography variant="body2" color="textSecondary">
                  Total Expenses
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="warning.main">{stats.pending}</Typography>
                <Typography variant="body2" color="textSecondary">
                  Pending
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="success.main">{stats.approved}</Typography>
                <Typography variant="body2" color="textSecondary">
                  Approved
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="primary.main">
                  {formatCurrency(stats.totalAmount)}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Total Amount
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Tabs */}
      <Paper sx={{ width: '100%' }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="whatsapp expense tabs">
          <Tab label="All Expenses" />
          <Tab label="Pending" />
          <Tab label="Approved" />
          <Tab label="Rejected" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <ExpensesTable
            expenses={expenses}
            onAction={handleAction}
            onView={(expense) => handleAction(expense, 'view')}
          />
        </TabPanel>
        <TabPanel value={tabValue} index={1}>
          <ExpensesTable
            expenses={expenses}
            onAction={handleAction}
            onView={(expense) => handleAction(expense, 'view')}
          />
        </TabPanel>
        <TabPanel value={tabValue} index={2}>
          <ExpensesTable
            expenses={expenses}
            onAction={handleAction}
            onView={(expense) => handleAction(expense, 'view')}
          />
        </TabPanel>
        <TabPanel value={tabValue} index={3}>
          <ExpensesTable
            expenses={expenses}
            onAction={handleAction}
            onView={(expense) => handleAction(expense, 'view')}
          />
        </TabPanel>
      </Paper>

      {/* Action Dialog */}
      <Dialog open={actionDialogOpen} onClose={() => setActionDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {actionType === 'approve' && 'Approve Expense'}
          {actionType === 'reject' && 'Reject Expense'}
          {actionType === 'view' && 'View Expense Details'}
          {actionType === 'delete' && 'Delete Expense'}
        </DialogTitle>
        <DialogContent>
          {selectedExpense && (
            <Box>
              <Typography variant="body1" gutterBottom>
                <strong>Vehicle:</strong> {selectedExpense.vehicle?.licensePlate || 'Unknown'}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Amount:</strong> {formatCurrency(selectedExpense.amount)}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Description:</strong> {selectedExpense.description}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Date:</strong> {formatDate(selectedExpense.date)}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Driver:</strong> {selectedExpense.driver ? `${selectedExpense.driver.firstName} ${selectedExpense.driver.lastName}` : 'Unknown'}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Raw Message:</strong>
              </Typography>
              <Box sx={{ p: 2, bgcolor: 'grey.100', borderRadius: 1, fontFamily: 'monospace', fontSize: '0.875rem' }}>
                {selectedExpense.rawMessage}
              </Box>
              
              {(actionType === 'approve' || actionType === 'reject') && (
                <TextField
                  fullWidth
                  label="Notes (Optional)"
                  multiline
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  sx={{ mt: 2 }}
                />
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setActionDialogOpen(false)}>Cancel</Button>
          {(actionType === 'approve' || actionType === 'reject' || actionType === 'delete') && (
            <Button
              onClick={handleConfirmAction}
              color={actionType === 'reject' || actionType === 'delete' ? 'error' : 'primary'}
              variant="contained"
            >
              {actionType === 'approve' && 'Approve'}
              {actionType === 'reject' && 'Reject'}
              {actionType === 'delete' && 'Delete'}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Test Message Dialog */}
      <Dialog open={testMessageDialog} onClose={() => setTestMessageDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Send Test Message</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Phone Number (with country code)"
            value={testPhone}
            onChange={(e) => setTestPhone(e.target.value)}
            placeholder="+971501234567"
            sx={{ mb: 2, mt: 1 }}
          />
          <TextField
            fullWidth
            label="Message"
            multiline
            rows={4}
            value={testMessage}
            onChange={(e) => setTestMessage(e.target.value)}
            placeholder="Enter your test message here..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTestMessageDialog(false)}>Cancel</Button>
          <Button onClick={handleSendTestMessage} variant="contained" startIcon={<SendIcon />}>
            Send
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// Expenses Table Component
interface ExpensesTableProps {
  expenses: WhatsAppExpense[];
  onAction: (expense: WhatsAppExpense, action: 'approve' | 'reject' | 'view' | 'delete') => void;
  onView: (expense: WhatsAppExpense) => void;
}

const ExpensesTable: React.FC<ExpensesTableProps> = ({ expenses, onAction, onView }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedExpense, setSelectedExpense] = useState<WhatsAppExpense | null>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, expense: WhatsAppExpense) => {
    setAnchorEl(event.currentTarget);
    setSelectedExpense(expense);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedExpense(null);
  };

  const handleAction = (action: 'approve' | 'reject' | 'view' | 'delete') => {
    if (selectedExpense) {
      onAction(selectedExpense, action);
    }
    handleMenuClose();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'success';
      case 'rejected':
        return 'error';
      case 'pending':
        return 'warning';
      default:
        return 'default';
    }
  };

  const formatCurrency = (amount: number) => {
    return `AED ${amount.toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <TableContainer sx={{ overflowX: 'auto' }}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Vehicle</TableCell>
            <TableCell>Driver</TableCell>
            <TableCell>Amount</TableCell>
            <TableCell>Type</TableCell>
            <TableCell>Date</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {expenses.map((expense) => (
            <TableRow key={expense._id}>
              <TableCell>
                {expense.vehicle?.licensePlate || 'Unknown'}
              </TableCell>
              <TableCell>
                {expense.driver ? `${expense.driver.firstName} ${expense.driver.lastName}` : 'Unknown'}
              </TableCell>
              <TableCell>{formatCurrency(expense.amount)}</TableCell>
              <TableCell>{expense.expenseType}</TableCell>
              <TableCell>{formatDate(expense.date)}</TableCell>
              <TableCell>
                <Chip
                  label={expense.status}
                  color={getStatusColor(expense.status) as any}
                  size="small"
                />
              </TableCell>
              <TableCell>
                <IconButton
                  size="small"
                  onClick={(e) => handleMenuOpen(e, expense)}
                >
                  <MoreVertIcon />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleAction('view')}>
          <ListItemIcon>
            <ViewIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>View Details</ListItemText>
        </MenuItem>
        {selectedExpense?.status === 'pending' && (
          <>
            <MenuItem onClick={() => handleAction('approve')}>
              <ListItemIcon>
                <CheckCircleIcon fontSize="small" color="success" />
              </ListItemIcon>
              <ListItemText>Approve</ListItemText>
            </MenuItem>
            <MenuItem onClick={() => handleAction('reject')}>
              <ListItemIcon>
                <CancelIcon fontSize="small" color="error" />
              </ListItemIcon>
              <ListItemText>Reject</ListItemText>
            </MenuItem>
          </>
        )}
        <MenuItem onClick={() => handleAction('delete')}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>
    </TableContainer>
  );
};

export default WhatsAppExpenses;



