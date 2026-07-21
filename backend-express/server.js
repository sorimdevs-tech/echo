import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

const MONGO_URI = 'mongodb://localhost:27017/echoscan';

let isConnected = false;

async function connectDb() {
  if (isConnected) return;
  await mongoose.connect(MONGO_URI);
  isConnected = true;
  console.log('Connected to MongoDB:', MONGO_URI);
}

const patientSchema = new mongoose.Schema({}, { strict: false });
const scanSchema = new mongoose.Schema({}, { strict: false });
const Patient = mongoose.model('Patient', patientSchema, 'patients');
const Scan = mongoose.model('Scan', scanSchema, 'scans');

app.get('/api/dashboard/stats', async (req, res) => {
  await connectDb();
  const [patientCount, scanCount, adultEchoCount, fetalEchoCount, pediatricEchoCount] = await Promise.all([
    Patient.countDocuments({}).catch(() => 0),
    Scan.countDocuments({}).catch(() => 0),
    Scan.countDocuments({ scan_type: 'Adult Echo' }).catch(() => 0),
    Scan.countDocuments({ scan_type: 'Fetal Echo' }).catch(() => 0),
    Scan.countDocuments({ scan_type: 'Pediatric Echo' }).catch(() => 0),
  ]);
  res.json({ success: true, data: { total_patients: patientCount, total_scans: scanCount, adult_echo: adultEchoCount, fetal_echo: fetalEchoCount, pediatric_echo: pediatricEchoCount } });
});

app.get('/api/patients', async (req, res) => {
  await connectDb();
  const patients = await Patient.find().sort({ created_at: -1 }).limit(1000);
  res.json({ success: true, data: patients.map(p => ({ ...p.toObject(), id: String(p._id) })) });
});

app.post('/api/patients', async (req, res) => {
  await connectDb();
  const payload = { ...req.body, created_at: new Date(), updated_at: new Date() };
  const created = await Patient.create(payload);
  const data = { ...created.toObject(), id: String(created._id) };
  res.status(201).json({ success: true, data });
});

app.get('/api/patients/:id', async (req, res) => {
  await connectDb();
  const doc = await Patient.findById(req.params.id);
  if (!doc) return res.status(404).json({ success: false, detail: 'Patient not found' });
  res.json({ success: true, data: { ...doc.toObject(), id: String(doc._id) } });
});

app.put('/api/patients/:id', async (req, res) => {
  await connectDb();
  const updated = await Patient.findByIdAndUpdate(req.params.id, { ...req.body, updated_at: new Date() }, { new: true });
  if (!updated) return res.status(404).json({ success: false, detail: 'Patient not found' });
  res.json({ success: true, data: { ...updated.toObject(), id: String(updated._id) } });
});

app.delete('/api/patients/:id', async (req, res) => {
  await connectDb();
  const result = await Patient.findByIdAndDelete(req.params.id);
  if (!result) return res.status(404).json({ success: false, detail: 'Patient not found' });
  res.json({ success: true, message: 'Patient deleted successfully' });
});

app.post('/api/patients/:id/visits', async (req, res) => {
  await connectDb();
  const payload = { ...req.body, patient_id: req.params.id, created_at: new Date() };
  const created = await mongoose.connection.db.collection('visits').insertOne(payload);
  const saved = await mongoose.connection.db.collection('visits').findOne({ _id: created.insertedId });
  res.status(201).json({ success: true, data: { ...saved, id: String(saved._id) } });
});

app.get('/api/patients/:id/visits', async (req, res) => {
  await connectDb();
  const visits = await mongoose.connection.db.collection('visits').find({ patient_id: req.params.id }).sort({ created_at: -1 }).limit(100).toArray();
  res.json({ success: true, data: visits.map(v => ({ ...v, id: String(v._id) })) });
});

app.get('/api/referral-doctors', async (req, res) => {
  await connectDb();
  const doctors = await mongoose.connection.db.collection('referral_doctors').find().sort({ created_at: -1 }).limit(1000).toArray();
  res.json({ success: true, data: doctors.map(d => ({ ...d, id: String(d._id) })) });
});

