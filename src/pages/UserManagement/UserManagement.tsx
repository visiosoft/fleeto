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
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import UserService, { CreateUserData, UpdateUserData } from '../../services/UserService';
import { User, APIResponse } from '../../types/api';
import { useAuth } from '../../contexts/AuthContext';
import CompanyService from '../../services/CompanyService';

interface Company {
  _id: string;
  name: string;
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>('');
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
    companyId: '',
  });
  const { token } = useAuth();
  const userService = UserService.getInstance();
  const companyService = CompanyService.getInstance();

  useEffect(() => {
    if (token) {
      userService.setToken(token);
      fetchCompanies();
    }
  }, [token]);

  useEffect(() => {
    if (selectedCompany) {
      fetchUsers(selectedCompany);
    }
  }, [selectedCompany]);

  const fetchCompanies = async () => {
    try {
      const response = await companyService.getAllCompanies();
      const companies = response.data.data.companies;
      setCompanies(companies);
      if (companies.length > 0) {
        setSelectedCompany(companies[0]._id);
      }
    } catch (err) {
      setError('Failed to fetch companies');
      console.error('Error fetching companies:', err);
    }
  };

  const fetchUsers = async (companyId: string) => {
    try {
      setLoading(true);
      const response = await userService.getUsers(companyId);
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
        companyId: selectedCompany,
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
      companyId: selectedCompany,
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
        const createData = { ...formData };
        delete createData.confirmPassword;
        await userService.createUser(createData as CreateUserData);
      }
      handleCloseDialog();
      fetchUsers(selectedCompany);
    } catch (err) {
      setError('Failed to save user');
      console.error('Error saving user:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await userService.deleteUser(id);
        fetchUsers(selectedCompany);
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

      <Box sx={{ mb: 3 }}>
        <FormControl fullWidth>
          <InputLabel>Select Company</InputLabel>
          <Select
            value={selectedCompany}
            label="Select Company"
            onChange={(e) => setSelectedCompany(e.target.value)}
            required
          >
            {companies.map((company) => (
              <MenuItem key={company._id} value={company._id}>
                {company.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        {loading ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <LinearProgress />
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Phone</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user._id}>
                    <TableCell>{`${user.firstName} ${user.lastName}`}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.phone}</TableCell>
                    <TableCell>
                      <Chip
                        label={user.role}
                        color="primary"
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={user.status}
                        color={getStatusColor(user.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton onClick={() => handleOpenDialog(user)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton onClick={() => handleDelete(user._id)}>
                        <DeleteIcon />
                      </IconButton>
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
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Company</InputLabel>
                  <Select
                    value={formData.companyId}
                    label="Company"
                    onChange={(e) => setFormData({ ...formData, companyId: e.target.value })}
                    required
                  >
                    {companies.map((company) => (
                      <MenuItem key={company._id} value={company._id}>
                        {company.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
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
              <Grid item xs={12} md={6}>
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