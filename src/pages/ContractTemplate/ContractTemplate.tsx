import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';
import axios from 'axios';
import { API_CONFIG, getApiUrl } from '../../config/api';
import ContractTemplateEditor, { Vehicle, defaultTemplate } from '../../components/ContractTemplate/ContractTemplateEditor';
import { useAuth } from '../../contexts/AuthContext';

const ContractTemplate: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [contract, setContract] = useState<any>(null);
  const [template, setTemplate] = useState<any>({
    _id: 'default',
    name: 'Default Template',
    content: defaultTemplate
  });
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) {
        setError('No contract ID provided');
        setLoading(false);
        return;
      }

      try {
        const token = localStorage.getItem('token');

        // Try with auth header first if token exists
        let contractResponse;
        try {
          contractResponse = await axios.get(
            getApiUrl(`${API_CONFIG.ENDPOINTS.CONTRACTS}/${id}`),
            token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
          );
        } catch (err) {
          // Fallback: try without auth in case backend allows public access
          contractResponse = await axios.get(
            getApiUrl(`${API_CONFIG.ENDPOINTS.CONTRACTS}/${id}`)
          );
        }

        const contractData = contractResponse.data;
        setContract(contractData);

        if (contractData.template) {
          setTemplate({
            _id: contractData.template._id || 'default',
            name: 'Contract Template',
            content: contractData.template.content || defaultTemplate
          });
        } else {
          setTemplate({ _id: 'default', name: 'Contract Template', content: defaultTemplate });
        }

        const vehiclesResponse = await axios.get(getApiUrl(API_CONFIG.ENDPOINTS.VEHICLES), token ? { headers: { Authorization: `Bearer ${token}` } } : undefined);
        setVehicles(vehiclesResponse.data || []);
      } catch (error: any) {
        console.error('Error fetching contract/template/vehicles:', error?.response?.data || error);
        setError(error?.response?.data?.message || 'Failed to load contract data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleSave = async (content: string) => {
    if (!contract?._id || !token) return;

    try {
      await axios.patch(
        getApiUrl(`${API_CONFIG.ENDPOINTS.CONTRACTS}/${contract._id}`),
        {
          template: {
            content,
            _id: template._id
          }
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
    } catch (error) {
      console.error('Error saving template:', error);
    }
  };

  const handleClose = () => {
    navigate('/contracts');
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !contract) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Typography color="error">{error || 'Contract not found'}</Typography>
      </Box>
    );
  }

  return (
    <ContractTemplateEditor
      template={template}
      contract={contract}
      vehicles={vehicles}
      onSave={handleSave}
      onClose={handleClose}
      allowEdit={true}
      showPreview={true}
    />
  );
};

export default ContractTemplate; 