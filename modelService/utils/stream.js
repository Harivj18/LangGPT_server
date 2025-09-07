const streamAgentResponse = (req, res) => {
    res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    res.flushHeaders?.()

    const heartBeat = setInterval(() => {
        res.write(": keep-alive\n\n")
    }, 15000);

    req.on('close', () => {
        clearInterval(heartBeat)
        res.end()
    })

    return {
        streamData : (data, id) => {
            res.write(`id: ${id || Date.now()}\n`);
            res.write(`data: ${JSON.stringify(data)}\n\n`);
        },
    
        endStream : () => {
            res.write("data: [DONE]\n\n")
            res.end()
        }
    }
}

module.exports = { streamAgentResponse }