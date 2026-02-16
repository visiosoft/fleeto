const { ObjectId } = require('mongodb');
const db = require('../config/db');

const costController = {
    /**
     * Get total costs per vehicle
     */
    async getVehicleCosts(req, res) {
        try {
            // Get company ID from authenticated user
            const companyId = req.user.companyId;
            
            if (!companyId) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Company ID not found in user token'
                });
            }
            
            console.log(`Fetching costs for company ID: ${companyId}`);
            
            const vehicles = await db.getCollection('vehicles');
            const expenses = await db.getCollection('expenses');
            const fuel = await db.getCollection('fuel');
            const maintenance = await db.getCollection('maintenance');

            // Get all vehicles for this company
            const vehiclesList = await vehicles.find({ 
                companyId: companyId.toString() 
            }).toArray();
            console.log(`Found ${vehiclesList.length} vehicles for company ${companyId}`);
            
            // Get costs for each vehicle
            const vehicleCosts = await Promise.all(vehiclesList.map(async (vehicle) => {
                const vehicleId = vehicle._id.toString();
                console.log(`Processing vehicle: ${vehicleId}`);

                // Get expenses for this vehicle
                const vehicleExpenses = await expenses.find({ 
                    vehicleId,
                    companyId: companyId.toString()
                }).toArray();
                console.log(`Found ${vehicleExpenses.length} expenses for vehicle ${vehicleId}`);
                console.log('Expense records:', JSON.stringify(vehicleExpenses, null, 2));
                const totalExpenses = vehicleExpenses.reduce((sum, expense) => {
                    const amount = parseFloat(expense.amount) || 0;
                    console.log(`Adding expense amount: ${amount}`);
                    return sum + amount;
                }, 0);

                // Get fuel costs for this vehicle
                const vehicleFuel = await fuel.find({ 
                    vehicleId,
                    companyId: companyId.toString()
                }).toArray();
                console.log(`Found ${vehicleFuel.length} fuel records for vehicle ${vehicleId}`);
                console.log('Fuel records:', JSON.stringify(vehicleFuel, null, 2));
                const totalFuel = vehicleFuel.reduce((sum, fuel) => {
                    const cost = parseFloat(fuel.cost) || 0;
                    console.log(`Adding fuel cost: ${cost}`);
                    return sum + cost;
                }, 0);

                // Get maintenance costs for this vehicle
                const vehicleMaintenance = await maintenance.find({ 
                    vehicleId,
                    companyId: companyId.toString()
                }).toArray();
                console.log(`Found ${vehicleMaintenance.length} maintenance records for vehicle ${vehicleId}`);
                console.log('Maintenance records:', JSON.stringify(vehicleMaintenance, null, 2));
                const totalMaintenance = vehicleMaintenance.reduce((sum, maintenance) => {
                    const cost = parseFloat(maintenance.cost) || 0;
                    console.log(`Adding maintenance cost: ${cost}`);
                    return sum + cost;
                }, 0);

                // Calculate total cost
                const totalCost = totalExpenses + totalFuel + totalMaintenance;
                console.log(`Total costs for vehicle ${vehicleId}:`, {
                    expenses: totalExpenses,
                    fuel: totalFuel,
                    maintenance: totalMaintenance,
                    total: totalCost
                });

                return {
                    vehicleId: vehicle._id,
                    vehicleName: `${vehicle.make} ${vehicle.model} (${vehicle.licensePlate})`,
                    costs: {
                        expenses: totalExpenses,
                        fuel: totalFuel,
                        maintenance: totalMaintenance,
                        total: totalCost
                    },
                    details: {
                        expenses: vehicleExpenses,
                        fuel: vehicleFuel,
                        maintenance: vehicleMaintenance
                    }
                };
            }));

            // Calculate overall totals
            const overallTotals = vehicleCosts.reduce((acc, vehicle) => {
                acc.totalExpenses += vehicle.costs.expenses;
                acc.totalFuel += vehicle.costs.fuel;
                acc.totalMaintenance += vehicle.costs.maintenance;
                acc.totalCost += vehicle.costs.total;
                return acc;
            }, { totalExpenses: 0, totalFuel: 0, totalMaintenance: 0, totalCost: 0 });

            console.log('Overall totals:', overallTotals);

            res.json({
                vehicles: vehicleCosts,
                totals: overallTotals
            });
        } catch (error) {
            console.error('Error getting vehicle costs:', error);
            res.status(500).json({ message: error.message });
        }
    },

    /**
     * Get cost breakdown for a specific vehicle
     */
    async getVehicleCostBreakdown(req, res) {
        try {
            // Get company ID from authenticated user
            const companyId = req.user.companyId;
            
            if (!companyId) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Company ID not found in user token'
                });
            }
            
            const { vehicleId } = req.params;
            console.log(`Fetching cost breakdown for vehicle ${vehicleId} in company ${companyId}`);
            
            const expenses = await db.getCollection('expenses');
            const fuel = await db.getCollection('fuel');
            const maintenance = await db.getCollection('maintenance');
            const vehicles = await db.getCollection('vehicles');

            // Get vehicle details
            const vehicle = await vehicles.findOne({ 
                _id: new ObjectId(vehicleId),
                companyId: companyId.toString()
            });
            if (!vehicle) {
                return res.status(404).json({ message: 'Vehicle not found' });
            }

            // Get all costs for this vehicle
            const [vehicleExpenses, vehicleFuel, vehicleMaintenance] = await Promise.all([
                expenses.find({ 
                    vehicleId,
                    companyId: companyId.toString()
                }).toArray(),
                fuel.find({ 
                    vehicleId,
                    companyId: companyId.toString()
                }).toArray(),
                maintenance.find({ 
                    vehicleId,
                    companyId: companyId.toString()
                }).toArray()
            ]);

            console.log(`Found ${vehicleExpenses.length} expenses for vehicle ${vehicleId}`);
            console.log('Expense records:', JSON.stringify(vehicleExpenses, null, 2));
            console.log(`Found ${vehicleFuel.length} fuel records for vehicle ${vehicleId}`);
            console.log('Fuel records:', JSON.stringify(vehicleFuel, null, 2));
            console.log(`Found ${vehicleMaintenance.length} maintenance records for vehicle ${vehicleId}`);
            console.log('Maintenance records:', JSON.stringify(vehicleMaintenance, null, 2));

            // Calculate totals
            const totalExpenses = vehicleExpenses.reduce((sum, expense) => {
                const amount = parseFloat(expense.amount) || 0;
                console.log(`Adding expense amount: ${amount}`);
                return sum + amount;
            }, 0);
            const totalFuel = vehicleFuel.reduce((sum, fuel) => {
                const cost = parseFloat(fuel.cost) || 0;
                console.log(`Adding fuel cost: ${cost}`);
                return sum + cost;
            }, 0);
            const totalMaintenance = vehicleMaintenance.reduce((sum, maintenance) => {
                const cost = parseFloat(maintenance.cost) || 0;
                console.log(`Adding maintenance cost: ${cost}`);
                return sum + cost;
            }, 0);
            const totalCost = totalExpenses + totalFuel + totalMaintenance;

            console.log('Cost breakdown:', {
                expenses: totalExpenses,
                fuel: totalFuel,
                maintenance: totalMaintenance,
                total: totalCost
            });

            res.json({
                vehicle: {
                    id: vehicle._id,
                    name: `${vehicle.make} ${vehicle.model}`,
                    licensePlate: vehicle.licensePlate
                },
                costs: {
                    expenses: totalExpenses,
                    fuel: totalFuel,
                    maintenance: totalMaintenance,
                    total: totalCost
                },
                details: {
                    expenses: vehicleExpenses,
                    fuel: vehicleFuel,
                    maintenance: vehicleMaintenance
                }
            });
        } catch (error) {
            console.error('Error getting vehicle cost breakdown:', error);
            res.status(500).json({ message: error.message });
        }
    },

    /**
     * Get all expenses for all vehicles (no date filter)
     */
    async getAllCompanyExpenses(req, res) {
        try {
            // Get company ID from authenticated user
            const companyId = req.user.companyId;
            
            if (!companyId) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Company ID not found in user token'
                });
            }
            
            console.log(`Fetching all expenses for company ID: ${companyId}`);
            
            const vehicles = await db.getCollection('vehicles');
            const expenses = await db.getCollection('expenses');

            // Get all vehicles for this company
            const vehiclesList = await vehicles.find({
                companyId: companyId.toString()
            }).toArray();
            console.log(`Found ${vehiclesList.length} vehicles for company ${companyId}`);
            
            // Get expenses for each vehicle (ALL expenses, no date filter)
            const vehicleExpenses = await Promise.all(vehiclesList.map(async (vehicle) => {
                const vehicleId = vehicle._id.toString();
                console.log(`Processing vehicle: ${vehicleId}`);

                // Get ALL expenses for this vehicle
                const vehicleExpensesList = await expenses.find({
                    vehicleId,
                    companyId: companyId.toString()
                }).sort({ date: -1 }).toArray();

                console.log(`Found ${vehicleExpensesList.length} total expenses for vehicle ${vehicleId}`);

                const totalExpenses = vehicleExpensesList.reduce((sum, expense) => {
                    const amount = parseFloat(expense.amount) || 0;
                    return sum + amount;
                }, 0);

                return {
                    vehicleId: vehicle._id,
                    vehicleName: `${vehicle.make} ${vehicle.model} (${vehicle.licensePlate})`,
                    expenses: totalExpenses,
                    details: vehicleExpensesList
                };
            }));

            // Calculate overall total
            const totalExpenses = vehicleExpenses.reduce((sum, vehicle) => sum + vehicle.expenses, 0);

            console.log('All expenses totals:', {
                totalExpenses,
                vehicleCount: vehicleExpenses.length
            });

            res.json({
                vehicles: vehicleExpenses,
                total: totalExpenses,
                period: {
                    start: null,
                    end: null
                }
            });
        } catch (error) {
            console.error('Error getting all company expenses:', error);
            res.status(500).json({ message: error.message });
        }
    },

    /**
     * Get current month's expenses for all vehicles
     */
    async getCurrentMonthExpenses(req, res) {
        try {
            // Get company ID from authenticated user
            const companyId = req.user.companyId;
            
            if (!companyId) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Company ID not found in user token'
                });
            }
            
            console.log(`Fetching current month expenses for company ID: ${companyId}`);
            
            const vehicles = await db.getCollection('vehicles');
            const expenses = await db.getCollection('expenses');

            // Get current month's start and end dates
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

            // Get all vehicles for this company
            const vehiclesList = await vehicles.find({
                companyId: companyId.toString()
            }).toArray();
            console.log(`Found ${vehiclesList.length} vehicles for company ${companyId}`);
            
            // Get expenses for each vehicle for current month
            const vehicleExpenses = await Promise.all(vehiclesList.map(async (vehicle) => {
                const vehicleId = vehicle._id.toString();
                console.log(`Processing vehicle: ${vehicleId}`);

                // Get expenses for this vehicle for current month
                const vehicleExpensesList = await expenses.find({
                    vehicleId,
                    companyId: companyId.toString(),
                    date: {
                        $gte: startOfMonth,
                        $lte: endOfMonth
                    }
                }).toArray();

                console.log(`Found ${vehicleExpensesList.length} expenses for vehicle ${vehicleId} in current month`);
                console.log('Expense records:', JSON.stringify(vehicleExpensesList, null, 2));

                const totalExpenses = vehicleExpensesList.reduce((sum, expense) => {
                    const amount = parseFloat(expense.amount) || 0;
                    console.log(`Adding expense amount: ${amount}`);
                    return sum + amount;
                }, 0);

                return {
                    vehicleId: vehicle._id,
                    vehicleName: `${vehicle.make} ${vehicle.model} (${vehicle.licensePlate})`,
                    expenses: totalExpenses,
                    details: vehicleExpensesList
                };
            }));

            // Calculate overall total for current month
            const totalExpenses = vehicleExpenses.reduce((sum, vehicle) => sum + vehicle.expenses, 0);

            console.log('Current month totals:', {
                totalExpenses,
                vehicleExpenses
            });

            res.json({
                vehicles: vehicleExpenses,
                total: totalExpenses,
                period: {
                    start: startOfMonth,
                    end: endOfMonth
                }
            });
        } catch (error) {
            console.error('Error getting current month expenses:', error);
            res.status(500).json({ message: error.message });
        }
    },

    /**
     * Get current month's expenses for a specific vehicle
     */
    async getCurrentMonthVehicleExpenses(req, res) {
        try {
            // Get company ID from authenticated user
            const companyId = req.user.companyId;
            
            if (!companyId) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Company ID not found in user token'
                });
            }
            
            const { vehicleId } = req.params;
            console.log(`Fetching current month expenses for vehicle ${vehicleId} in company ${companyId}`);
            
            // Get vehicle details and make sure it belongs to this company
            const vehicles = await db.getCollection('vehicles');
            const expenses = await db.getCollection('expenses');
            
            // Get current month's start and end dates
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            
            const vehicle = await vehicles.findOne({ 
                _id: new ObjectId(vehicleId),
                companyId: companyId.toString()
            });
            
            if (!vehicle) {
                return res.status(404).json({ message: 'Vehicle not found' });
            }
            
            // Get expenses for this vehicle for current month
            const vehicleExpenses = await expenses.find({
                vehicleId,
                companyId: companyId.toString(),
                date: {
                    $gte: startOfMonth,
                    $lte: endOfMonth
                }
            }).toArray();

            console.log(`Found ${vehicleExpenses.length} expenses for vehicle ${vehicleId} in current month`);
            console.log('Expense records:', JSON.stringify(vehicleExpenses, null, 2));

            const totalExpenses = vehicleExpenses.reduce((sum, expense) => {
                const amount = parseFloat(expense.amount) || 0;
                console.log(`Adding expense amount: ${amount}`);
                return sum + amount;
            }, 0);

            console.log('Current month expenses for vehicle:', {
                vehicleId,
                totalExpenses,
                expenses: vehicleExpenses
            });

            res.json({
                vehicle: {
                    id: vehicle._id,
                    name: `${vehicle.make} ${vehicle.model}`,
                    licensePlate: vehicle.licensePlate
                },
                expenses: totalExpenses,
                details: vehicleExpenses,
                period: {
                    start: startOfMonth,
                    end: endOfMonth
                }
            });
        } catch (error) {
            console.error('Error getting current month vehicle expenses:', error);
            res.status(500).json({ message: error.message });
        }
    },

    /**
     * Get monthly expenses aggregated by month
     */
    async getMonthlyExpenses(req, res) {
        try {
            const companyId = req.user?.companyId;
            
            if (!companyId) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Company ID not found in user token'
                });
            }

            const expenses = await db.getCollection('expenses');
            
            // Aggregate expenses by month for the last 12 months
            const result = await expenses.aggregate([
                {
                    $match: {
                        companyId: companyId.toString()
                    }
                },
                {
                    $group: {
                        _id: {
                            year: { $year: '$date' },
                            month: { $month: '$date' }
                        },
                        totalAmount: { $sum: '$amount' },
                        count: { $sum: 1 }
                    }
                },
                {
                    $sort: { '_id.year': -1, '_id.month': -1 }
                },
                {
                    $limit: 12
                }
            ]).toArray();

            const monthlyExpenses = result.map(item => ({
                month: item._id.month,
                year: item._id.year,
                totalAmount: item.totalAmount,
                count: item.count,
                categories: []
            }));

            const yearlyTotal = result.reduce((sum, item) => sum + item.totalAmount, 0);

            res.status(200).json({
                status: 'success',
                data: {
                    monthlyExpenses,
                    yearlyTotal
                }
            });
        } catch (error) {
            console.error('Error getting monthly expenses:', error);
            res.status(500).json({
                status: 'error',
                message: 'Failed to get monthly expenses',
                error: error.message
            });
        }
    },

    /**
     * Get yearly expenses aggregated by year
     */
    async getYearlyExpenses(req, res) {
        try {
            const companyId = req.user?.companyId;
            
            if (!companyId) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Company ID not found in user token'
                });
            }

            const expenses = await db.getCollection('expenses');
            
            const result = await expenses.aggregate([
                {
                    $match: {
                        companyId: companyId.toString()
                    }
                },
                {
                    $group: {
                        _id: { year: { $year: '$date' } },
                        totalAmount: { $sum: '$amount' },
                        count: { $sum: 1 }
                    }
                },
                {
                    $sort: { '_id.year': -1 }
                }
            ]).toArray();

            const yearlyExpenses = result.map(item => ({
                year: item._id.year,
                totalAmount: item.totalAmount,
                count: item.count,
                categories: []
            }));

            const grandTotal = result.reduce((sum, item) => sum + item.totalAmount, 0);

            res.status(200).json({
                status: 'success',
                data: {
                    yearlyExpenses,
                    grandTotal
                }
            });
        } catch (error) {
            console.error('Error getting yearly expenses:', error);
            res.status(500).json({
                status: 'error',
                message: 'Failed to get yearly expenses',
                error: error.message
            });
        }
    },

    /**
     * Get expenses by category
     */
    async getExpensesByCategory(req, res) {
        try {
            const companyId = req.user?.companyId;
            
            if (!companyId) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Company ID not found in user token'
                });
            }

            const expenses = await db.getCollection('expenses');
            
            const result = await expenses.aggregate([
                {
                    $match: {
                        companyId: companyId.toString()
                    }
                },
                {
                    $group: {
                        _id: '$expenseType',
                        totalAmount: { $sum: '$amount' },
                        count: { $sum: 1 }
                    }
                },
                {
                    $sort: { totalAmount: -1 }
                }
            ]).toArray();

            const total = result.reduce((sum, item) => sum + item.totalAmount, 0);

            const categories = result.map(item => ({
                category: item._id || 'Uncategorized',
                totalAmount: item.totalAmount,
                count: item.count,
                percentage: total > 0 ? (item.totalAmount / total * 100) : 0
            }));

            res.status(200).json({
                status: 'success',
                data: {
                    categories,
                    total
                }
            });
        } catch (error) {
            console.error('Error getting expenses by category:', error);
            res.status(500).json({
                status: 'error',
                message: 'Failed to get expenses by category',
                error: error.message
            });
        }
    }
};

module.exports = costController; 