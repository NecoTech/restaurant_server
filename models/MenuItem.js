
// models/MenuItem.js
import mongoose from 'mongoose';

// const MenuItemSchema = new mongoose.Schema({
//   id: { type: String, ref: 'Restaurant', required: true },
//   name: { type: String, required: true },
//   description: String,
//   price: { type: Number, required: true },
//   isAvailable: { type: Boolean, default: true },
//   category: { type: String, required: true },
//   image: String
// });


const MenuItemSchema = new mongoose.Schema({
  id: {
    type: String,
    ref: 'Restaurant',
    required: [true, 'Please provide restaurant ID'],
    trim: true
  },
  name: {
    type: String,
    required: [true, 'Please provide item name'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Please provide item description'],
    trim: true
  },
  price: {
    type: Number,
    required: [true, 'Please provide item price'],
    min: 0
  },
  isAvailable: { type: Boolean, default: true },
  category: {
    type: String,
    required: [true, 'Please provide item category'],
    trim: true
  },
  image: {
    data: Buffer,
    contentType: String
  }
}, {
  timestamps: true
});


export default mongoose.models.MenuItem || mongoose.model('MenuItem', MenuItemSchema);