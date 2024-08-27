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
      let existingData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      if(data.beneficiaryData)
      {
        if(existingData.beneficiaryData)
        {
          existingData.beneficiaryData = data.beneficiaryData;
        }
        else 
        {
          existingData = data;
        }
      }
      else 
      {
        if (data.benefUUIDs && data.benefUUIDs.length > 0) 
        {
          if (existingData.benefUUIDs) 
          {
            existingData.benefUUIDs = [...existingData.benefUUIDs, ...data.benefUUIDs];
          }
          else 
          {
            existingData.benefUUIDs = data.benefUUIDs;
          }
        }
      }
      fs.writeFileSync(filePath, JSON.stringify(existingData));
    }
    else if(fileName === 'group-data.json')
    {
      let existingData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      if(existingData.groupData)
      {
        existingData.groupData = data.groupData;
      }
      else 
      {
        existingData = data;
      }
      fs.writeFileSync(filePath, JSON.stringify(existingData));
    }
    else
    {
      let existingData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      if(existingData.projectData)
      {
        existingData.projectData = data.projectData;
      }
      else 
      {
        existingData = data;
      }
      fs.writeFileSync(filePath, JSON.stringify(existingData));
    }
  }
}

module.exports = createFile;