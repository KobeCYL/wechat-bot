// 使用node.js写一个脚本关于获取./lib.json文件的数据函数,以及向./lib.json文件添加数据的函数

// Get data from ./lib.json
// const fs = require('fs')
import fs from 'fs'
 
import { dirname,join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
export function getDataFromLibJson(key) {
  let libJsonData
  try {
    const fileBuffer = fs.readFileSync(join(__dirname,'./lib.json'))
    libJsonData = JSON.parse(fileBuffer)
  } catch (err) {
    console.log(err)
  }
  if (key) {
    return libJsonData[key]
  }
  return libJsonData
}

// Add data to ./lib.json
export function addDataToLibJson(key, data, resourceType = 'Array') {
  let libJsonData
  console.log('key,data', key,data)
  try {
    const fileBuffer = fs.readFileSync(join(__dirname,'./lib.json'))
    libJsonData = JSON.parse(fileBuffer)

    // Add data to existing object in the json file and stringify it back to json format before writing it back to the file.
    if (resourceType === 'Array') {
      libJsonData[key] = libJsonData[key] || []

      if (Array.isArray(data), data.length > 0) {
        libJsonData[key].push(...data)
        libJsonData = {
          ...libJsonData,
          [key]: libJsonData[key],
        }
      } else {
        libJsonData = {
          ...libJsonData,
          [key]: [...libJsonData[key], data],
        }
      }
    } else if ('object') {
      libJsonData[key] = libJsonData[key] || {}

      libJsonData = {
        ...libJsonData,
        [key]: {
          ...libJsonData[key],
          ...data,
        },
      }
    } else {
      libJsonData = {
        ...libJsonData,
        [key]: data,
      }
    }
    console.log('newLibJsonData', libJsonData)

    const stringifiedLibJsonData = JSON.stringify(libJsonData)

    fs.writeFileSync('./lib.json', stringifiedLibJsonData)
  } catch (err) {
    console.log(err) // Log any errors that occur while trying to read or write the file
  }

  return libJsonData // Return the updated object from the json file
}
