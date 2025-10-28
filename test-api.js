// Test script to check backend API
console.log('Testing backend API endpoints...');
console.log('Run this in browser console:');
console.log('');
console.log('// Get access token');
console.log('const token = localStorage.getItem("accessToken");');
console.log('console.log("Token:", token?.substring(0, 20) + "...");');
console.log('');
console.log('// Test /api/orders');
console.log('fetch("http://localhost:8080/api/orders", {');
console.log('  headers: { Authorization: `Bearer ${token}` }');
console.log('}).then(r => r.json()).then(console.log).catch(console.error);');
console.log('');
console.log('// Test /api/dealer/1/orders');
console.log('fetch("http://localhost:8080/api/dealer/1/orders", {');
console.log('  headers: { Authorization: `Bearer ${token}` }');
console.log('}).then(r => r.json()).then(console.log).catch(console.error);');
