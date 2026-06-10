// 本质目的就是验证：Node.js 能不能通过 child_process.spawn 去启动一个外部命令，并且把输出实时打印出来

import {spawn} from 'node:child_process';

// echo 在 windows 可能不支持，可以设置 shell: 'powershell.exe'
const command = 'echo -e "n\nn" | pnpm create vite react-todo-app --template react-ts';
const cwd = process.cwd();
// 解析命令和参数
const [cmd, ...args] = command.split(' ');

const child = spawn(cmd, args, {
    cwd,
    stdio: 'inherit', // 实时输出到控制台
    shell: true,
});

let errorMsg = '';

child.on('error', (error) => {
    errorMsg = error.message;
});

child.on('close', (code) => {
    if (code === 0) {
        process.exit(0);
    } else {
        if (errorMsg) {
            console.error(`错误: ${errorMsg}`);
        }
        process.exit(code || 1);
    }
});
