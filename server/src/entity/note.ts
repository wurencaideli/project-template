import { DataTypes } from 'sequelize';

export let entityInstance: any;
export function createInstance(sequelize: any) {
    entityInstance = sequelize.define(
        'note',
        {
            uId: DataTypes.STRING,
            userUId: DataTypes.STRING,
            title: DataTypes.STRING,
            content: DataTypes.TEXT,
            hidden: DataTypes.BOOLEAN,
            pinned: DataTypes.BOOLEAN,
            initDate: DataTypes.BIGINT,
            updateDate: DataTypes.BIGINT,
        },
        {
            freezeTableName: true,
            tableName: 'note',
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
