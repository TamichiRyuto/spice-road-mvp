const fs = require('fs');

// Read the existing shops data
const shops = JSON.parse(fs.readFileSync('shops.json', 'utf8'));

// Function to extract region from address
function extractRegion(address) {
  if (address.includes('奈良市')) return '奈良市';
  if (address.includes('生駒市')) return '生駒市';
  if (address.includes('橿原市')) return '橿原市';
  if (address.includes('大和郡山市')) return '大和郡山市';
  if (address.includes('天理市')) return '天理市';
  if (address.includes('桜井市')) return '桜井市';
  if (address.includes('大和高田市')) return '大和高田市';
  if (address.includes('五條市')) return '五條市';
  if (address.includes('生駒郡')) return '生駒郡';
  if (address.includes('北葛城郡')) return '北葛城郡';
  if (address.includes('磯城郡')) return '磯城郡';
  
  // Default fallback
  return 'その他';
}

// Add region to each shop
const updatedShops = shops.map(shop => {
  if (!shop.region) {
    shop.region = extractRegion(shop.address);
  }
  return shop;
});

// Write the updated data back to the file
fs.writeFileSync('shops.json', JSON.stringify(updatedShops, null, 2));
console.log('Region data added successfully!');