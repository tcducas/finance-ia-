const fs = require('fs');
const path = require('path');

const files = [
  'src/pages/admin/AdminDashboard.tsx',
  'src/pages/client/HomePage.tsx',
  'src/components/ThemeToggle.tsx',
  'src/components/AuraCentral.tsx'
];

files.forEach(file => {
  const filePath = path.join(__dirname, file);
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(/bg-\[#0D1527\]/g, 'bg-[#0a0a0a]');
  content = content.replace(/bg-\[#FCFAFA\]/g, 'bg-white');
  content = content.replace(/bg-\[#F2ECDD\]/g, 'bg-slate-50');
  fs.writeFileSync(filePath, content, 'utf8');
});
console.log('Replaced colors successfully.');
