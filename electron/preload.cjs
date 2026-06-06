/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Secure Electron preload script that isolates native bridges
const { contextBridge, ipcRenderer } = require('electron');

// Expose secure functions to the React frontend under window.api
contextBridge.exposeInMainWorld('api', {
  backupDatabase: async (data) => {
    return await ipcRenderer.invoke('backup-db', data);
  },
  printReceipt: (htmlContent) => {
    // Simulated print or triggers system print dialog
    window.print();
  },
  getPlatform: () => process.platform,
});
