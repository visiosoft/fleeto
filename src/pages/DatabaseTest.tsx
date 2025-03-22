import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Alert,
  Chip,
  CircularProgress,
  List,
  ListItemButton,
  ListItemText,
} from '@mui/material';
import {
  CheckCircle,
  Error,
  Storage,
  DatasetOutlined,
  Refresh,
} from '@mui/icons-material';
import mongoDbService from '../services/mongoDbService';

// Define test collection names
const testCollections = ['drivers', 'vehicles', 'maintenance', 'fuel', 'contracts'];

const DatabaseTest: React.FC = () => {
  // State for connection status
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [collectionTests, setCollectionTests] = useState<Record<string, any>>({});
  const [customCollection, setCustomCollection] = useState<string>('');
  const [customEndpoint, setCustomEndpoint] = useState<string>('');

  // Test MongoDB connection
  const testConnection = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    
    try {
      const connected = await mongoDbService.checkConnection();
      setIsConnected(connected);
      if (!connected) {
        setErrorMessage('Failed to connect to MongoDB. Check server connection.');
      }
    } catch (error: any) {
      setIsConnected(false);
      setErrorMessage(error.message || 'Unknown error occurred');
      console.error('Connection test error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Test getting data from a collection
  const testCollection = async (collection: string) => {
    setCollectionTests(prev => ({
      ...prev,
      [collection]: { loading: true, result: null, error: null }
    }));

    try {
      const data = await mongoDbService.getAll(collection);
      setCollectionTests(prev => ({
        ...prev,
        [collection]: { 
          loading: false, 
          result: data, 
          error: null,
          count: Array.isArray(data) ? data.length : 0
        }
      }));
    } catch (error: any) {
      setCollectionTests(prev => ({
        ...prev,
        [collection]: { 
          loading: false, 
          result: null, 
          error: error.message || 'Failed to get data'
        }
      }));
    }
  };

  // Test custom endpoint
  const testCustomEndpoint = async () => {
    if (!customEndpoint) {
      setErrorMessage('Please enter a custom endpoint');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const endpoint = customEndpoint.startsWith('/') ? customEndpoint : `/${customEndpoint}`;
      const data = await fetch(`/api${endpoint}`);
      const jsonData = await data.json();
      
      setCollectionTests(prev => ({
        ...prev,
        custom: { 
          loading: false, 
          result: jsonData, 
          error: null,
          endpoint: customEndpoint
        }
      }));
    } catch (error: any) {
      setErrorMessage(`Custom endpoint error: ${error.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Reset all tests
  const resetAllTests = () => {
    setIsConnected(null);
    setErrorMessage(null);
    setCollectionTests({});
    setCustomCollection('');
    setCustomEndpoint('');
  };

  // Initial connection test on component mount
  useEffect(() => {
    testConnection();
  }, []);

  return (
    <Box sx={{ padding: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Storage sx={{ mr: 1 }} />
        MongoDB Connection Tester
      </Typography>

      {/* Connection Status Card */}
      <Card sx={{ mb: 4 }}>
        <CardHeader 
          title="Connection Status" 
          subheader="Test the connection to MongoDB"
          action={
            <Button 
              variant="outlined" 
              startIcon={<Refresh />} 
              onClick={testConnection}
              disabled={isLoading}
            >
              Refresh
            </Button>
          }
        />
        <Divider />
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            {isLoading ? (
              <CircularProgress size={24} sx={{ mr: 2 }} />
            ) : isConnected === null ? (
              <Chip label="Not Tested" color="default" sx={{ mr: 2 }} />
            ) : isConnected ? (
              <Chip 
                icon={<CheckCircle />} 
                label="Connected" 
                color="success" 
                sx={{ mr: 2 }} 
              />
            ) : (
              <Chip 
                icon={<Error />} 
                label="Disconnected" 
                color="error" 
                sx={{ mr: 2 }} 
              />
            )}

            <Typography variant="body1">
              {isConnected ? 'Successfully connected to MongoDB' : 
               isConnected === false ? 'Failed to connect to MongoDB' : 'Click to test connection'}
            </Typography>
          </Box>

          {errorMessage && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {errorMessage}
            </Alert>
          )}

          {isConnected === false && (
            <Alert severity="info" sx={{ mt: 2 }}>
              Note: This is expected if no backend API server is running. In production, 
              the application will fall back to local data.
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Collection Tests */}
      <Card sx={{ mb: 4 }}>
        <CardHeader 
          title="Collection Tests" 
          subheader="Test access to specific collections"
        />
        <Divider />
        <CardContent>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {testCollections.map(collection => (
              <Grid item key={collection}>
                <Button 
                  variant="outlined"
                  onClick={() => testCollection(collection)}
                  disabled={isConnected === false || isLoading}
                  startIcon={<Storage />}
                >
                  Test {collection}
                </Button>
              </Grid>
            ))}
          </Grid>

          <Grid container spacing={2}>
            <Grid item xs={12} md={8}>
              <TextField
                label="Custom Collection"
                value={customCollection}
                onChange={(e) => setCustomCollection(e.target.value)}
                fullWidth
                disabled={isConnected === false}
                helperText="Enter a collection name to test"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Button 
                variant="contained"
                onClick={() => testCollection(customCollection)}
                disabled={!customCollection || isConnected === false}
                fullWidth
                sx={{ height: '56px' }}
              >
                Test Custom Collection
              </Button>
            </Grid>
          </Grid>

          {/* Results */}
          {Object.keys(collectionTests).length > 0 && (
            <Box sx={{ mt: 4 }}>
              <Typography variant="h6" gutterBottom>
                Test Results
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              {Object.entries(collectionTests).map(([collection, data]: [string, any]) => (
                <Paper key={collection} sx={{ p: 2, mb: 2 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                    Collection: {collection}
                  </Typography>
                  
                  {data.loading && <CircularProgress size={20} />}
                  
                  {!data.loading && data.error && (
                    <Alert severity="error" sx={{ mt: 1 }}>
                      {data.error}
                    </Alert>
                  )}
                  
                  {!data.loading && !data.error && (
                    <>
                      <Chip 
                        label={`${data.count || 0} documents found`} 
                        color="primary" 
                        size="small"
                        sx={{ mb: 2 }}
                      />
                      
                      {Array.isArray(data.result) && data.result.length > 0 ? (
                        <Box sx={{ maxHeight: '200px', overflow: 'auto' }}>
                          <pre style={{ margin: 0 }}>
                            {JSON.stringify(data.result, null, 2)}
                          </pre>
                        </Box>
                      ) : (
                        <Typography color="text.secondary">
                          No data found or empty collection
                        </Typography>
                      )}
                    </>
                  )}
                </Paper>
              ))}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Custom Endpoint Test */}
      <Card>
        <CardHeader 
          title="Custom API Endpoint Test" 
          subheader="Test a custom API endpoint"
        />
        <Divider />
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={8}>
              <TextField
                label="Custom Endpoint"
                value={customEndpoint}
                onChange={(e) => setCustomEndpoint(e.target.value)}
                fullWidth
                placeholder="e.g., /health or /drivers/123"
                helperText="Enter a custom endpoint path to test"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Button 
                variant="contained"
                onClick={testCustomEndpoint}
                disabled={!customEndpoint || isLoading}
                fullWidth
                sx={{ height: '56px' }}
              >
                Test Endpoint
              </Button>
            </Grid>
          </Grid>

          {collectionTests.custom && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Endpoint: {collectionTests.custom.endpoint}
              </Typography>
              <Box sx={{ maxHeight: '300px', overflow: 'auto', mt: 2 }}>
                <pre style={{ margin: 0 }}>
                  {JSON.stringify(collectionTests.custom.result, null, 2)}
                </pre>
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Reset Button */}
      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Button
          variant="outlined"
          color="secondary"
          onClick={resetAllTests}
          startIcon={<Refresh />}
        >
          Reset All Tests
        </Button>
      </Box>
    </Box>
  );
};

export default DatabaseTest; 