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

export let sequelize: any;
export async function initSql() {
    if (sequelize) {
        await sequelize.close().catch(() => {});
    }
    sequelize = new Sequelize(
        process.env.DUMOGU_sqlName || '',
        process.env.DUMOGU_sqlUserName || '',
        process.env.DUMOGU_sqlPassword || '',
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
    await sequelize.sync({ alter: true });
}
