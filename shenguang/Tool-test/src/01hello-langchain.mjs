import dotenv from "dotenv"
import {ChatOpenAI} from "@langchain/openai"

dotenv.config()

// 创建模型
const model = new ChatOpenAI({
    modelName: process.env.MODEL_NAME, //模型名字
    apiKey: process.env.API_KEY, //模型key
    configuration: {
        baseURL: process.env.BASE_URL, //模型地址
    },
});

const response = await model.invoke("介绍下自己");
console.log(response.content);