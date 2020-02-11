const mongoose = require('mongoose')

const Schema = mongoose.Schema
const ObjectId = Schema.Types.ObjectId
const Mixed = Schema.Types.Mixed

const PaymentSchema = new Schema({
  user: {type: ObjectId, ref: 'User'},
  product: {type: ObjectId, ref: 'Product'},
  success: Number,
  payType: String,
  totalFee: Number,
  name: String,
  phoneNumber: String,
  address: String,
  description: String,
  transactions: Mixed,
  meta: {
    createdAt: {
      type: Date,
      default: Date.now()
    },
    updatedAt: {
      type: Date,
      default: Date.now()
    }
  }
})

PaymentSchema.pre('save', function (next) {
  if (this.isNew) {
    this.meta.createdAt = this.meta.updatedAt = Date.now()
  } else {
    this.meta.updatedAt = Date.now()
  }

  next()
})

mongoose.model('Payment', PaymentSchema)
