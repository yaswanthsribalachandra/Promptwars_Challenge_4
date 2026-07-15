/* eslint-disable no-console */
import fs from 'fs';
import path from 'path';

try {
  const code = fs.readFileSync(path.join(process.cwd(), 'app.js'), 'utf8');

  // Set up mock window and document globals
  global.window = {
    speechSynthesis: {
      cancel: () => {},
      speak: () => {},
    },
  };
  global.document = {
    addEventListener: () => {},
  };

  // Try to parse/eval the code
  new Function(code);
  console.log('Syntax check: SUCCESS. No syntax errors found in app.js.');
} catch (err) {
  console.error('Syntax check: FAILED.');
  console.error(err);
  process.exit(1);
}
