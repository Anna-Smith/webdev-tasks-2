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
        return this;
    },
    where: function (field) {
        this.field = field;
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
    find: function (cb) {
        mongoClient.connect(this.url, (err, db) => {
            const col = db.collection(this.colName);
            let condition = getCondition(this);
            col.find(condition).toArray(function (err, result) {
                cb(null, result);
                db.close();
            });
        });
    }
};

function getCondition(thisArg) {
    let condition = {};
    if (thisArg.notFlag) {
        let expression = {};
        expression.$not = thisArg.expression;
        condition[thisArg.field] = expression;
    } else {
        condition[thisArg.field] = thisArg.expression;
    }
    return condition;
}
