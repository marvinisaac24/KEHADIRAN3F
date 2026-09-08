const fs = require('fs');
const content = fs.readFileSync('server.ts', 'utf8');

let newContent = content.replace(
  'import admin from "firebase-admin";',
  'import * as admin from "firebase-admin";'
);

fs.writeFileSync('server.ts', newContent);
console.log("Server patched");
