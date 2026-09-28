/**
 * 初始化数据库
 * 文档 https://www.sequelize.cn/
 */
import { Sequelize } from 'sequelize';

import { isPro } from '../common/other-tools.js';
import { createInstance as createUserInstance } from './user.js';
import { createInstance as createTokenInstance } from './token.js';
import { createInstance as createFriendlyLinkInstance } from './friendly-link.js';
import { createInstance as createNoteInstance } from './note.js';
import { createInstance as createFileInstance } from './file.js';
import { createInstance as createSystemFileInstance } from './system-file.js';

export let sequelize: any;
export async function initSql() {
    if (sequelize) {
        await sequelize.close().catch(() => {});
    }
    sequelize = new Sequelize(
        process.env.PROJECT_SQL_NAME || '',
        process.env.PROJECT_SQL_USER_NAME || '',
        process.env.PROJECT_SQL_PASSWORD || '',
        {
            host: 'localhost',
            dialect: 'mysql',
            logging: !isPro,
            define: {
                timestamps: false,
            },
        },
    );
    createUserInstance(sequelize);
    createTokenInstance(sequelize);
    createFriendlyLinkInstance(sequelize);
    createNoteInstance(sequelize);
    createFileInstance(sequelize);
    createSystemFileInstance(sequelize);
    await sequelize.sync({ alter: true });
}
