const mongoose = require('mongoose');

const letterheadSchema = new mongoose.Schema({
    companyId: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    isDefault: {
        type: Boolean,
        default: false
    },
    header: {
        logo: {
            type: String, // Base64 encoded image or URL
            default: ''
        },
        companyName: {
            type: String,
            required: true,
            trim: true
        },
        tagline: {
            type: String,
            trim: true
        },
        address: {
            street: String,
            city: String,
            state: String,
            zipCode: String,
            country: String
        },
        contact: {
            phone: String,
            email: String,
            website: String
        }
    },
    footer: {
        text: String,
        includePageNumbers: {
            type: Boolean,
            default: true
        },
        includeDate: {
            type: Boolean,
            default: true
        }
    },
    styling: {
        primaryColor: {
            type: String,
            default: '#1976d2'
        },
        secondaryColor: {
            type: String,
            default: '#424242'
        },
        fontFamily: {
            type: String,
            default: 'Arial, sans-serif'
        },
        fontSize: {
            type: Number,
            default: 12
        },
        logoSize: {
            width: {
                type: Number,
                default: 150
            },
            height: {
                type: Number,
                default: 60
            }
        }
    },
    margins: {
        top: {
            type: Number,
            default: 1
        },
        bottom: {
            type: Number,
            default: 1
        },
        left: {
            type: Number,
            default: 1
        },
        right: {
            type: Number,
            default: 1
        }
    },
    isActive: {
        type: Boolean,
        default: true
    },
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
letterheadSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

// Ensure only one default letterhead per company
letterheadSchema.pre('save', async function(next) {
    if (this.isDefault && this.isModified('isDefault')) {
        // Set all other letterheads for this company to not default
        await this.constructor.updateMany(
            { 
                companyId: this.companyId, 
                _id: { $ne: this._id } 
            },
            { isDefault: false }
        );
    }
    next();
});

// Static method to get collection
letterheadSchema.statics.getCollection = function() {
    return mongoose.connection.db.collection('letterheads');
};

const Letterhead = mongoose.model('Letterhead', letterheadSchema);

module.exports = Letterhead;
