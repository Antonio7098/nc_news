const endpointsJson = require("../endpoints.json")
const {selectTopics} = require("./model")
// #1 Get documentation detailing all of the available API endpoints 
function getEndpoints(req, res) {
    res.status(200).send({endpoints: endpointsJson})
}

function getTopics(req, res) {
    return selectTopics().then((topics) => {
        return res.status(200).send({topics})
    })
}

module.exports = {getEndpoints, getTopics}