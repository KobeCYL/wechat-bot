import { remark } from 'remark'
import stripMarkdown from 'strip-markdown'
import { Configuration, OpenAIApi } from 'openai'
import dotenv from 'dotenv'
const env = dotenv.config().parsed // 环境参数

const configuration = new Configuration({
  apiKey: env.OPENAI_API_KEY,
})
const openai = new OpenAIApi(configuration)
let i = 0

export async function getOpenAiReply(prompt) {
  console.log('🚀🚀🚀 / prompt', prompt)
  let response = null
  try {
    response = await openai.createCompletion({
      model: 'text-davinci-003',
      prompt: prompt,
      temperature: 0.9, // 每次返回的答案的相似度0-1（0：每次都一样，1：每次都不一样）
      max_tokens: 2000,
      top_p: 1,
      frequency_penalty: 0.0,
      presence_penalty: 0.6,
      stop: [' Human:', ' AI:'],
    })
    const reply = markdownToText(response?.data.choices[0].text)
    console.log('🚀🚀🚀 / reply', reply)
    if (reply) {
      i++
      console.log('次数:', i)
    }
    return reply
  } catch (error) {
    console.log('error', error)
  }
}

export function markdownToText(markdown) {
  return remark()
    .use(stripMarkdown)
    .processSync(markdown ?? '')
    .toString()
}
