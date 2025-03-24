import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import axios from 'axios';
import { API_CONFIG, getApiUrl } from '../../config/api';
import ContractTemplateEditor, { Vehicle, defaultTemplate } from '../../components/ContractTemplate/ContractTemplateEditor';

const ContractTemplate: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [contract, setContract] = useState<any>(null);
  const [template, setTemplate] = useState<any>({
    _id: 'default',
    name: 'Default Template',
    content: defaultTemplate
  });
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContract = async () => {
      try {
        const response = await axios.get(getApiUrl(`${API_CONFIG.ENDPOINTS.CONTRACTS}/${id}`));
        setContract(response.data);
        
        // If contract has a template, use that instead of default
        if (response.data.template) {
          setTemplate({
            _id: response.data.template._id || 'default',
            name: 'Contract Template',
            content: response.data.template.content || defaultTemplate
          });
        }
      } catch (error) {
        console.error('Error fetching contract:', error);
        navigate('/contracts');
      } finally {
        setLoading(false);
      }
    };

    const fetchVehicles = async () => {
      try {
        const response = await axios.get(getApiUrl(API_CONFIG.ENDPOINTS.VEHICLES));
        setVehicles(response.data || []);
      } catch (error) {
        console.error('Error fetching vehicles:', error);
        setVehicles([]);
      }
    };

    if (id) {
      fetchContract();
      fetchVehicles();
    }
  }, [id, navigate]);

  useEffect(() => {
    // Load contract data from localStorage
    const savedData = localStorage.getItem('currentContractData');
    if (savedData) {
      const { contract: savedContract, vehicles: savedVehicles } = JSON.parse(savedData);
      setContract(savedContract);
      setVehicles(savedVehicles);
      
      // If saved contract has a template, use that
      if (savedContract.template) {
        setTemplate({
          _id: savedContract.template._id || 'default',
          name: 'Contract Template',
          content: savedContract.template.content || defaultTemplate
        });
      }
    }
  }, []);

  const handleSave = async (content: string) => {
    try {
      // Save the template content to the backend if needed
      console.log('Saving template:', content);
      // You can implement the actual save logic here
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

  if (!contract) {
    return null;
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