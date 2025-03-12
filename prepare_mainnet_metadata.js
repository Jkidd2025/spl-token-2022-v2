const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function main() {
    try {
        console.log('\n🔍 Starting mainnet metadata preparation...\n');

        // Load current metadata
        const metadataPath = './assets/metadata.json';
        const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));

        // Display current metadata
        console.log('Current Metadata:');
        console.log(JSON.stringify(metadata, null, 2));
        console.log('\n');

        // Confirm metadata update
        const shouldUpdate = await question('Would you like to update the metadata for mainnet? (yes/no): ');
        
        if (shouldUpdate.toLowerCase() === 'yes') {
            // Get new values
            console.log('\nEnter new values (press Enter to keep current value):\n');
            
            const name = await question(`Name (current: ${metadata.name}): `);
            const symbol = await question(`Symbol (current: ${metadata.symbol}): `);
            const description = await question(`Description (current: ${metadata.description}): `);
            
            // Update metadata object
            if (name) metadata.name = name;
            if (symbol) metadata.symbol = symbol.toUpperCase();
            if (description) metadata.description = description;

            // Image handling
            const updateImage = await question('\nWould you like to update the logo image? (yes/no): ');
            if (updateImage.toLowerCase() === 'yes') {
                console.log('\nPlease ensure your new logo.png is ready in the assets directory.');
                const confirmed = await question('Is the new logo.png file ready? (yes/no): ');
                
                if (confirmed.toLowerCase() === 'yes') {
                    // Verify logo exists
                    const logoPath = './assets/logo.png';
                    if (!fs.existsSync(logoPath)) {
                        throw new Error('logo.png not found in assets directory');
                    }
                    console.log('✓ Logo file verified');
                }
            }

            // Additional metadata fields
            console.log('\nAdditional Metadata Fields:');
            const addExternalUrl = await question('Add external URL? (yes/no): ');
            if (addExternalUrl.toLowerCase() === 'yes') {
                metadata.external_url = await question('External URL: ');
            }

            // Save updated metadata
            const backupPath = `./assets/metadata.backup.${Date.now()}.json`;
            fs.copyFileSync(metadataPath, backupPath);
            console.log(`\n✓ Backup created: ${path.basename(backupPath)}`);

            fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
            console.log('✓ Metadata updated successfully\n');

            // Display new metadata
            console.log('Updated Metadata:');
            console.log(JSON.stringify(metadata, null, 2));

            // Update mainnet config
            const mainnetConfigPath = './config.mainnet.json';
            const mainnetConfig = JSON.parse(fs.readFileSync(mainnetConfigPath, 'utf-8'));
            mainnetConfig.token.name = metadata.name;
            mainnetConfig.token.symbol = metadata.symbol;
            mainnetConfig.token.description = metadata.description;
            fs.writeFileSync(mainnetConfigPath, JSON.stringify(mainnetConfig, null, 2));
            console.log('\n✓ Mainnet configuration updated');

            // Deployment reminder
            console.log('\n⚠️  IMPORTANT:');
            console.log('1. Commit and push these changes to GitHub');
            console.log('2. Verify the metadata URL is accessible');
            console.log('3. Run deploy_mainnet.js to proceed with deployment');
        } else {
            console.log('\nMetadata update skipped. Using current metadata for mainnet deployment.');
        }

        // Final verification
        console.log('\n📋 Pre-deployment Metadata Checklist:');
        console.log('- [ ] Metadata content is final and accurate');
        console.log('- [ ] Logo image is high quality and appropriate size');
        console.log('- [ ] All URLs are permanent and accessible');
        console.log('- [ ] Changes are committed to GitHub');
        console.log('- [ ] Metadata URL is verified working\n');

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        process.exit(1);
    } finally {
        rl.close();
    }
}

main(); 