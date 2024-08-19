const fs = require('fs');
const path = require('path');

function createFile (data, fileName) {
  const dir = './temp';
  const filePath = path.join(dir, fileName);

  if (!fs.existsSync(dir)) 
  {
    fs.mkdirSync(dir);
  }
  if (!fs.existsSync(filePath)) 
  {
    fs.writeFileSync(filePath, JSON.stringify(data));
  } 
  else 
  {
    if(fileName === 'auth-data.json')
    {
      const existingData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      if (existingData.access_token) 
      {
        existingData.access_token = data.access_token;
      } 
      else 
      {
        existingData.access_token = data;
      }
      fs.writeFileSync(filePath, JSON.stringify(existingData));
    }
    else if(fileName === 'beneficiary-data.json')
    {
      const existingData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      if(existingData.beneficiaryData)
      {
        existingData.beneficiaryData = data.beneficiaryData;
      }
      else 
      {
        existingData.beneficiaryData = data;
      }
      fs.writeFileSync(filePath, JSON.stringify(existingData));
    }
    else
      {
        console.log(data, 'data in file');
        const existingData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        if(existingData.groupData)
        {
          existingData.groupData = data.groupData;
        }
        else 
        {
          existingData.groupData = data;
        }
        fs.writeFileSync(filePath, JSON.stringify(existingData));
      }
  }
}

module.exports = createFile;