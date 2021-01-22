function revertMessage(error) {
    return 'VM Exception while processing transaction: revert ' + error;
}

module.exports = {
    revertMessage
}