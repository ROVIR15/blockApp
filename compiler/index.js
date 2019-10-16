const path = require('path');
const fs = require('fs-extra');
const solc = require('solc')

function compilingpreparation(){
    const buildPath = path.resolve(__dirname, '/artifacts')
    fs.removeSync(buildPath)
    return buildPath
}

function createConfiguration(){
    return {
        language: 'Solidity',
        sources: {
            'VotingCreator.sol': {
                content: fs.readFileSync(path.resolve(__dirname, '/contracts', 'VotingCreator.sol'), 'utf8')
            },
            'Election.sol': {
                content: fs.readFileSync(path.resolve(__dirname, '/contracts', 'Election.sol'), 'utf8')
            },
            'Ballot.sol': {
                content: fs.readFileSync(path.resolve(__dirname, '/contracts', 'Ballot.sol'), 'utf8')
            }
        },
        /* Build same json structure if you have another contracts to build */
        settings: {
            outputSelection: {
                '*': {
                    '*': ['*']
                }
            }
        }
    }
}

function getImports(dependency){
    switch(dependency){
        case 'Ballot.sol':
            return { constents: fs.readFileSync(path.resolve(__dirname, './contracts', 'Ballot.sol'), 'utf8')}
        case 'Election.sol':
            return { constents: fs.readFileSync(path.resolve(__dirname, './contracts', 'Election.sol'), 'utf8')}
        default: 
            return {error: 'File not found'}
    }
}

function compileSources(config){
    try {
        return JSON.parse(solc.compile(JSON.stringify(config), getImports));
    }
    catch (e) {
        return {error: e}
    }
}

function errorHandling(compiledSources){
    if(!compiledSources){
        console.log('>>>>>>>>>>>>>>>>>> ERROR <<<<<<<<<<<<<<<<<<<1')
    }
    else if (!compiledSources.errors){
        console.log('>>>>>>>>>>>>>>>>>> ERROR <<<<<<<<<<<<<<<<<<<')
    }
}

function writeOutput(compiled, buildPath){
    fs.ensureDirSync(buildPath); 

    for(let contractFileName in compiled.contracts){
        const contractName = contractFileName.replace('.sol', ''); 
        const contractNameJSON = contractName + '.json';
        console.log(contractNameJSON)
        console.log('Writing: ', contractFileName.replace('.sol', ''))
        fs.outputJsonSync(
            path.resolve(buildPath, contractNameJSON), 
            compiled.contracts[contractFileName][contractName]
        )
    }

}

const buildPath = compilingpreparation();
const config = createConfiguration();
const compiled = compileSources(config);
errorHandling(compiled);
writeOutput(compiled, buildPath);
