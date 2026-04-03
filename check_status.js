const mongoose = require('mongoose');
require('dotenv').config();

const RequestSchema = new mongoose.Schema({ status: String, requester_id: mongoose.Schema.Types.ObjectId, skill_id: mongoose.Schema.Types.ObjectId });
const Request = mongoose.model('Request', RequestSchema);

async function check() {
  await mongoose.connect('mongodb://localhost:27017/skillbridge');
  const requests = await Request.find({});
  console.log('--- ALL REQUESTS ---');
  requests.forEach(r => {
    console.log(`ID: ${r._id}, Status: ${r.status}, Requester: ${r.requester_id}`);
  });
  process.exit();
}
check();
