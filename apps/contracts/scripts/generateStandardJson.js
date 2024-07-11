const fs = require('fs');

//Read build files
const readAllDbgFiles = () => {
    const dbgFiles = fs.readdirSync(`${__dirname}/../build/artifacts/src/contracts`);
    const buildFilePaths = [];
    dbgFiles.forEach((file) => {
        const files = fs.readdirSync(`${__dirname}/../build/artifacts/src/contracts/${file}`);
        files.forEach((f) => {
            if (f.includes('.dbg.json')) {
                //read the content of the file
                //remove .dbg.json from file name string
                const fileName = f.replace('.dbg.json', '');
                const content = JSON.parse(fs.readFileSync(`${__dirname}/../build/artifacts/src/contracts/${file}/${f}`, 'utf8'));
                //only get the last id from this string format '../../../build-info/8b726545c8bf4ae06e6409c02d82af7e.json
                buildFilePaths.push({ contract: fileName, buildInfoId: content.buildInfo.split('/').at(-1).replace('.json', '') });
            }
        });
    });
    return buildFilePaths;
};

//generate standard json files from build-info files
const main = async () => {
    const buildFilePaths = readAllDbgFiles();
    buildFilePaths.forEach((file) => {
        //create dir if no such dir exists
        if (!fs.existsSync(`${__dirname}/standard-json`)) {
            fs.mkdirSync(`${__dirname}/standard-json`);
        }
        const content = JSON.parse(fs.readFileSync(`${__dirname}/../build/artifacts/build-info/${file.buildInfoId}.json`, 'utf8'));
        fs.writeFileSync(`${__dirname}/standard-json/${file.contract}.json`, JSON.stringify(content.input, null, 2));
        console.log(`Standard json file generated for ${file.contract}`);
    });
};


main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });