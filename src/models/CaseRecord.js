import mongoose from 'mongoose'

const followUpDateSchema = new mongoose.Schema({
  date: { type: String, default: '' },
  reason: { type: String, default: '', trim: true, maxlength: 1000 },
}, { _id: false })

const caseRecordSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, trim: true, maxlength: 100 },
  firNo: { type: String, required: true, trim: true, maxlength: 100 },
  firDate: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
  policeStation: { type: String, required: true, trim: true, maxlength: 200 },
  state: { type: String, default: '', trim: true, maxlength: 100 },
  district: { type: String, default: '', trim: true, maxlength: 100 },
  vehicleNo: { type: String, required: true, trim: true, maxlength: 50 },
  vehicleOwnerName: { type: String, default: '', trim: true, maxlength: 200 },
  driverName: { type: String, default: '', trim: true, maxlength: 200 },
  driverPhone: { type: String, default: '', trim: true, maxlength: 50 },
  otherPersons: { type: String, default: '', trim: true, maxlength: 2000 },
  cowCount: { type: Number, required: true, min: 1, validate: Number.isInteger },
  fieldDate: { type: String, default: '', match: [/^$|^\d{4}-\d{2}-\d{2}$/, 'Invalid field date'] },
  courtName: { type: String, default: '', trim: true, maxlength: 200 },
  followUpDates: {
    type: [followUpDateSchema],
    default: [],
    validate: { validator: (value) => value.length <= 10, message: 'A maximum of 10 follow-up dates is allowed.' },
  },
  fieldNote: { type: String, default: '', trim: true, maxlength: 5000 },
  goshalaName: { type: String, required: true, trim: true, maxlength: 200 },
  goshalaPhone: { type: String, required: true, trim: true, maxlength: 50 },
  goshalaAddress: { type: String, required: true, trim: true, maxlength: 1000 },
  advocateName: { type: String, required: true, trim: true, maxlength: 200 },
  advocatePhone: { type: String, default: '', trim: true, maxlength: 50 },
  caseWorker: { type: String, default: '', trim: true, maxlength: 200 },
  finalOrderDate: { type: String, default: '', match: [/^$|^\d{4}-\d{2}-\d{2}$/, 'Invalid final order date'] },
  finalOrderAmount: { type: Number, default: 0, min: 0 },
  finalOrderNote: { type: String, default: '', trim: true, maxlength: 5000 },
  orderNo: { type: String, default: '', trim: true, maxlength: 200 },
  important: { type: Boolean, default: false },
}, { timestamps: true, versionKey: false })

export default mongoose.model('CaseRecord', caseRecordSchema)
