
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
  id: { type: String, ref: 'Restaurant', required: [true, 'Please provide restaurant ID'], trim: true },
  category: { type: String, required: [true, 'Please provide item category'], trim: true },
  items: [{
    name: { type: String, required: true, trim: true },
    description: String,
    price: { type: Number, required: true },
    margin: { type: Number },
    isAvailable: { type: Boolean, default: true },
    image: String,
    volume: String
  }]
}, {
  timestamps: true
});


export default mongoose.models.MenuItem || mongoose.model('MenuItem', MenuItemSchema);