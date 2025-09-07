const searchTool = () => {
    return new Promise((resolve, reject) => {
        try {
            // https://serpapi.com/search.json?engine=google&q=Coffee
        } catch (error) {
            console.error('searchTool.js: searchTool => Error while using agent meeting tool', error);
            reject(error)
        }
    })  
}

module.exports = { searchTool }