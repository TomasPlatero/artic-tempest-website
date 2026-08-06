// Copy Aikido Zen Firewall to standalone build output
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const src = path.join('node_modules', '@aikidosec', 'firewall');
const dest = path.join('.next', 'standalone', 'node_modules', '@aikidosec');
fs.mkdirSync(dest, { recursive: true });
fs.cpSync(src, path.join(dest, 'firewall'), { recursive: true });
console.log('Zen Firewall copied to standalone output');
