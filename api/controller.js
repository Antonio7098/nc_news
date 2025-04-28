const endpointsJson = require("../endpoints.json")

// #1 Get documentation detailing all of the available API endpoints 
function getEndpoints(req, res) {
    res.status(200).send({endpoints: endpointsJson})
}

module.exports = {getEndpoints}