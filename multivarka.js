'use strict';

const mongoClient = require('mongodb').MongoClient;

module.exports = {
    server: function (url) {
        this.url = url;
        this.notFlag = false;
        return this;
    },
    collection: function (colName) {
        this.colName = colName;
        this.notFlag = false;
        return this;
    },
    where: function (field) {
        this.field = field;
        this.notFlag = false;
        return this;
    },
    equal: function (value) {
        this.expression = {$eq: value};
        return this;
    },
    lessThan: function (value) {
        this.expression = {$lt: value};
        return this;
    },
    greatThan: function (value) {
        this.expression = {$gt: value};
        return this;
    },
    include: function (values) {
        this.expression = {$in: values};
        return this;
    },
    not: function () {
        this.notFlag = !this.notFlag;
        return this;
    },
    set: function (field, value) {
        let updateData = {};
        updateData[field] = value;
        this.updateExpr = {$set: updateData};
        return this;
    },
    find: function (cb) {
        const thisCopy = Object.assign({}, this);
        doMongoRequest(thisCopy, 'find', cb);
    },
    remove: function (cb) {
        const thisCopy = Object.assign({}, this);
        doMongoRequest(thisCopy, 'remove', cb);
    },
    update: function (cb) {
        const thisCopy = Object.assign({}, this);
        doMongoRequest(thisCopy, 'update', cb);
    },
    insert: function (obj, cb) {
        this.obj = obj;
        const thisCopy = Object.assign({}, this);
        doMongoRequest(thisCopy, 'insert', cb);
    }
};

function getCondition(thisArg) {
    let condition = {};
    if (thisArg.field && thisArg.expression) {
        if (thisArg.notFlag) {
            let expression = {};
            expression.$not = thisArg.expression;
            condition[thisArg.field] = expression;
        } else {
            condition[thisArg.field] = thisArg.expression;
        }
    }
    return condition;
}

function doMongoRequest(multivarka, type, cb) {
    mongoClient.connect(multivarka.url, (err, db) => {
        const col = db.collection(multivarka.colName);
        let condition = getCondition(multivarka);
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
