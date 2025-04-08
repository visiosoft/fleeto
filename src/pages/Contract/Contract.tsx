import React, { useState, useEffect } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Chip,
  Typography,
  useTheme,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import PageLayout from '../../components/PageLayout/PageLayout';

interface Contract {
  id: string;
  title: string;
  client: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'expired' | 'pending';
  value: number;
}

const Contract: React.FC = () => {
  const theme = useTheme();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [contracts, setContracts] = useState<Contract[]>([]);

  // Mock data - replace with actual API call
  useEffect(() => {
    const mockContracts: Contract[] = [
      {
        id: '1',
        title: 'Transportation Contract',
        client: 'ABC Logistics',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        status: 'active',
        value: 50000,
      },
      // Add more mock data as needed
    ];
    setContracts(mockContracts);
  }, []);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getStatusColor = (status: Contract['status']) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'expired':
        return 'error';
      case 'pending':
        return 'warning';
      default:
        return 'default';
    }
  };

  const handleAdd = () => {
    // Implement add functionality
  };

  const handleRefresh = () => {
    // Implement refresh functionality
  };

  const handleFilter = () => {
    // Implement filter functionality
  };

  return (
    <PageLayout
      title="Contract Management"
      onAdd={handleAdd}
      onRefresh={handleRefresh}
      onFilter={handleFilter}
      addButtonText="Add Contract"
    >
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Client</TableCell>
              <TableCell>Start Date</TableCell>
              <TableCell>End Date</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Value</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {contracts
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((contract) => (
                <TableRow key={contract.id}>
                  <TableCell>{contract.title}</TableCell>
                  <TableCell>{contract.client}</TableCell>
                  <TableCell>{contract.startDate}</TableCell>
                  <TableCell>{contract.endDate}</TableCell>
                  <TableCell>
                    <Chip
                      label={contract.status}
                      color={getStatusColor(contract.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>${contract.value.toLocaleString()}</TableCell>
                  <TableCell align="right">
                    <IconButton size="small" color="primary">
                      <ViewIcon />
                    </IconButton>
                    <IconButton size="small" color="primary">
                      <EditIcon />
                    </IconButton>
                    <IconButton size="small" color="error">
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={contracts.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </PageLayout>
  );
};

export default Contract; 