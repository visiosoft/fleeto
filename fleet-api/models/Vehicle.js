const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
    make: {
        type: String,
        required: true,
        trim: true
    },
    model: {
        type: String,
        required: true,
        trim: true
    },
    year: {
        type: Number,
        required: true
    },
    licensePlate: {
        type: String,
        required: true,
        trim: true
    },
    vin: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    type: {
        type: String,
        required: false,
        enum: ['car', 'truck', 'van', 'motorcycle', 'other']
    },
    status: {
        type: String,
        required: false,
        default: 'active'
    },
    mileage: {
        type: Number,
        required: false,
        default: 0
    },
    lastService: {
        type: Date,
        required: false
    },
    lastMaintenance: {
        type: Date,
        required: false
    },
    nextServiceDue: {
        type: Date,
        required: false
    },
    nextMaintenance: {
        type: Date,
        required: false
    },
    fuelType: {
        type: String,
        required: false
    },
    fuelCapacity: {
        type: Number,
        required: false
    },
    insuranceProvider: {
        type: String,
        required: false
    },
    insurancePolicyNumber: {
        type: String,
        required: false
    },
    insuranceExpiryDate: {
        type: Date,
        required: false
    },
    insuranceInfo: {
        provider: String,
        policyNumber: String,
        expiryDate: Date
    },
    notes: {
        type: String,
        required: false
    },
    companyId: {
        type: String,
        required: false
    },
    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: false
    },
    maintenance: [{
        date: {
            type: Date,
            required: true
        },
        type: {
            type: String,
            required: true
        },
        description: {
            type: String,
            required: true
        },
        cost: {
            type: Number,
            required: true
        },
        performedBy: {
            type: String,
            required: true
        },
        notes: String
    }],
    documents: [{
        type: {
            type: String,
            required: true
        },
        title: {
            type: String,
            required: true
        },
        url: {
            type: String,
            required: true
        },
        uploadDate: {
            type: Date,
            default: Date.now
        },
        expiryDate: Date
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update the updatedAt timestamp before saving
vehicleSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

const Vehicle = mongoose.model('Vehicle', vehicleSchema);

module.exports = Vehicle; 