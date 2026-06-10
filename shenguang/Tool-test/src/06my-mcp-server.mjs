import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {StdioServerTransport} from '@modelcontextprotocol/sdk/server/stdio.js';
import {z} from 'zod';

// 数据库
const database = {
    users: {
        '001': {id: '001', name: '张三', email: 'zhangsan@example.com', role: 'admin'},
        '002': {id: '002', name: '李四', email: 'lisi@example.com', role: 'user'},
        '003': {id: '003', name: '王五', email: 'wangwu@example.com', role: 'user'},
    }
};

// MCP Server 实例
// 本质：
// 这是一个 JSON-RPC 服务器
// 它支持：
// tools
// resources
// prompts
// 通过 transport 和 Client 通信
const server = new McpServer({
    name: 'my-mcp-server',
    version: '1.0.0',
});


// 注册工具:查询用户信息
server.registerTool('query_user', {
    //元信息:工具的描述和输入参数
    description: '查询数据库中的用户信息。输入用户 ID，返回该用户的详细信息（姓名、邮箱、角色）。',
    inputSchema: {
        userId: z.string().describe('用户 ID，例如: 001, 002, 003'),
    },
}, async ({userId}) => {
    const user = database.users[userId];

    if (!user) {
        return {
            content: [
                {
                    type: 'text',
                    text: `用户 ID ${userId} 不存在。可用的 ID: 001, 002, 003`,
                },
            ],
        };
    }

    return {
        content: [
            {
                type: 'text',
                text: `用户信息：\n- ID: ${user.id}\n- 姓名: ${user.name}\n- 邮箱: ${user.email}\n- 角色: ${user.role}`,
            },
        ],
    };
});


// 注册资源:使用指南
server.registerResource('使用指南', 'docs://guide', {
    description: 'MCP Server 使用文档',
    mimeType: 'text/plain',
}, async () => {
    return {
        contents: [
            {
                uri: 'docs://guide',
                mimeType: 'text/plain',
                text: `MCP Server 使用指南

功能：提供用户查询等工具。

使用：在 Cursor 等 MCP Client 中通过自然语言对话，Cursor 会自动调用相应工具。`,
            },
        ],
    };
});


// 连接 MCP Server 和 Client
const transport = new StdioServerTransport();
await server.connect(transport);