app.post('/api/referral-doctors', async (req, res) => {
  await connectDb();
  const payload = { ...req.body, created_at: new Date(), updated_at: new Date() };
  const created = await mongoose.connection.db.collection('referral_doctors').insertOne(payload);
  const saved = await mongoose.connection.db.collection('referral_doctors').findOne({ _id: created.insertedId });
  res.status(201).json({ success: true, data: { ...saved, id: String(saved._id) } });
});

app.get('/api/referral-doctors/:id', async (req, res) => {
  await connectDb();
  const doc = await mongoose.connection.db.collection('referral_doctors').findOne({ _id: new mongoose.Types.ObjectId(req.params.id) });
  if (!doc) return res.status(404).json({ success: false, detail: 'Referral doctor not found' });
  res.json({ success: true, data: { ...doc, id: String(doc._id) } });
});

app.put('/api/referral-doctors/:id', async (req, res) => {
  await connectDb();
  const updated = await mongoose.connection.db.collection('referral_doctors').findOneAndUpdate({ _id: new mongoose.Types.ObjectId(req.params.id) }, { $set: { ...req.body, updated_at: new Date() } }, { returnDocument: 'after' });
  if (!updated) return res.status(404).json({ success: false, detail: 'Referral doctor not found' });
  res.json({ success: true, data: { ...updated, id: String(updated._id) } });
});

app.delete('/api/referral-doctors/:id', async (req, res) => {
  await connectDb();
  const result = await mongoose.connection.db.collection('referral_doctors').deleteOne({ _id: new mongoose.Types.ObjectId(req.params.id) });
  if (result.deletedCount === 0) return res.status(404).json({ success: false, detail: 'Referral doctor not found' });
  res.json({ success: true, message: 'Referral doctor deleted successfully' });
});

app.get('/api/scans', async (req, res) => {
  await connectDb();
  const scans = await Scan.find().sort({ created_at: -1 }).limit(1000);
  res.json({ success: true, data: scans.map(s => ({ ...s.toObject(), id: String(s._id) })) });
});

app.post('/api/scans', async (req, res) => {
  await connectDb();
  const payload = { ...req.body, created_at: new Date(), updated_at: new Date(), status: req.body.status || 'draft' };
  const created = await Scan.create(payload);
  const data = { ...created.toObject(), id: String(created._id) };
  res.status(201).json({ success: true, data });
});

app.get('/api/scans/:id', async (req, res) => {
  await connectDb();
  const doc = await Scan.findById(req.params.id);
  if (!doc) return res.status(404).json({ success: false, detail: 'Scan not found' });
  res.json({ success: true, data: { ...doc.toObject(), id: String(doc._id) } });
});

app.put('/api/scans/:id', async (req, res) => {
  await connectDb();
  const updated = await Scan.findByIdAndUpdate(req.params.id, { ...req.body, updated_at: new Date() }, { new: true });
  if (!updated) return res.status(404).json({ success: false, detail: 'Scan not found' });
  res.json({ success: true, data: { ...updated.toObject(), id: String(updated._id) } });
});

app.delete('/api/scans/:id', async (req, res) => {
  await connectDb();
  const result = await Scan.findByIdAndDelete(req.params.id);
  if (!result) return res.status(404).json({ success: false, detail: 'Scan not found' });
  res.json({ success: true, message: 'Scan deleted successfully' });
});

app.get('/api/scans/patient/:patient_id', async (req, res) => {
  await connectDb();
  const scans = await Scan.find({ patient_id: req.params.patient_id }).sort({ created_at: -1 }).limit(1000);
  res.json({ success: true, data: scans.map(s => ({ ...s.toObject(), id: String(s._id) })) });
});

app.get('/api/report-templates', async (req, res) => {
  await connectDb();
  const templates = await mongoose.connection.db.collection('report_templates').find().toArray();
  res.json({ success: true, data: templates.map(t => ({ ...t, id: String(t._id) })) });
});

app.post('/api/report-templates', async (req, res) => {
  await connectDb();
  const payload = { ...req.body, created_at: new Date() };
  const created = await mongoose.connection.db.collection('report_templates').insertOne(payload);
  const saved = await mongoose.connection.db.collection('report_templates').findOne({ _id: created.insertedId });
  res.status(201).json({ success: true, data: { ...saved, id: String(saved._id) } });
});

const PORT = 8000;
app.listen(PORT, () => {
  console.log(`Express API listening on http://0.0.0.0:${PORT}`);
});