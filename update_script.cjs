const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'features', 'portfolio', 'RecommendedPortfolio.tsx');
let fileContent = fs.readFileSync(filePath, 'utf8');

fileContent = fileContent
  .replace(/estratégia BESST/g, 'Estratégia dos Baldes')
  .replace(/do BESST/g, 'da Estratégia dos Baldes')
  .replace(/Pilar \(Energia\) BESST/g, 'Pilar (Energia) dos Baldes')
  .replace(/Ações BESST/g, 'Ações (Baldes)')
  .replace(/\(BESST\)/g, '(Baldes)');

fs.writeFileSync(filePath, fileContent, 'utf8');
console.log('Updated RecommendedPortfolio.tsx');
