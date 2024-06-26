// import { getChatGPTReply as getReply } from '../chatgpt/index.js'
import { getOpenAiReply as getReply, markdownToText } from '../openai/index.js'
import { botName, roomWhiteList, aliasWhiteList } from '../../config.js'
import moment from 'moment'
import { addConfig, allConfig } from './../db/configDb.js'
import { addDataToLibJson, getDataFromLibJson } from './../JSON/file.js'

const historyData = []
const pushFn = (item) => {
  historyData.push(item)
  if (historyData.length > 5) {
    addDataToLibJson('historyData', historyData.splice(0))
  }
}

const timerFn = (time) => {
  return new Promise((resolve) =>
    setTimeout(() => {
      resolve()
    }, time),
  )
}
/**
 * 默认消息发送
 * @param msg
 * @param bot
 * @returns {Promise<void>}
 */
export async function defaultMessage(msg, bot) {
  const contact = msg.talker() // 发消息人
  const receiver = msg.to() // 消息接收人
  const content = msg.text() // 消息内容
  const room = msg.room() // 是否是群消息

  const roomName = (await room?.topic()) || null // 群名称
  const alias = (await contact.alias()) || (await contact.name()) // 发消息人昵称
  const remarkName = await contact.alias() // 备注名称
  const name = await contact.name() // 微信名称
  const isText = msg.type() === bot.Message.Type.Text // 消息类型是否为文本
  const isRoom = (roomWhiteList.includes(roomName) || true) && content.includes(`${botName}`) // 是否在群聊白名单内并且艾特了机器人
  const isAlias = aliasWhiteList.includes(remarkName) || aliasWhiteList.includes(name) || true // 发消息的人是否在联系人白名单内
  const isBotSelf = botName === remarkName || botName === name // 是否是机器人自己

  const sendTime = moment(msg.date()),
    nowTime = moment(new Date())
  const isNowSend = nowTime.diff(sendTime, 'minute') < 5
  console.log('sendTime', msg.date(), 'now', new Date(), 'isNowSend', isNowSend)

  const data = {
    date: new Date(),
    name,
    remarkName,
    roomName,
    answer: content,
    reply: '',
  }

  if (content === '请把问题汇总数据给我,417125111' && isNowSend) {
    // const res = await allConfig();
    addDataToLibJson('historyData', historyData.splice(0))

    const list = getDataFromLibJson('historyData')
    // contact.say(a)
    try {
      const text = list
        .slice(-5)
        .map((item) => item.answer)
        .join('/n')
      const res = markdownToText(text)
      console.og('answers', res)
      await timerFn(2000)
      contact.say(`answers: 请去json浏览`)
    } catch (error) {
      contact.say('主人,它不让发')
    }
    return
  }

  // TODO 你们可以根据自己的需求修改这里的逻辑
  if (isText && !isBotSelf && isNowSend) {
    console.log(roomName, remarkName, name, content)
    try {
      // 区分群聊和私聊
      if (isRoom && room) {
        const res = await getReply(content.replace(`${botName}`, ''))
        data.reply = res
        pushFn(data)
        await timerFn(2000)
        await room.say(`@${name} ${res}`)
        return
      }
      // 私人聊天，白名单内的直接发送
      if (isAlias && !room) {
        const res = await getReply(content)
        data.reply = res
        pushFn(data)
        await timerFn(2000)
        await contact.say(res)
      }
    } catch (e) {
      console.error('error', e)
      contact.say(`主人, 机器人报错了`)
    }
  }
}

/**
 * 分片消息发送
 * @param message
 * @param bot
 * @returns {Promise<void>}
 */
export async function shardingMessage(message, bot) {
  const talker = message.talker()
  const isText = message.type() === bot.Message.Type.Text // 消息类型是否为文本
  if (talker.self() || message.type() > 10 || (talker.name() === '微信团队' && isText)) {
    return
  }
  const text = message.text()
  const room = message.room()
  if (!room) {
    console.log(`Chat GPT Enabled User: ${talker.name()}`)
    const response = await getChatGPTReply(text)
    await trySay(talker, response)
    return
  }
  let realText = splitMessage(text)
  // 如果是群聊但不是指定艾特人那么就不进行发送消息
  if (text.indexOf(`${botName}`) === -1) {
    return
  }
  realText = text.replace(`${botName}`, '')
  const topic = await room.topic()
  const response = await getChatGPTReply(realText)
  const result = `${realText}\n ---------------- \n ${response}`
  await trySay(room, result)
}

// 分片长度
const SINGLE_MESSAGE_MAX_SIZE = 500

/**
 * 发送
 * @param talker 发送哪个  room为群聊类 text为单人
 * @param msg
 * @returns {Promise<void>}
 */
async function trySay(talker, msg) {
  const messages = []
  let message = msg
  while (message.length > SINGLE_MESSAGE_MAX_SIZE) {
    messages.push(message.slice(0, SINGLE_MESSAGE_MAX_SIZE))
    message = message.slice(SINGLE_MESSAGE_MAX_SIZE)
  }
  messages.push(message)
  for (const msg of messages) {
    await talker.say(msg)
  }
}

/**
 * 分组消息
 * @param text
 * @returns {Promise<*>}
 */
async function splitMessage(text) {
  let realText = text
  const item = text.split('- - - - - - - - - - - - - - -')
  if (item.length > 1) {
    realText = item[item.length - 1]
  }
  return realText
}
