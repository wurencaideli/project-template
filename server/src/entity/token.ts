import { DataTypes } from 'sequelize';

export let entityInstance: any;
export function createInstance(sequelize: any) {
    entityInstance = sequelize.define(
        'token',
        {
            uId: DataTypes.STRING,
            initDate: DataTypes.BIGINT,
            updateDate: DataTypes.BIGINT,
            userUId: DataTypes.STRING,
            userName: DataTypes.STRING,
            userRole: DataTypes.STRING,
            token: DataTypes.STRING,
        },
        {
            freezeTableName: true,
            tableName: 'token',
            indexes: [
                {
                    unique: true,
                    fields: ['userUId'],
                },
                {
                    unique: true,
                    fields: ['userName'],
                },
                {
                    unique: true,
                    fields: ['token'],
                },
            ],
        },
    );
    return entityInstance;
}