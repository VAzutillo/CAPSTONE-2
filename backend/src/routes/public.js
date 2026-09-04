const express = require('express');
const { MasterScheduleEntry } = require('../models');

const router = express.Router();

/** Read-only: lets students see if their block has a published master schedule before registering. */
router.get('/block-master-schedule', async (req, res) => {
  try {
    const block = typeof req.query.block === 'string' ? req.query.block.trim() : '';
    if (!block) {
      return res.status(400).json({ error: 'block query parameter is required' });
    }
    const entries = await MasterScheduleEntry.findAll({
      where: { block },
      order: [['order', 'ASC'], ['courseName', 'ASC']],
      attributes: ['courseName', 'schedule', 'room']
    });
    return res.json({
      block,
      courses: entries.map((e) => ({
        courseName: e.courseName || '',
        schedule: e.schedule || '',
        room: e.room || '',
      })),
    });
  } catch (err) {
    console.error('public block-master-schedule error:', err);
    return res.status(500).json({ error: 'Failed to load schedule' });
  }
});

module.exports = router;

