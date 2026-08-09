const db = require('../config/db');
const { buildWaMeUrl } = require('../utils/whatsappLink');
const { normalisePlate, plateMatches, parseFineAmount } = require('../utils/plateMatch');
const { sortFinesNewestFirst } = require('../utils/fineDate');

const RtaFinesController = {
  /**
   * Get total fines from rta_total collection by traffic file key
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getTotalFines(req, res) {
    try {
      const companyId = req.user.companyId;

      if (!companyId) {
        return res.status(400).json({
          status: 'error',
          message: 'Company ID not found in user token'
        });
      }

      console.log(`Fetching total fines for company ID: ${companyId}`);

      // Get company to retrieve traffic_file_key (tcNumber)
      const Company = require('../models/companyModel');
      const { ObjectId } = require('mongodb');
      const company = await Company.findOne({ _id: new ObjectId(companyId) });

      if (!company || !company.tcNumber) {
        return res.status(200).json({
          status: 'success',
          message: 'TC Number not configured. Please set TC Number in settings.',
          data: {
            type: 'total_fines',
            total_amount: 'Pay all AED 0',
            traffic_file_key: null,
            last_updated: {
              $date: new Date().toISOString()
            }
          }
        });
      }

      const trafficFileKey = company.tcNumber;
      console.log(`Using traffic file key: ${trafficFileKey}`);

      const rtaTotalCollection = await db.getCollection('rta_total');
      const totalFines = await rtaTotalCollection.findOne({
        type: 'total_fines',
        traffic_file_key: trafficFileKey
      });

      if (!totalFines) {
        return res.status(200).json({
          status: 'success',
          data: {
            type: 'total_fines',
            traffic_file_key: trafficFileKey,
            total_amount: 'Pay all AED 0',
            last_updated: {
              $date: new Date().toISOString()
            }
          }
        });
      }

      // Ensure consistent date format
      if (totalFines.last_updated && !(totalFines.last_updated.$date)) {
        totalFines.last_updated = {
          $date: totalFines.last_updated instanceof Date
            ? totalFines.last_updated.toISOString()
            : new Date(totalFines.last_updated).toISOString()
        };
      }

      res.status(200).json({
        status: 'success',
        data: totalFines
      });
    } catch (error) {
      console.error('Error getting total fines:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to retrieve total fines',
        error: error.message
      });
    }
  },

  /**
   * Get all fines from rta_fines collection by traffic file key
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getAllFines(req, res) {
    try {
      const companyId = req.user.companyId;

      if (!companyId) {
        return res.status(400).json({
          status: 'error',
          message: 'Company ID not found in user token'
        });
      }

      console.log(`Fetching all fines for company ID: ${companyId}`);

      // Get company to retrieve traffic_file_key (tcNumber)
      const Company = require('../models/companyModel');
      const { ObjectId } = require('mongodb');
      const company = await Company.findOne({ _id: new ObjectId(companyId) });

      if (!company || !company.tcNumber) {
        return res.status(200).json({
          status: 'success',
          message: 'TC Number not configured. Please set TC Number in settings.',
          data: {
            fines: [],
            count: 0
          }
        });
      }

      const trafficFileKey = company.tcNumber;
      console.log(`Using traffic file key: ${trafficFileKey}`);

      const rtaFinesCollection = await db.getCollection('rta_fines');

      // Query using traffic_file_key
      const query = { traffic_file_key: trafficFileKey };
      console.log('Querying rta_fines with:', JSON.stringify(query));

      // date_time is a display string, so sort it as a real date rather than in Mongo
      const fines = sortFinesNewestFirst(
        await rtaFinesCollection.find(query).toArray()
      );

      console.log(`Found ${fines.length} fines for traffic_file_key: ${trafficFileKey}`);

      res.status(200).json({
        status: 'success',
        data: {
          fines: fines,
          count: fines.length,
          traffic_file_key: trafficFileKey
        }
      });
    } catch (error) {
      console.error('Error getting fines:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to retrieve fines',
        error: error.message
      });
    }
  },

  /**
   * Get all fines, each matched to the vehicle it belongs to and the client
   * renting that vehicle, with a ready-to-send WhatsApp reminder link.
   * GET /api/rta-fines/with-clients
   */
  async getFinesWithClients(req, res) {
    try {
      const companyId = req.user.companyId;

      if (!companyId) {
        return res.status(400).json({
          status: 'error',
          message: 'Company ID not found in user token'
        });
      }

      const Company = require('../models/companyModel');
      const { ObjectId } = require('mongodb');
      const company = await Company.findOne({ _id: new ObjectId(companyId) });

      if (!company || !company.tcNumber) {
        return res.status(200).json({
          status: 'success',
          message: 'TC Number not configured. Please set TC Number in settings.',
          data: { fines: [], count: 0, matchedCount: 0, unmatchedCount: 0 }
        });
      }

      const database = await db.getDb();
      const [rawFines, vehicles, contracts] = await Promise.all([
        database.collection('rta_fines')
          .find({ traffic_file_key: company.tcNumber })
          .toArray(),
        database.collection('vehicles')
          .find({ companyId: companyId.toString() })
          .toArray(),
        database.collection('contracts')
          .find({ companyId: companyId.toString() })
          .toArray(),
      ]);

      // date_time is a display string, so sort it as a real date rather than in Mongo
      const fines = sortFinesNewestFirst(rawFines);

      // Index vehicles by normalised plate for matching
      const vehicleIndex = vehicles.map((v) => ({
        vehicle: v,
        plate: normalisePlate(v.licensePlate || v.plateNumber || v.vehicleNumber),
      })).filter((v) => v.plate);

      // Active contracts win over expired ones when a vehicle has been rented more
      // than once - the current renter is who should get the reminder.
      const rankContract = (c) => (c.status === 'Active' ? 0 : 1);
      const sortedContracts = [...contracts].sort((a, b) => {
        if (rankContract(a) !== rankContract(b)) return rankContract(a) - rankContract(b);
        return new Date(b.startDate || 0) - new Date(a.startDate || 0);
      });

      const findContractForVehicle = (vehicle, finePlate) => sortedContracts.find((c) => {
        if (vehicle && c.vehicleId && c.vehicleId.toString() === vehicle._id.toString()) return true;
        // Contracts often store the vehicle as free text instead of an id
        return plateMatches(finePlate, normalisePlate(c.vehicleName));
      });

      const enriched = fines.map((fine) => {
        // number_plate holds the actual plate as "EE\n79604" (region code + number).
        // vehicle_info is a description ("HONDA ODYSSEY, 2015, Silver"), so it is
        // only a fallback - matching against it risks hitting the year or colour.
        const finePlate = normalisePlate(fine.number_plate);
        const fallbackPlate = finePlate ? null : normalisePlate(fine.vehicle_info);

        // Prefer the longest plate match so "EE79604" beats a shorter partial
        const matchOn = (plate) => (plate
          ? vehicleIndex
            .filter((v) => plateMatches(plate, v.plate))
            .sort((a, b) => b.plate.length - a.plate.length)[0]
          : undefined);

        const vehicleMatch = matchOn(finePlate) || matchOn(fallbackPlate);

        const vehicle = vehicleMatch?.vehicle || null;
        const contract = findContractForVehicle(vehicle, finePlate || fallbackPlate) || null;
        const clientPhone = contract?.contactPhone || null;

        const amount = parseFineAmount(fine.amount);
        // RTA stores the plate across two lines; render it on one
        const displayPlate = (fine.number_plate || '').replace(/\s*\n\s*/g, ' ').trim();
        const vehicleLabel = vehicle
          ? `${vehicle.licensePlate || ''} ${vehicle.make || ''} ${vehicle.model || ''}`.trim()
          : (displayPlate || fine.vehicle_info || 'your vehicle');

        const reminderMessage =
          `Dear ${contract?.contactPerson || contract?.companyName || 'Client'},\n\n` +
          `A traffic fine has been registered against the vehicle you are renting.\n\n` +
          `Vehicle: ${vehicleLabel}\n` +
          `Date: ${fine.date_time || 'N/A'}\n` +
          `Amount: AED ${amount.toLocaleString()}\n` +
          (fine.source ? `Issued by: ${fine.source}\n` : '') +
          (fine.black_points && fine.black_points !== '-' ? `Black points: ${fine.black_points}\n` : '') +
          `\nKindly settle this fine at your earliest convenience.\n\nThank you.`;

        return {
          ...fine,
          amountValue: amount,
          displayPlate,
          matchedVehicle: vehicle && {
            _id: vehicle._id,
            licensePlate: vehicle.licensePlate,
            make: vehicle.make,
            model: vehicle.model,
          },
          client: contract && {
            contractId: contract._id,
            companyName: contract.companyName,
            contactPerson: contract.contactPerson,
            contactPhone: contract.contactPhone,
            contractStatus: contract.status,
          },
          reminderMessage,
          whatsappUrl: clientPhone ? buildWaMeUrl(clientPhone, reminderMessage) : null,
          reminder: fine.reminder || null,
        };
      });

      const matchedCount = enriched.filter((f) => f.client?.contactPhone).length;

      res.status(200).json({
        status: 'success',
        data: {
          fines: enriched,
          count: enriched.length,
          matchedCount,
          unmatchedCount: enriched.length - matchedCount,
          traffic_file_key: company.tcNumber,
        }
      });
    } catch (error) {
      console.error('Error getting fines with clients:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to retrieve fines with client details',
        error: error.message
      });
    }
  },

  /**
   * Record that a reminder was sent for a fine, so the UI can show what has
   * already been chased. POST /api/rta-fines/:id/reminder-sent
   */
  async markReminderSent(req, res) {
    try {
      const companyId = req.user.companyId;
      const { id } = req.params;

      if (!companyId) {
        return res.status(400).json({
          status: 'error',
          message: 'Company ID not found in user token'
        });
      }

      const { ObjectId } = require('mongodb');
      const rtaFinesCollection = await db.getCollection('rta_fines');

      const result = await rtaFinesCollection.findOneAndUpdate(
        { _id: new ObjectId(id) },
        {
          $set: {
            'reminder.lastSentAt': new Date(),
            'reminder.lastSentTo': req.body.phone || null,
            'reminder.lastSentBy': req.user.email || req.user.userId || null,
          },
          $inc: { 'reminder.count': 1 }
        },
        { returnDocument: 'after' }
      );

      const updated = result?.value || result;
      if (!updated) {
        return res.status(404).json({ status: 'error', message: 'Fine not found' });
      }

      res.status(200).json({
        status: 'success',
        message: 'Reminder recorded',
        data: updated.reminder
      });
    } catch (error) {
      console.error('Error recording fine reminder:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to record reminder',
        error: error.message
      });
    }
  },

  /**
   * Get fines by vehicle
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getFinesByVehicle(req, res) {
    try {
      const companyId = req.user.companyId;
      const { vehicleInfo } = req.params;

      if (!companyId) {
        return res.status(400).json({
          status: 'error',
          message: 'Company ID not found in user token'
        });
      }

      console.log(`Fetching fines for vehicle: ${vehicleInfo}`);

      const rtaFinesCollection = await db.getCollection('rta_fines');
      const fines = await rtaFinesCollection
        .find({ vehicle_info: vehicleInfo })
        .sort({ created_at: -1 })
        .toArray();

      res.status(200).json({
        status: 'success',
        data: {
          fines: fines,
          count: fines.length
        }
      });
    } catch (error) {
      console.error('Error getting fines by vehicle:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to retrieve fines by vehicle',
        error: error.message
      });
    }
  },

  /**
   * Delete a fine from rta_fines collection
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async deleteFine(req, res) {
    try {
      const companyId = req.user.companyId;
      const { id } = req.params;

      if (!companyId) {
        return res.status(400).json({
          status: 'error',
          message: 'Company ID not found in user token'
        });
      }

      console.log(`Deleting fine with ID: ${id}`);

      const rtaFinesCollection = await db.getCollection('rta_fines');
      const { ObjectId } = require('mongodb');

      const result = await rtaFinesCollection.deleteOne({
        _id: new ObjectId(id)
      });

      if (result.deletedCount === 0) {
        return res.status(404).json({
          status: 'error',
          message: 'Fine not found'
        });
      }

      res.status(200).json({
        status: 'success',
        message: 'Fine deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting fine:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to delete fine',
        error: error.message
      });
    }
  }
};

module.exports = RtaFinesController;
