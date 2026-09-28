import { DataTypes } from 'sequelize';

export let entityInstance: any;
export function createInstance(sequelize: any) {
    entityInstance = sequelize.define(
        'user',
        {
            uId: DataTypes.STRING,
            initDate: DataTypes.BIGINT,
            updateDate: DataTypes.BIGINT,
            name: DataTypes.STRING,
            role: DataTypes.STRING,
            nickname: DataTypes.STRING,
            password: DataTypes.STRING,
            secret: DataTypes.STRING,
            synopsis: DataTypes.TEXT,
            avatar: DataTypes.STRING,
            about: DataTypes.TEXT,
        },
        {
            freezeTableName: true,
            tableName: 'user',
            indexes: [
                {
                    unique: true,
                    fields: ['uId'],
                },
                {
                    unique: true,
                    fields: ['name'],
                },
            ],
        },
    );
    return entityInstance;
}