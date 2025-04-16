import { app } from 'electron';
import * as path from 'path';
import { PROTOCOL_NAME } from './config';

// Set up protocol handling
export function setupProtocol() {
  console.log('Checking protocol registration...');
  console.log('Supported protocols:', app.isDefaultProtocolClient(PROTOCOL_NAME));
  console.log('Command line args:', process.argv);

  if (process.defaultApp) {
    if (process.argv.length >= 2) {
      const success = app.setAsDefaultProtocolClient(PROTOCOL_NAME, process.execPath, [path.resolve(process.argv[1])]);
      console.log('Protocol registration (dev):', success);
    }
  } else {
    const success = app.setAsDefaultProtocolClient(PROTOCOL_NAME);
    console.log('Protocol registration (prod):', success);
  }
}