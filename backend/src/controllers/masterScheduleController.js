const { User, MasterScheduleEntry } = require('../models');

const trimIfString = (v) => (typeof v === 'string' ? v.trim() : '');

async function comCoursesFromMasterBlock(block) {
  const b = trimIfString(block);
  if (!b) return [];
  const entries = await MasterScheduleEntry.findAll({
    where: { block: b },
    order: [['order', 'ASC'], ['courseName', 'ASC']]
  });
  return entries.map((e) => ({
    courseName: e.courseName || '',
    schedule: e.schedule || '',
    room: e.room || '',
  }));
}

module.exports = { comCoursesFromMasterBlock };
