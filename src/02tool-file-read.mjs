import 'dotenv/config';
import {ChatOpenAI} from '@langchain/openai'; //构建模型
import {tool} from '@langchain/core/tools'; //tool工具
import {HumanMessage, SystemMessage, ToolMessage} from '@langchain/core/messages'; //信息
import fs from 'node:fs/promises';
import {z} from 'zod';//校验

// 1. 创建模型
const model = new ChatOpenAI({
    modelName: process.env.MODEL_NAME,
    apiKey: process.env.OPENAI_API_KEY,
    temperature: 0, //温度
    configuration: {
        baseURL: process.env.OPENAI_BASE_URL,
    },
});

// 2. 创建tool工具
const readFileTool = tool(
    // 工具执行逻辑函数
    async ({filePath}) => {
        const content = await fs.readFile(filePath, 'utf-8');
        console.log(`  [工具调用] read_file("${filePath}") - 成功读取 ${content.length} 字节`);
        return `文件内容:\n${content}`;
    },
    // 工具说明书
    {
        name: 'read_file',
        description: '用此工具来读取文件内容。当用户要求读取文件、查看代码、分析文件内容时，调用此工具。输入文件路径（可以是相对路径或绝对路径）。',
        schema: z.object({
            filePath: z.string().describe('要读取的文件路径'),
        }),
    }
);

// 3. 注册工具
const tools = [
    readFileTool
];

// 4. 绑定工具到模型
const modelWithTools = model.bindTools(tools);

// 5. 定义消息
const messages = [
    // 设置系统信息
    new SystemMessage(`你是一个代码助手，可以使用工具读取文件并解释代码。
    工作流程：
    1. 用户要求读取文件时，立即调用 read_file 工具
    2. 等待工具返回文件内容
    3. 基于文件内容进行分析和解释
    
    可用工具：
    - read_file: 读取文件内容（使用此工具来获取文件内容）
    `),
    // 设置用户输入消息
    new HumanMessage('请读取 ./src/02tool-file-read.mjs 文件内容并解释代码')
];

// 6. 调用模型以及输出信息调用模型以及输出信息
let response = await modelWithTools.invoke(messages);
console.log("🚀 ~  ~ response: ", response);//这里其实是AIMessages

// 7. 把得到的回复放入消息列表中
messages.push(response);

// 8. 检测工具
while (response.tool_calls && response.tool_calls.length > 0) {

    console.log(`\n[检测到 ${response.tool_calls.length} 个工具调用]`);

    // 执行所有工具调用
    const toolResults = await Promise.all(
        response.tool_calls.map(async (toolCall) => {
            const tool = tools.find(t => t.name === toolCall.name);
            if (!tool) {
                return `错误: 找不到工具 ${toolCall.name}`;
            }

            console.log(`  [执行工具] ${toolCall.name}(${JSON.stringify(toolCall.args)})`);
            try {
                const result = await tool.invoke(toolCall.args);
                return result;
            } catch (error) {
                return `错误: ${error.message}`;
            }
        })
    );

    // 将工具结果添加到消息历史
    response.tool_calls.forEach((toolCall, index) => {
        messages.push(
            new ToolMessage({
                content: toolResults[index],
                tool_call_id: toolCall.id,
            })
        );
    });

    // 再次调用模型，传入工具结果
    response = await modelWithTools.invoke(messages);
}

console.log('\n[最终回复]');
console.log(response.content)

