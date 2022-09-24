function expand(data) {
    const obj = {};
    Object.entries(data).forEach(([key, value]) => {
        obj[key] = value?.hasOwnProperty('data') ? value.data : value;
    });
    return obj;
}

module.exports = expand