const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/WorkerHub', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    const db = mongoose.connection.db;
    
    // Rename hourly_rate to daily_rate
    await db.collection('workers').updateMany(
      { hourly_rate: { $exists: true } },
      { $rename: { 'hourly_rate': 'daily_rate' } }
    );
    
    // Set daily_rate to 500 if it's 0 or null
    const result = await db.collection('workers').updateMany(
      { $or: [{ daily_rate: 0 }, { daily_rate: null }, { daily_rate: { $exists: false } }] }, 
      { $set: { daily_rate: 500 } }
    );
    console.log('Modified:', result.modifiedCount);
    mongoose.disconnect();
  });
