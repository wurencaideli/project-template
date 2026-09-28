import { DataTypes } from 'sequelize';

export let entityInstance: any;
export function createInstance(sequelize: any) {
    entityInstance = sequelize.define(
        'friendly-link',
        {
            uId: DataTypes.STRING,
            name: DataTypes.STRING,
            content: DataTypes.TEXT,
            link: DataTypes.STRING,
            icon: DataTypes.STRING,
            hidden: DataTypes.BOOLEAN,
            initDate: DataTypes.BIGINT,
            updateDate: DataTypes.BIGINT,
        },
        {
            freezeTableName: true,
            tableName: 'friendly_link',
            indexes: [
                {
                    unique: true,
                    fields: ['uId'],
                },
            ],
        },
    );
    return entityInstance;
}