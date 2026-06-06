(async ()=>{
  try {
    // Load .env manually so this script can be run without installing dotenv
    const fs = require('fs');
    const path = require('path');
    const envPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
      for (const line of lines) {
        if (!line || line.startsWith('#')) continue;
        const idx = line.indexOf('=');
        if (idx === -1) continue;
        const key = line.slice(0, idx).trim();
        let val = line.slice(idx + 1).trim();
        // remove surrounding quotes
        if (val.startsWith("\"") && val.endsWith("\"")) val = val.slice(1, -1);
        if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
        process.env[key] = process.env[key] || val;
      }
    }

    const mongoose = require('mongoose');
    const MONGODB_URI = process.env.MONGODB_URI;
    if (!MONGODB_URI) throw new Error('MONGODB_URI not set in environment');
    await mongoose.connect(MONGODB_URI, { bufferCommands: false });
    const col = mongoose.connection.db.collection('orders');
    const orders = await col.find({}).sort({ createdAt: -1 }).limit(10).toArray();
    console.log('Latest orders:');
    orders.forEach(o => {
      console.log('---');
      console.log('_id:', o._id);
      console.log('orderId:', o.orderId);
      console.log('user:', o.user);
      console.log('customer:', o.customer);
      console.log('status:', o.status);
      console.log('paymentInfo:', o.paymentInfo);
      console.log('paidAt:', o.paidAt);
      console.log('inventoryAdjusted:', o.inventoryAdjusted);
      console.log('createdAt:', o.createdAt);
    });
  } catch (e) {
    console.error('ERR', e);
    process.exit(1);
  }
})();