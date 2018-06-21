const addZero(num) {
    if (num < 10) {
        return `0${num}`;
    }
    return num;
}

const getUtcTime = () => {
    var d = new Date();
    var h = addZero(d.getUTCHours());
    var m = addZero(d.getUTCMinutes());
    return `${h}:${m}`;
};

const consolelog = (message) => {
    console.log(`${}${message}`);
};

module.exports = { consolelog };
