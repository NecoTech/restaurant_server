
// models/MenuItem.js
import mongoose from 'mongoose';

const MenuItemSchema = new mongoose.Schema({
  id: { type: String, ref: 'Restaurant', required: true },
  name: { type: String, required: true },
  description: String,
  price: { type: Number, required: true },
  isAvailable: { type: Boolean, default: true },
  category: { type: String, required: true },
  image: String
});

export default mongoose.models.MenuItem || mongoose.model('MenuItem', MenuItemSchema);