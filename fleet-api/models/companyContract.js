const mongoose = require('mongoose');

// Define contract status options
const CONTRACT_STATUS = {
    ACTIVE: 'Active',
    EXPIRED: 'Expired',
    PENDING: 'Pending',
    TERMINATED: 'Terminated',
    RENEWED: 'Renewed'
};

// How often the client is billed. Independent of rateUnit: a contract can be
// quoted per day but invoiced monthly.
const BILLING_CYCLE = {
    DAILY: 'daily',
    WEEKLY: 'weekly',
    MONTHLY: 'monthly',
    QUARTERLY: 'quarterly',
    YEARLY: 'yearly',
    // One invoice covering the whole term, raised at the start
    UPFRONT: 'upfront'
};

// Remote e-signature request status
const SIGNATURE_STATUS = {
    NOT_SENT: 'not_sent',
    SENT: 'sent',
    VIEWED: 'viewed',
    SIGNED: 'signed',
    DECLINED: 'declined',
    CANCELLED: 'cancelled'
};

// Signature request / audit trail attached to a contract
const signatureSchema = new mongoose.Schema({
    status: {
        type: String,
        enum: Object.values(SIGNATURE_STATUS),
        default: SIGNATURE_STATUS.NOT_SENT
    },
    token: String,
    tokenExpiresAt: Date,
    // Who it was sent to
    sentAt: Date,
    sentToName: String,
    sentToPhone: String,
    sentBy: String,
    sendCount: {
        type: Number,
        default: 0
    },
    // Where to notify the sender once the client submits
    notifyPhone: String,
    // Client activity
    viewedAt: Date,
    signedAt: Date,
    declinedAt: Date,
    declineReason: String,
    signerName: String,
    // Base64 PNG data URI captured from the signature pad
    signatureImage: String,
    // Exact document the client agreed to, frozen at signing time
    documentSnapshot: String,
    ipAddress: String,
    userAgent: String
}, { _id: false });

const companyContractSchema = new mongoose.Schema({
    companyName: {
        type: String,
        required: true,
        trim: true
    },
    tradeLicenseNo: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    vehicleName: {
        type: String,
        required: false,
        trim: true
    },
    vehicleId: {
        type: String,
        required: false
    },
    contractType: {
        type: String,
        required: false,
        trim: true
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    amount: {
        type: Number,
        required: false,
        min: 0
    },
    // Contracts are not always monthly - short rentals are quoted per day or
    // per week. Existing records have no value and are treated as monthly.
    rateUnit: {
        type: String,
        required: false,
        enum: ['day', 'week', 'month'],
        default: 'month'
    },
    // Billing frequency, separate from the rate period above - a car quoted at
    // a daily rate is often still invoiced once a month. Existing records have
    // no value and bill monthly.
    billingCycle: {
        type: String,
        required: false,
        enum: Object.values(BILLING_CYCLE),
        default: BILLING_CYCLE.MONTHLY
    },
    // Charge a part-period at its exact day count. Off means a part-period is
    // billed as a whole one, which is how most short rentals are quoted.
    prorate: {
        type: Boolean,
        required: false,
        default: true
    },
    autoRenew: {
        type: Boolean,
        required: false,
        default: false
    },
    // Length of each renewal term. Omitted means renew for the same length as
    // the original term.
    renewalTerm: {
        count: {
            type: Number,
            min: 1
        },
        unit: {
            type: String,
            enum: ['day', 'week', 'month']
        }
    },
    // Cursor for the billing run: how far the contract has been invoiced, and
    // when the next invoice falls due. Both are owned by the billing job.
    invoicedThrough: {
        type: Date,
        required: false
    },
    nextInvoiceDate: {
        type: Date,
        required: false
    },
    securityDeposit: {
        type: Number,
        required: false,
        min: 0
    },
    paymentMethod: {
        type: String,
        required: false,
        trim: true,
        default: 'Post-Dated Cheque'
    },
    mileageCap: {
        type: Number,
        required: false,
        min: 0,
        default: 5000
    },
    excessMileageRate: {
        type: Number,
        required: false,
        min: 0,
        default: 1
    },
    value: {
        type: Number,
        required: false,
        min: 0
    },
    contactPerson: {
        type: String,
        required: false,
        trim: true
    },
    contactEmail: {
        type: String,
        required: false,
        trim: true
    },
    contactPhone: {
        type: String,
        required: false,
        trim: true
    },
    // Additional contacts beyond the primary one above - e.g. the driver, a
    // site manager - so maintenance/invoice reminders can be routed to
    // whoever actually needs them instead of always the primary contact.
    contacts: [{
        name: { type: String, trim: true },
        phone: { type: String, trim: true },
        role: { type: String, trim: true }
    }],
    status: {
        type: String,
        required: true,
        enum: Object.values(CONTRACT_STATUS),
        default: CONTRACT_STATUS.PENDING
    },
    documents: [{
        type: {
            type: String,
            default: 'other'
        },
        title: String,
        url: String,
        uploadDate: {
            type: Date,
            default: Date.now
        },
        expiryDate: Date
    }],
    notes: {
        type: String
    },
    signature: {
        type: signatureSchema,
        default: () => ({})
    },
    companyId: {
        type: String,
        required: false
    }
}, {
    timestamps: true
});

// Create indexes for faster queries
companyContractSchema.index({ companyName: 1 });
companyContractSchema.index({ vehicleName: 1 });
companyContractSchema.index({ status: 1 });
companyContractSchema.index({ tradeLicenseNo: 1 });
// Public signing links are looked up by token only
companyContractSchema.index({ 'signature.token': 1 });
// The billing run sweeps for contracts whose next invoice has come due
companyContractSchema.index({ status: 1, nextInvoiceDate: 1 });

// Add a method to check if contract is expired
companyContractSchema.methods.isExpired = function () {
    return new Date() > this.endDate;
};

// Add a method to get remaining days in contract
companyContractSchema.methods.getRemainingDays = function () {
    const today = new Date();
    const endDate = this.endDate;
    const diffTime = endDate - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// Export the contract status enum along with the model
module.exports = {
    CompanyContract: mongoose.model('CompanyContract', companyContractSchema, 'contracts'),
    CONTRACT_STATUS,
    SIGNATURE_STATUS,
    BILLING_CYCLE
};