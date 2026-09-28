import { DataTypes } from 'sequelize';

export let entityInstance: any;
export function createInstance(sequelize: any) {
    entityInstance = sequelize.define(
        'file',
        {
            uId: DataTypes.STRING,
            userUId: DataTypes.STRING,
            fileName: DataTypes.STRING,
            originalName: DataTypes.STRING,
            size: DataTypes.BIGINT,
            path: DataTypes.STRING,
            mimeType: DataTypes.STRING,
            initDate: DataTypes.BIGINT,
            updateDate: DataTypes.BIGINT,
        },
        {
            freezeTableName: true,
            tableName: 'file',
            indexes: [
                {
                    unique: true,
                    fields: ['uId'],
                },
                {
                    fields: ['fileName'],
                },
                {
                    /** 非唯一：按上传者查"我的文件"用；同一用户可上传多个文件 */
                    fields: ['userUId'],
                },
            ],
        },
    );
    return entityInstance;
}