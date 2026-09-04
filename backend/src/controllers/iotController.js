// Compatibility shim: IoT controller migrated to Sequelize but original legacy
// Mongoose-based implementation was archived. This shim returns HTTP 501
// for the IoT endpoints to avoid runtime errors while migration is in progress.
const notImpl = (name) => async (req, res) => res.status(501).json({ error: `${name} not implemented yet (legacy archived)` });

module.exports = {
  recordAttendance: notImpl('recordAttendance'),
  matchFingerprint: notImpl('matchFingerprint')
};
