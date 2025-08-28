import { exec } from 'child_process';
import os from 'os';

// 🔹 Cross-platform printer fetcher
export default function getPrintersManual() {
  return new Promise((resolve, reject) => {
    if (os.platform() === 'win32') {
      // Windows: Use wmic to get printer names
      exec('wmic printer get name', (err, stdout, stderr) => {
        if (err) {
          return reject(stderr || err.message);
        }

        const printers = stdout
          .split('\n')
          .map(line => line.trim())
          .filter(line => line && line !== 'Name');

        resolve(printers);
      });
    } else {
      // Linux/macOS: Use lpstat
      exec('lpstat -p', (err, stdout, stderr) => {
        if (err) {
          return reject(stderr || err.message);
        }

        const printers = stdout
          .split('\n')
          .filter(line => line.startsWith('printer '))
          .map(line => line.split(' ')[1]);

        resolve(printers);
      });
    }
  });
}

// // Example usage
// (async () => {
//   try {
//     const printers = await getPrinters();
//     console.log('🖨️ Available Printers:', printers);
//   } catch (error) {
//     console.error('❌ Error fetching printers:', error);
//   }
// })();
