'use strict';

const mongoClient = require('mongodb').MongoClient;

module.exports = {
    /**
     * Сохранение url
     * Обязательно для любых запросов
     * @param {String} url
     * @returns {exports}
     */
    server: function (url) {
        init(this);
        this.url = url;
        return this;
    },
    /**
     * Сохранение имени коллекции
     * Обязательно для любых запросов
     * @param {String} colName Имя коллекции
     * @returns {exports}
     */
    collection: function (colName) {
        init(this);
        this.colName = colName;
        return this;
    },
    /**
     * Сохранение названия поля, по которому будет выполнен запрос
     * Без указания where условие считается пустым {}
     * @param {String} field
     * @returns {exports}
     */
    where: function (field) {
        this.field = field;
        return this;
    },
    /**
     * Условие равенства поля this.field указанному значению value
     * Если this.field не указано, условие считается пустым {}
     * @param value
     * @returns {exports}
     */
    equal: function (value) {
        this.conditions.push(getCondition(this, {$eq: value}));
        return this;
    },
    /**
     * Условие, что this.field меньше чем значение value
     * Если this.field не указано, условие считается пустым {}
     * @param value
     * @returns {exports}
     */
    lessThan: function (value) {
        this.conditions.push(getCondition(this, {$lt: value}));
        return this;
    },
    /**
     * Условие, что this.field больше чем значение value
     * Если this.field не указано, условие считается пустым {}
     * @param value
     * @returns {exports}
     */
    greatThan: function (value) {
        this.conditions.push(getCondition(this, {$gt: value}));
        return this;
    },
    /**
     * Условие, что this.field находится в диапазоне значений values
     * Если this.field не указано, условие считается пустым {}
     * @param {Array} values
     * @returns {exports}
     */
    include: function (values) {
        this.conditions.push(getCondition(this, {$in: values}));
        return this;
    },
    /**
     * Отрицание следующего за ним условия
     * @returns {exports}
     */
    not: function () {
        this.notFlag = !this.notFlag;
        return this;
    },
    /**
     * Установка для выполнения update поля field значения value
     * Обязательно для запроса update
     * @param {String} field
     * @param value
     * @returns {exports}
     */
    set: function (field, value) {
        let updateData = {};
        updateData[field] = value;
        this.updateExpr = {$set: updateData};
        return this;
    },
    /**
     * Поиск по заданным условиями
     * @param {Function} cb
     */
    find: function (cb) {
        doMongoRequest(Object.assign({}, this), 'find', cb);
        init(this);
    },
    /**
     * Удаление по заданным условиям
     * @param {Function} cb
     */
    remove: function (cb) {
        doMongoRequest(Object.assign({}, this), 'remove', cb);
        init(this);
    },
    /**
     * Обновление по заданным условиям
     * @param {Function} cb
     */
    update: function (cb) {
        doMongoRequest(Object.assign({}, this), 'update', cb);
        init(this);
    },
    /**
     * Вставка данных в коллекцию
     * @param {Array | Object} obj
     * @param {Function} cb
     */
    insert: function (obj, cb) {
        this.obj = obj;
        doMongoRequest(Object.assign({}, this), 'insert', cb);
        init(this);
    }
};

/**
 * Инициализцаия мультиварки
 * @param self
 */
function init(self) {
    self.field = undefined;
    self.notFlag = false;
    self.conditions = [];
}

/**
 * Формирование условия запроса по заданному полю и выражению
 * @param self
 * @param {Object} expr
 * @returns {Object}
 */
function getCondition(self, expr) {
    let condition = {};
    if (self.field && expr) {
        if (self.notFlag) {
            let expression = {};
            expression.$not = expr;
            condition[self.field] = expression;
        } else {
            condition[self.field] = expr;
        }
    }
    // После формирования условия запроса поле и флаг обнуляются
    self.field = undefined;
    self.notFlag = false;
    return condition;
}

/**
 * Выполнение запроса к mongodb
 * @param {Object} multivarka
 * @param {String} type Тип запроса
 * @param {Function} cb
 */
function doMongoRequest(multivarka, type, cb) {
    mongoClient.connect(multivarka.url, (err, db) => {
        const col = db.collection(multivarka.colName);
        const condition = multivarka.conditions.length > 0 ? {$and: multivarka.conditions} : {};
        switch (type) {
            case 'find':
                col.find(condition).toArray(callback);
                break;
            case 'remove':
                col.deleteMany(condition, callback);
                break;
            case 'update':
                col.updateMany(condition, multivarka.updateExpr, callback);
                break;
            case 'insert':
                if (multivarka.obj instanceof Array) {
                    col.insertMany(multivarka.obj, callback);
                } else {
                    col.insertOne(multivarka.obj, callback);
                }
                break;
        }

        function callback(err, result) {
            cb(err, result);
            db.close();
        }
    });
}
