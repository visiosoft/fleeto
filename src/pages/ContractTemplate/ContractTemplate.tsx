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
      if (!id || !token) {
        setError('No contract ID provided or not authenticated');
        setLoading(false);
        return;
      }

      try {
        // Fetch contract data
        const contractResponse = await axios.get(getApiUrl(`${API_CONFIG.ENDPOINTS.CONTRACTS}/${id}`), {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        const contractData = contractResponse.data;
        setContract(contractData);
        
        // Set template from contract data if available
        if (contractData.template) {
          setTemplate({
            _id: contractData.template._id || 'default',
            name: 'Contract Template',
            content: contractData.template.content || defaultTemplate
          });
        }

        // Fetch vehicles data
        const vehiclesResponse = await axios.get(getApiUrl(API_CONFIG.ENDPOINTS.VEHICLES), {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        setVehicles(vehiclesResponse.data || []);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load contract data');
        navigate('/contracts');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, navigate, token]);

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