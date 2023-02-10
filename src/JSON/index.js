import { addDataToLibJson, getDataFromLibJson } from './file.js'

const oldData = getDataFromLibJson()
addDataToLibJson('historyLib', [
  {
    name: `name: ${oldData.historyLib.length}`,
    date: new Date(),
    number: Math.random(),
  },
  {
    name: `name: ${oldData.historyLib.length}`,
    date: new Date(),
    number: Math.random(),
  },
])

const res = getDataFromLibJson()

console.log('res', res)
