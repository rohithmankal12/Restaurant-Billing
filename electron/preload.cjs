const {contextBridge,ipcRenderer}=require('electron');
const api={};for(const name of ['authStatus','setupAuth','login','logout','changePassword','snapshot','saveMenu','deleteMenu','saveSettings','saveDraft','checkout','cancelInvoice','printers','print','testPrint','backup','restore','dataPath','exportCsv'])api[name]=(...args)=>ipcRenderer.invoke(name,...args);
contextBridge.exposeInMainWorld('desktop',api);
