import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import axios from 'axios';
import { API_CONFIG, getApiUrl } from '../../config/api';
import ContractTemplateEditor, { defaultTemplate } from '../../components/ContractTemplate/ContractTemplateEditor';

const ContractTemplate: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [contract, setContract] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [template, setTemplate] = useState({
    _id: 'default',
    name: 'Default Template',
    content: defaultTemplate
  });

  useEffect(() => {
    const fetchContract = async () => {
      try {
        const response = await axios.get(getApiUrl(`${API_CONFIG.ENDPOINTS.CONTRACTS}/${id}`));
        setContract(response.data);
      } catch (error) {
        console.error('Error fetching contract:', error);
        navigate('/contracts');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchContract();
    }
  }, [id, navigate]);

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
      onSave={handleSave}
      onClose={handleClose}
      allowEdit={true}
      showPreview={true}
    />
  );
};

export default ContractTemplate; 