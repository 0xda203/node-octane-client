module.exports = function (data, fields) {
    const result = {};
    fields.forEach(field => {
        if (data[field] !== undefined)
            result[field] = data[field];
    });
    return result;
}
