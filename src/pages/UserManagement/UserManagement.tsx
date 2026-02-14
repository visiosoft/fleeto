import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Button,
  LinearProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Avatar,
  Stack,
  Tooltip,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  AdminPanelSettings as AdminIcon,
} from '@mui/icons-material';
import UserService, { CreateUserData, UpdateUserData } from '../../services/UserService';
import { User } from '../../types/api';
import { useAuth } from '../../contexts/AuthContext';

const UserManagement: React.FC = () => {
  const theme = useTheme();
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<Partial<User>>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: 'user',
    status: 'active',
    password: '',
    confirmPassword: '',
  });
  const { token, selectedCompanyId } = useAuth();
  const userService = UserService.getInstance();

  useEffect(() => {
    if (token && selectedCompanyId) {
      userService.setToken(token);
      fetchUsers();
    }
  }, [token, selectedCompanyId]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      if (!selectedCompanyId) {
        setError('No company selected');
        setUsers([]);
        return;
      }
      const response = await userService.getUsers(selectedCompanyId);
      console.log('API Response:', response);
      
      if (response && response.data) {
        setUsers(response.data.users);
      } else {
        console.error('Invalid response format:', response);
        setUsers([]);
        setError('Invalid response format from server');
      }
    } catch (err) {
      setError('Failed to fetch users');
      console.error('Error fetching users:', err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (user?: User) => {
    if (user) {
      setSelectedUser(user);
      setFormData(user);
    } else {
      setSelectedUser(null);
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        role: 'user',
        status: 'active',
        password: '',
        confirmPassword: '',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedUser(null);
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      role: 'user',
      status: 'active',
      password: '',
      confirmPassword: '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        return;
      }

      if (selectedUser) {
        const updateData = { ...formData };
        if (!updateData.password) {
          delete updateData.password;
          delete updateData.confirmPassword;
        } else {
          delete updateData.confirmPassword;
        }
        await userService.updateUser(selectedUser._id, updateData as UpdateUserData);
      } else {
        if (!formData.password) {
          setError('Password is required for new users');
          return;
        }
        const createData = { ...formData, companyId: selectedCompanyId };
        delete createData.confirmPassword;
        await userService.createUser(createData as CreateUserData);
      }
      handleCloseDialog();
      fetchUsers();
    } catch (err) {
      setError('Failed to save user');
      console.error('Error saving user:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await userService.deleteUser(id);
        fetchUsers();
      } catch (err) {
        setError('Failed to delete user');
        console.error('Error deleting user:', err);
      }
    }
  };

  const getStatusColor = (status: User['status']) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" component="h1">
          User Management
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add User
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        {loading ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <LinearProgress />
          </Box>
        ) : (
          <TableContainer sx={{ 
            borderRadius: 3,
            overflow: 'hidden',
            boxShadow: `0 1px 3px ${alpha(theme.palette.common.black, 0.1)}`,
          }}>
            <Table>
              <TableHead>
                <TableRow sx={{ background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)` }}>
                  <TableCell sx={{ fontWeight: 700, color: theme.palette.text.secondary, borderBottom: `2px solid ${theme.palette.divider}`, py: 2.5 }}>User Info</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: theme.palette.text.secondary, borderBottom: `2px solid ${theme.palette.divider}`, py: 2.5 }}>Contact</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: theme.palette.text.secondary, borderBottom: `2px solid ${theme.palette.divider}`, py: 2.5 }}>Role</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: theme.palette.text.secondary, borderBottom: `2px solid ${theme.palette.divider}`, py: 2.5 }}>Status</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700, color: theme.palette.text.secondary, borderBottom: `2px solid ${theme.palette.divider}`, py: 2.5 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => (
                  <TableRow 
                    key={user._id}
                    onMouseEnter={() => setHoveredRow(user._id)}
                    onMouseLeave={() => setHoveredRow(null)}
                    sx={{
                      backgroundColor: hoveredRow === user._id 
                        ? alpha(theme.palette.primary.main, 0.04)
                        : 'transparent',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      transform: hoveredRow === user._id ? 'translateY(-2px)' : 'translateY(0)',
                      boxShadow: hoveredRow === user._id 
                        ? `0 4px 12px ${alpha(theme.palette.primary.main, 0.15)}`
                        : 'none',
                      borderLeft: hoveredRow === user._id 
                        ? `4px solid ${theme.palette.primary.main}`
                        : '4px solid transparent',
                      '& td': {
                        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                        py: 2.5,
                      },
                      '&:last-child td': {
                        borderBottom: 'none',
                      },
                      cursor: 'pointer',
                    }}
                  >
                    <TableCell>
                      <Stack spacing={0.5}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar 
                            sx={{ 
                              width: 40, 
                              height: 40,
                              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                              boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.3)}`,
                            }}
                          >
                            {user.role === 'admin' ? (
                              <AdminIcon sx={{ fontSize: 20 }} />
                            ) : (
                              <PersonIcon sx={{ fontSize: 20 }} />
                            )}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight={700}>
                              {`${user.firstName} ${user.lastName}`}
                            </Typography>
                            <Chip
                              label={user.role}
                              color="primary"
                              size="small"
                              sx={{
                                height: 20,
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                mt: 0.5,
                              }}
                            />
                          </Box>
                        </Box>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Stack spacing={0.5}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <EmailIcon sx={{ fontSize: 14, color: theme.palette.info.main }} />
                          <Typography variant="body2" color="text.secondary">
                            {user.email}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <PhoneIcon sx={{ fontSize: 14, color: theme.palette.success.main }} />
                          <Typography variant="body2" color="text.secondary">
                            {user.phone}
                          </Typography>
                        </Box>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={user.role}
                        color="primary"
                        size="small"
                        sx={{
                          fontWeight: 700,
                          fontSize: '0.75rem',
                          letterSpacing: '0.5px',
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={user.status}
                        color={getStatusColor(user.status)}
                        size="small"
                        sx={{
                          fontWeight: 700,
                          fontSize: '0.75rem',
                          letterSpacing: '0.5px',
                        }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Stack direction="row" spacing={0.5} justifyContent="center">
                        <Tooltip title="Edit User">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenDialog(user)}
                            sx={{
                              backgroundColor: alpha(theme.palette.info.main, 0.1),
                              '&:hover': {
                                backgroundColor: alpha(theme.palette.info.main, 0.2),
                                transform: 'scale(1.1)',
                              },
                              transition: 'all 0.2s',
                            }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete User">
                          <IconButton
                            size="small"
                            onClick={() => handleDelete(user._id)}
                            sx={{
                              backgroundColor: alpha(theme.palette.error.main, 0.1),
                              '&:hover': {
                                backgroundColor: alpha(theme.palette.error.main, 0.2),
                                transform: 'scale(1.1)',
                              },
                              transition: 'all 0.2s',
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedUser ? 'Edit User' : 'Add New User'}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="First Name"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Last Name"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Role</InputLabel>
                  <Select
                    value={formData.role}
                    label="Role"
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as User['role'] })}
                    required
                  >
                    <MenuItem value="admin">Admin</MenuItem>
                    <MenuItem value="manager">Manager</MenuItem>
                    <MenuItem value="user">User</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={formData.status}
                    label="Status"
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as User['status'] })}
                    required
                  >
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="inactive">Inactive</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required={!selectedUser}
                  helperText={selectedUser ? "Leave blank to keep current password" : "Required for new users"}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Confirm Password"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required={!selectedUser}
                  error={formData.password !== formData.confirmPassword}
                  helperText={formData.password !== formData.confirmPassword ? "Passwords do not match" : ""}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button type="submit" variant="contained" color="primary">
              {selectedUser ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Container>
  );
};

export default UserManagement;